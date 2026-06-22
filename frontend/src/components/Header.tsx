import { useNavigate, useLocation } from "react-router-dom";
import { logout, type User } from "../api/auth";
import { isDemoMode } from "../lib/demo";
import { C } from "../lib/theme";

interface Props {
  user: User;
  syncStatus: "idle" | "running";
}

export default function Header({ user, syncStatus }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname.startsWith("/app/analytics") ? "analytics" : "dashboard";

  const navBtn = (label: string, path: string, key: string) => (
    <button
      key={key}
      onClick={() => navigate(path)}
      style={{
        color: active === key ? "#fff" : C.muted,
        backgroundColor: active === key ? C.accent : "transparent",
        border: "none",
        borderRadius: "8px",
        padding: "6px 16px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <header
      style={{
        backgroundColor: C.card,
        borderBottom: `1px solid ${C.border}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", height: "56px" }}
        className="flex items-center justify-between"
      >
        {/* Brand */}
        <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: syncStatus === "running" ? "#f59e0b" : "#22c55e",
              boxShadow: syncStatus === "running" ? "0 0 8px #f59e0b88" : "0 0 8px #22c55e88",
              flexShrink: 0,
            }}
          />
          <span style={{ color: C.text, fontWeight: 600, fontSize: "14px", letterSpacing: "0.02em" }}>
            EmailClassifier
          </span>
          {isDemoMode() && (
            <span
              style={{
                backgroundColor: `${C.accent}33`,
                color: "#a5b4fc",
                border: `1px solid ${C.accent}55`,
                borderRadius: "5px",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                padding: "2px 7px",
                textTransform: "uppercase",
              }}
            >
              Demo
            </span>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-1">
          {navBtn("Dashboard", "/app", "dashboard")}
          {navBtn("Analytics", "/app/analytics", "analytics")}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <span style={{ color: C.muted, fontSize: "12px" }}>{user.email}</span>
          <button
            onClick={logout}
            style={{
              color: C.muted,
              backgroundColor: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              padding: "4px 12px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
