import { api } from "./client";
import type { HealthResponse } from "./client";

export function fetchHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>("/api/health/");
}
