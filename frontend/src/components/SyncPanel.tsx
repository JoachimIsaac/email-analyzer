import { useEffect, useRef, useState } from "react";
import { DEMO_MAX_SYNCS, getDemoSyncsUsed, isDemoMode, pollSyncStatus, startSync, type SyncJob } from "../api/sync";
import { C, card } from "../lib/theme";

const BATCH_SIZES = [10, 25, 50, 100, 200, 300, 500];

interface Props {
  onComplete: () => void;
  onStatusChange: (status: "idle" | "running") => void;
}

export default function SyncPanel({ onComplete, onStatusChange }: Props) {
  const [batchSize, setBatchSize] = useState(50);
  const [job, setJob] = useState<SyncJob | null>(null);
  const [syncsUsed, setSyncsUsed] = useState(() => isDemoMode() ? getDemoSyncsUsed() : 0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDemo = isDemoMode();
  const demoExhausted = isDemo && syncsUsed >= DEMO_MAX_SYNCS;

  const isRunning = job?.status === "pending" || job?.status === "running";
  const isDone = job?.status === "complete" || job?.status === "failed";

  useEffect(() => {
    onStatusChange(isRunning ? "running" : "idle");
  }, [isRunning, onStatusChange]);

  useEffect(() => {
    if (!job || isDone) {
      if (pollRef.current) clearInterval(pollRef.current);
      if (job?.status === "complete") onComplete();
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const updated = await pollSyncStatus(job.job_id);
        setJob(updated);
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [job?.status, job?.job_id]);

  async function handleSync() {
    setJob(null);
    const started = await startSync(batchSize);
    if (isDemo) setSyncsUsed(getDemoSyncsUsed());
    setJob({
      ...started,
      emails_fetched: 0,
      emails_classified: 0,
      emails_skipped: 0,
      new_classifications: 0,
      error_message: null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  }

  const pct =
    job && job.batch_size > 0
      ? Math.min(100, Math.round(((job.emails_classified + job.emails_skipped) / job.batch_size) * 100))
      : 0;

  const batchIdx = BATCH_SIZES.indexOf(batchSize) === -1 ? 2 : BATCH_SIZES.indexOf(batchSize);

  const barColor =
    job?.status === "failed"
      ? "#f87171"
      : job?.status === "complete"
      ? "#34d399"
      : "linear-gradient(90deg, #6366f1, #a78bfa)";

  return (
    <div style={{ ...card, padding: "20px 24px" }} className="flex flex-col gap-4">
      {/* Controls row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-col gap-1" style={{ flexShrink: 0 }}>
          <button
            onClick={handleSync}
            disabled={isRunning || demoExhausted}
            style={{
              backgroundColor: demoExhausted ? "#1f2937" : isRunning ? "#374151" : C.accent,
              color: demoExhausted ? C.muted : "#fff",
              border: demoExhausted ? `1px solid ${C.border}` : "none",
              borderRadius: "8px",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isRunning || demoExhausted ? "not-allowed" : "pointer",
              opacity: isRunning ? 0.6 : 1,
            }}
          >
            {isRunning ? "Syncing…" : demoExhausted ? "Demo limit reached" : "Sync Inbox"}
          </button>
          {isDemo && (
            <span style={{ fontSize: "10px", color: demoExhausted ? "#f87171" : C.muted, textAlign: "center" }}>
              {demoExhausted
                ? "All 3 demo syncs used"
                : `${DEMO_MAX_SYNCS - syncsUsed} of ${DEMO_MAX_SYNCS} syncs remaining`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-1" style={{ minWidth: "220px" }}>
          <span style={{ color: C.muted, fontSize: "12px", whiteSpace: "nowrap" }}>
            Batch size
          </span>
          <input
            type="range"
            min={0}
            max={BATCH_SIZES.length - 1}
            value={batchIdx}
            onChange={(e) => setBatchSize(BATCH_SIZES[Number(e.target.value)])}
            disabled={isRunning}
            style={{ flex: 1, accentColor: C.accent }}
          />
          <span style={{ color: C.text, fontSize: "13px", fontWeight: 600, minWidth: "36px", textAlign: "right" }}>
            {batchSize}
          </span>
        </div>
      </div>

      {/* Progress */}
      {job && (
        <div className="flex flex-col gap-2">
          <div
            style={{
              width: "100%",
              height: "6px",
              backgroundColor: C.border,
              borderRadius: "99px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                borderRadius: "99px",
                background: barColor,
                transition: "width 0.5s ease",
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: "12px", color: C.muted }}>
              {job.status === "failed" ? (
                <span style={{ color: "#f87171" }}>Error: {job.error_message}</span>
              ) : job.status === "complete" ? (
                <span style={{ color: "#34d399" }}>
                  Done — {job.new_classifications} new classification
                  {job.new_classifications !== 1 ? "s" : ""}
                </span>
              ) : (
                <>
                  Classified{" "}
                  <span style={{ color: C.text, fontWeight: 600 }}>{job.emails_classified}</span>
                  {" / "}
                  {job.batch_size} · Skipped {job.emails_skipped}
                </>
              )}
            </span>
            <span style={{ fontSize: "12px", color: C.muted }}>{pct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
