import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchFunnel, type FunnelData } from "../api/dashboard";
import { fetchSyncHistory, type SyncHistory } from "../api/sync";
import EmailTable from "../components/EmailTable";
import KpiCard from "../components/KpiCard";
import SyncPanel from "../components/SyncPanel";
import { C, card, LABEL_COLOR, LABEL_DISPLAY } from "../lib/theme";

interface Props {
  onSyncStatusChange: (s: "idle" | "running") => void;
}

function pct(n: number, d: number) {
  if (!d) return "0%";
  return `${((n / d) * 100).toFixed(1)}%`;
}

export default function DashboardPage({ onSyncStatusChange }: Props) {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [history, setHistory] = useState<SyncHistory | null>(null);
  const [filterLabel, setFilterLabel] = useState<string | undefined>(undefined);
  const [tableKey, setTableKey] = useState(0);

  const load = useCallback(() => {
    fetchFunnel().then(setFunnel).catch(console.error);
    fetchSyncHistory().then(setHistory).catch(console.error);
    setTableKey((k) => k + 1);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byLabel = Object.fromEntries(
    (funnel?.funnel ?? []).map((r) => [r.label, r.count])
  );
  const total = funnel?.total ?? 0;
  const appTotal =
    (byLabel.auto_acknowledgement ?? 0) +
    (byLabel.rejection ?? 0) +
    (byLabel.interview_invite ?? 0) +
    (byLabel.follow_up_required ?? 0) +
    (byLabel.offer ?? 0);

  const runChartData = (history?.runs ?? [])
    .slice()
    .reverse()
    .map((r, i) => ({
      run: `Run ${i + 1}`,
      label: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
      classified: r.emails_classified,
      newCount: r.new_classifications,
    }));

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        <KpiCard label="Total Runs" value={history?.total_runs ?? "—"} />
        <KpiCard label="Emails Classified" value={total} />
        <KpiCard label="Rejections" value={byLabel.rejection ?? 0} color={LABEL_COLOR.rejection} />
        <KpiCard label="Interviews" value={byLabel.interview_invite ?? 0} color={LABEL_COLOR.interview_invite} />
        <KpiCard label="Offers" value={byLabel.offer ?? 0} color={LABEL_COLOR.offer} />
        <KpiCard label="Recruiter Outreach" value={byLabel.recruiter_outreach ?? 0} color={LABEL_COLOR.recruiter_outreach} />
        <KpiCard label="Rejection Rate" value={pct(byLabel.rejection ?? 0, appTotal)} color={LABEL_COLOR.rejection} />
        <KpiCard
          label="Conversion Rate"
          value={pct((byLabel.interview_invite ?? 0) + (byLabel.offer ?? 0), appTotal)}
          color={LABEL_COLOR.offer}
        />
        <KpiCard
          label="Human Response Rate"
          value={pct(
            (byLabel.rejection ?? 0) +
              (byLabel.interview_invite ?? 0) +
              (byLabel.follow_up_required ?? 0) +
              (byLabel.offer ?? 0),
            appTotal
          )}
        />
      </div>

      {/* Sync panel */}
      <SyncPanel onComplete={load} onStatusChange={onSyncStatusChange} />

      {/* Per-run bar chart */}
      {runChartData.length > 0 && (
        <div style={{ ...card, padding: "20px 24px" }}>
          <p
            style={{
              color: C.muted,
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Emails Classified Per Run
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={runChartData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="run" tick={{ fill: C.muted, fontSize: 10 }} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: C.card2, border: `1px solid ${C.border}`, borderRadius: 8 }}
                labelStyle={{ color: C.text, fontWeight: 600, marginBottom: 4 }}
                formatter={(value) => [`${value} classified`, ""]}
              />
              <Bar dataKey="classified" fill={C.accent} radius={[4, 4, 0, 0]} name="Classified" maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Label filter pills */}
      {total > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterLabel(undefined)}
            style={{
              padding: "5px 14px",
              borderRadius: "99px",
              fontSize: "12px",
              fontWeight: 500,
              border: `1px solid ${!filterLabel ? C.accent : C.border}`,
              backgroundColor: !filterLabel ? `${C.accent}33` : "transparent",
              color: !filterLabel ? C.text : C.muted,
              cursor: "pointer",
            }}
          >
            All
          </button>
          {funnel?.funnel
            .filter((r) => r.count > 0)
            .map((r) => (
              <button
                key={r.label}
                onClick={() => setFilterLabel(r.label === filterLabel ? undefined : r.label)}
                style={{
                  padding: "5px 14px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: 500,
                  border: `1px solid ${filterLabel === r.label ? LABEL_COLOR[r.label] : C.border}`,
                  backgroundColor: filterLabel === r.label ? `${LABEL_COLOR[r.label]}22` : "transparent",
                  color: filterLabel === r.label ? LABEL_COLOR[r.label] : C.muted,
                  cursor: "pointer",
                }}
              >
                {LABEL_DISPLAY[r.label] ?? r.label} ({r.count})
              </button>
            ))}
        </div>
      )}

      {/* Email table */}
      <EmailTable filterLabel={filterLabel} refreshKey={tableKey} />
    </div>
  );
}
