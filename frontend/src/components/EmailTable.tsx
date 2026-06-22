import { useEffect, useState } from "react";
import { fetchEmails, type EmailItem } from "../api/dashboard";
import { C, card, LABEL_COLOR, LABEL_DISPLAY } from "../lib/theme";

const PAGE_SIZE = 20;

interface Props {
  filterLabel?: string;
  refreshKey?: number;
}

export default function EmailTable({ filterLabel, refreshKey = 0 }: Props) {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setPage(1); }, [filterLabel, refreshKey]);

  useEffect(() => {
    setLoading(true);
    fetchEmails(page, filterLabel)
      .then((data) => {
        setEmails(data.results);
        setTotal(data.count);
      })
      .finally(() => setLoading(false));
  }, [page, filterLabel, refreshKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const thStyle: React.CSSProperties = {
    color: C.muted,
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "10px 20px",
    textAlign: "left",
    borderBottom: `1px solid ${C.border}`,
  };

  return (
    <div style={{ ...card, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span style={{ color: C.muted, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Emails{filterLabel ? ` — ${LABEL_DISPLAY[filterLabel] ?? filterLabel}` : ""}
        </span>
        <span style={{ color: C.muted, fontSize: "11px" }}>{total} total</span>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: "13px" }}>
          Loading…
        </div>
      ) : emails.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: "13px" }}>
          No emails yet — run a sync.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Subject</th>
              <th style={{ ...thStyle, display: "none" }} className="md:table-cell">From</th>
              <th style={{ ...thStyle, display: "none" }} className="lg:table-cell">Date</th>
              <th style={thStyle}>Label</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Conf.</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((e, i) => (
              <tr
                key={e.id}
                style={{
                  borderBottom: i < emails.length - 1 ? `1px solid ${C.border}` : "none",
                }}
                onMouseEnter={(el) => (el.currentTarget.style.backgroundColor = C.card2)}
                onMouseLeave={(el) => (el.currentTarget.style.backgroundColor = "transparent")}
              >
                <td
                  style={{
                    padding: "11px 20px",
                    color: "#cbd5e1",
                    fontSize: "12px",
                    maxWidth: "220px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e.subject}
                </td>
                <td
                  style={{
                    padding: "11px 20px",
                    color: C.muted,
                    fontSize: "12px",
                    maxWidth: "160px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "none",
                  }}
                  className="md:table-cell"
                >
                  {e.sender}
                </td>
                <td
                  style={{
                    padding: "11px 20px",
                    color: C.muted,
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    display: "none",
                  }}
                  className="lg:table-cell"
                >
                  {new Date(e.received_at).toLocaleDateString()}
                </td>
                <td style={{ padding: "11px 20px" }}>
                  {e.label ? (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: LABEL_COLOR[e.label],
                        backgroundColor: `${LABEL_COLOR[e.label]}22`,
                      }}
                    >
                      {LABEL_DISPLAY[e.label] ?? e.label}
                    </span>
                  ) : (
                    <span style={{ color: C.muted }}>—</span>
                  )}
                </td>
                <td style={{ padding: "11px 20px", textAlign: "right", color: C.muted, fontSize: "12px" }}>
                  {e.confidence != null ? `${(e.confidence * 100).toFixed(0)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              background: "none",
              border: "none",
              color: page === 1 ? "#374151" : C.muted,
              fontSize: "12px",
              cursor: page === 1 ? "not-allowed" : "pointer",
            }}
          >
            ← Prev
          </button>
          <span style={{ color: C.muted, fontSize: "12px" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              background: "none",
              border: "none",
              color: page === totalPages ? "#374151" : C.muted,
              fontSize: "12px",
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
