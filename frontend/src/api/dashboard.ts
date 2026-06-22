import {
  demoFetchEmails,
  demoFetchFunnel,
  demoFetchTrends,
  isDemoMode,
} from "../lib/demo";
import { get } from "./client";

export interface FunnelRow {
  label: string;
  display: string;
  count: number;
}

export interface FunnelData {
  total: number;
  funnel: FunnelRow[];
}

export interface TrendRow {
  date: string;
  auto_acknowledgement: number;
  rejection: number;
  interview_invite: number;
  follow_up_required: number;
  recruiter_outreach: number;
  offer: number;
}

export interface TrendsData {
  trends: TrendRow[];
}

export interface EmailItem {
  id: number;
  gmail_message_id: string;
  sender: string;
  subject: string;
  body_snippet: string;
  received_at: string;
  label: string | null;
  confidence: number | null;
}

export interface EmailsPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: EmailItem[];
}

export function fetchFunnel(): Promise<FunnelData> {
  if (isDemoMode()) return Promise.resolve(demoFetchFunnel());
  return get<FunnelData>("dashboard/funnel");
}

export function fetchTrends(): Promise<TrendsData> {
  if (isDemoMode()) return Promise.resolve(demoFetchTrends() as TrendsData);
  return get<TrendsData>("dashboard/trends");
}

export function fetchEmails(page = 1, label?: string): Promise<EmailsPage> {
  if (isDemoMode()) return Promise.resolve(demoFetchEmails(page, label));
  const params = new URLSearchParams({ page: String(page) });
  if (label) params.set("label", label);
  return get<EmailsPage>(`emails?${params}`);
}
