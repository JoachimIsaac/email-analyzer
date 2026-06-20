import { useEffect, useState } from "react";
import { fetchHealth } from "./api/health";
import type { HealthResponse } from "./api/client";
import { ApiError } from "./api/client";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; data: HealthResponse }
  | { kind: "error"; message: string };

function StatusBadge({ value }: { value: string }) {
  const className =
    value === "ok" ? "badge ok" : value === "loading" ? "badge loading" : "badge error";
  return <span className={className}>{value}</span>;
}

export default function App() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    fetchHealth()
      .then((data) => setState({ kind: "success", data }))
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? `API error (${err.status}): ${err.message}`
            : err instanceof Error
              ? err.message
              : "Unknown error";
        setState({ kind: "error", message });
      });
  }, []);

  return (
    <main className="app">
      <h1>Job Search Email Classifier</h1>
      <p className="subtitle">Phase 0 — system health</p>

      <div className="health-card">
        {state.kind === "loading" && (
          <>
            <div className="health-row">
              <span className="label">API</span>
              <StatusBadge value="loading" />
            </div>
            <div className="health-row">
              <span className="label">Database</span>
              <StatusBadge value="loading" />
            </div>
          </>
        )}

        {state.kind === "success" && (
          <>
            <div className="health-row">
              <span className="label">API</span>
              <StatusBadge value={state.data.status} />
            </div>
            <div className="health-row">
              <span className="label">Database</span>
              <StatusBadge value={state.data.database} />
            </div>
          </>
        )}

        {state.kind === "error" && (
          <p className="error-message">Could not reach backend: {state.message}</p>
        )}
      </div>
    </main>
  );
}
