import {
  DEMO_MAX_SYNCS,
  demoFetchHistory,
  demoPollSync,
  demoStartSync,
  getDemoSyncsUsed,
  isDemoMode,
} from "../lib/demo";
import { get, post } from "./client";

export interface SyncJob {
  job_id: number;
  status: "pending" | "running" | "complete" | "failed";
  batch_size: number;
  emails_fetched: number;
  emails_classified: number;
  emails_skipped: number;
  new_classifications: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncRun {
  job_id: number;
  batch_size: number;
  emails_classified: number;
  new_classifications: number;
  created_at: string;
}

export interface SyncHistory {
  total_runs: number;
  runs: SyncRun[];
}

export function startSync(batch_size: number): Promise<Pick<SyncJob, "job_id" | "status" | "batch_size">> {
  if (isDemoMode()) {
    const syncsLeft = DEMO_MAX_SYNCS - getDemoSyncsUsed();
    if (syncsLeft <= 0) return Promise.reject(new Error("No demo syncs remaining."));
    return Promise.resolve(demoStartSync(batch_size));
  }
  return post<Pick<SyncJob, "job_id" | "status" | "batch_size">>("sync", { batch_size });
}

export function pollSyncStatus(job_id: number): Promise<SyncJob> {
  if (isDemoMode()) return Promise.resolve(demoPollSync(job_id));
  return get<SyncJob>(`sync/status/${job_id}`);
}

export function fetchSyncHistory(): Promise<SyncHistory> {
  if (isDemoMode()) return Promise.resolve(demoFetchHistory());
  return get<SyncHistory>("sync/history");
}

export { DEMO_MAX_SYNCS, getDemoSyncsUsed, isDemoMode };
