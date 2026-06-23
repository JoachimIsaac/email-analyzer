/**
 * Demo mode — all data is local, no backend calls.
 *
 * Narrative arc across 3 syncs:
 *   Initial  : 8 emails — sparse early applications, few stats
 *   Sync 1   : +20 emails from ~4 weeks ago (bulk application week)
 *   Sync 2   : +18 emails from ~2 weeks ago (interviews + rejections rolling in)
 *   Sync 3   : +15 emails from this week   (final rounds, 2 offers)
 *
 * Every sync visibly changes all KPIs, the email table, and the trend chart.
 */

import { LABEL_DISPLAY } from "./theme";
import type { EmailItem, EmailsPage, FunnelData, TrendsData } from "../api/dashboard";
import type { SyncHistory, SyncJob } from "../api/sync";
import type { User } from "../api/auth";

// ─── Flag helpers ─────────────────────────────────────────────────────────────

export const DEMO_FLAG     = "demo_mode";
export const DEMO_SYNCS_KEY = "demo_syncs_used";

export const isDemoMode       = () => localStorage.getItem(DEMO_FLAG) === "1";
export const getDemoSyncsUsed = () => parseInt(localStorage.getItem(DEMO_SYNCS_KEY) ?? "0", 10);
export const DEMO_MAX_SYNCS   = 3;

export function enterDemo() {
  localStorage.setItem(DEMO_FLAG, "1");
  localStorage.setItem(DEMO_SYNCS_KEY, "0");
  _demoState  = buildInitialState();
  _activeJob  = null;
  window.location.href = "/app";
}

export function exitDemo() {
  localStorage.removeItem(DEMO_FLAG);
  localStorage.removeItem(DEMO_SYNCS_KEY);
  _demoState = null;
  _activeJob = null;
  window.location.href = "/";
}

// ─── Fake user ────────────────────────────────────────────────────────────────

export const DEMO_USER: User = {
  id: 0,
  email: "demo@jobclassifier.app",
  first_name: "Demo",
  last_name: "User",
};

// ─── Email seed data ──────────────────────────────────────────────────────────

interface Seed {
  sender: string;
  subject: string;
  label: string;
  conf: number;
  daysAgo: number;
}

// ── Initial state: 8 emails, ~5 weeks ago ─────────────────────────────────────
const INITIAL_SEEDS: Seed[] = [
  { sender: "recruiting@google.com",    subject: "Thank you for applying – Software Engineer at Google",       label: "auto_acknowledgement", conf: 0.97, daysAgo: 38 },
  { sender: "no-reply@greenhouse.io",   subject: "Application received – Backend Engineer @ Meta",             label: "auto_acknowledgement", conf: 0.95, daysAgo: 37 },
  { sender: "careers@amazon.jobs",      subject: "We received your application: SDE II – AWS",                 label: "auto_acknowledgement", conf: 0.96, daysAgo: 36 },
  { sender: "sarah.chen@recruiter.co",  subject: "Exciting opportunity: Senior Eng at a top fintech (remote)", label: "recruiter_outreach",   conf: 0.90, daysAgo: 35 },
  { sender: "no-reply@workday.com",     subject: "Application Submitted – Figma, Full Stack Engineer",         label: "auto_acknowledgement", conf: 0.96, daysAgo: 35 },
  { sender: "recruiting@stripe.com",    subject: "We received your application – Stripe Engineering",          label: "auto_acknowledgement", conf: 0.94, daysAgo: 34 },
  { sender: "priya.nair@searchfirm.com",subject: "I came across your profile – SWE opportunity",               label: "recruiter_outreach",   conf: 0.87, daysAgo: 34 },
  { sender: "no-reply@lever.co",        subject: "Application Confirmed – Vercel, Platform Engineer",          label: "auto_acknowledgement", conf: 0.95, daysAgo: 33 },
];

// ── Sync 1: +20 emails — the bulk application week (days 32–22 ago) ───────────
const SYNC_BATCH_1: Seed[] = [
  { sender: "no-reply@ashbyhq.com",      subject: "Application received – Cloudflare, Systems Engineer",      label: "auto_acknowledgement", conf: 0.97, daysAgo: 32 },
  { sender: "careers@shopify.com",       subject: "Application Confirmed – Senior Engineer at Shopify",        label: "auto_acknowledgement", conf: 0.95, daysAgo: 32 },
  { sender: "recruiting@discord.com",    subject: "Thanks for applying – Discord, Infrastructure Eng",         label: "auto_acknowledgement", conf: 0.96, daysAgo: 31 },
  { sender: "no-reply@lever.co",         subject: "Application Confirmed – Supabase, Developer Advocate",      label: "auto_acknowledgement", conf: 0.94, daysAgo: 31 },
  { sender: "careers@notion.so",         subject: "Application Received – Notion, Senior Software Engineer",   label: "auto_acknowledgement", conf: 0.95, daysAgo: 30 },
  { sender: "no-reply@greenhouse.io",    subject: "Application Confirmed – Linear, Full Stack Engineer",       label: "auto_acknowledgement", conf: 0.96, daysAgo: 30 },
  { sender: "james.wu@toptalent.io",     subject: "Are you open to a Staff Eng role at a Series C startup?",   label: "recruiter_outreach",   conf: 0.89, daysAgo: 29 },
  { sender: "no-reply@workday.com",      subject: "Application Submitted – Datadog, Senior SWE",              label: "auto_acknowledgement", conf: 0.94, daysAgo: 29 },
  { sender: "no-reply@ashbyhq.com",      subject: "Application Received – Retool, Backend Engineer",           label: "auto_acknowledgement", conf: 0.95, daysAgo: 28 },
  { sender: "alex.morgan@recruits.dev",  subject: "Backend Eng role at well-funded AI startup – interested?",  label: "recruiter_outreach",   conf: 0.88, daysAgo: 28 },
  { sender: "no-reply@lever.co",         subject: "Application Confirmed – Brex, Infrastructure Engineer",     label: "auto_acknowledgement", conf: 0.96, daysAgo: 27 },
  { sender: "careers@ramp.com",          subject: "Application received – Ramp, Platform Engineer",            label: "auto_acknowledgement", conf: 0.94, daysAgo: 27 },
  { sender: "recruiting@plaid.com",      subject: "Application Confirmed – Plaid, Full Stack Engineer",        label: "auto_acknowledgement", conf: 0.95, daysAgo: 26 },
  { sender: "no-reply@greenhouse.io",    subject: "Application received – Rippling, Senior Engineer",          label: "auto_acknowledgement", conf: 0.96, daysAgo: 26 },
  { sender: "emily.park@techrecruit.io", subject: "Thought you'd be a great fit for this Principal Eng role",  label: "recruiter_outreach",   conf: 0.87, daysAgo: 25 },
  { sender: "no-reply@ashbyhq.com",      subject: "Application Confirmed – Mercury, Backend Engineer",         label: "auto_acknowledgement", conf: 0.95, daysAgo: 25 },
  { sender: "careers@loom.com",          subject: "Application Received – Loom, Senior Software Engineer",     label: "auto_acknowledgement", conf: 0.94, daysAgo: 24 },
  { sender: "no-reply@lever.co",         subject: "Application Confirmed – Fly.io, Platform Engineer",         label: "auto_acknowledgement", conf: 0.95, daysAgo: 23 },
  { sender: "ben.taylor@execsearch.com", subject: "Staff Eng opportunity – Pre-IPO company (remote, $180k+)",  label: "recruiter_outreach",   conf: 0.90, daysAgo: 23 },
  { sender: "no-reply@workday.com",      subject: "Application Submitted – Atlassian, Senior SWE",             label: "auto_acknowledgement", conf: 0.94, daysAgo: 22 },
];

// ── Sync 2: +18 emails — interviews & rejections rolling in (days 21–8 ago) ───
const SYNC_BATCH_2: Seed[] = [
  { sender: "recruiting@stripe.com",     subject: "Next steps for your Stripe application – let's chat",       label: "interview_invite",     conf: 0.93, daysAgo: 21 },
  { sender: "careers@notion.so",         subject: "We've reviewed your application at Notion",                  label: "rejection",            conf: 0.87, daysAgo: 20 },
  { sender: "talent@airbnb.com",         subject: "Interview invitation – Full Stack Engineer at Airbnb",       label: "interview_invite",     conf: 0.92, daysAgo: 20 },
  { sender: "recruiting@shopify.com",    subject: "Update on your application – Senior Engineer, Shopify",      label: "rejection",            conf: 0.88, daysAgo: 19 },
  { sender: "recruiting@vercel.com",     subject: "Vercel is moving forward – technical screen inside",         label: "interview_invite",     conf: 0.94, daysAgo: 18 },
  { sender: "careers@hashicorp.com",     subject: "HashiCorp Application Update – Senior Engineer",             label: "rejection",            conf: 0.85, daysAgo: 18 },
  { sender: "hiring@linear.app",         subject: "Linear – we'd love to schedule a technical screen",          label: "interview_invite",     conf: 0.93, daysAgo: 17 },
  { sender: "careers@discord.com",       subject: "Update on your application at Discord",                      label: "rejection",            conf: 0.86, daysAgo: 16 },
  { sender: "recruiting@figma.com",      subject: "Congrats! We'd like to move forward – Figma Engineering",    label: "interview_invite",     conf: 0.95, daysAgo: 15 },
  { sender: "careers@atlassian.com",     subject: "Your application status update at Atlassian",                label: "rejection",            conf: 0.85, daysAgo: 14 },
  { sender: "careers@retool.com",        subject: "Retool would like to schedule a chat – Eng role",            label: "interview_invite",     conf: 0.91, daysAgo: 13 },
  { sender: "recruiting@twilio.com",     subject: "We've reviewed your application at Twilio",                  label: "rejection",            conf: 0.87, daysAgo: 12 },
  { sender: "recruiting@mercury.com",    subject: "We're moving forward – Engineering at Mercury",              label: "interview_invite",     conf: 0.92, daysAgo: 11 },
  { sender: "careers@ramp.com",          subject: "Ramp Application Update – Platform Engineer",                label: "rejection",            conf: 0.84, daysAgo: 10 },
  { sender: "careers@linear.app",        subject: "Following up on your application – action needed",           label: "follow_up_required",   conf: 0.85, daysAgo: 9  },
  { sender: "hiring@plaid.com",          subject: "Plaid – please complete your technical assessment",          label: "follow_up_required",   conf: 0.84, daysAgo: 9  },
  { sender: "recruiting@anthropic.com",  subject: "Anthropic – scheduling your systems design round",           label: "interview_invite",     conf: 0.94, daysAgo: 8  },
  { sender: "mark.li@recruiterco.com",   subject: "Backend role at stealth AI startup ($80M Series B)",         label: "recruiter_outreach",   conf: 0.89, daysAgo: 8  },
];

// ── Sync 3: +15 emails — this week (final rounds + 2 offers) ─────────────────
const SYNC_BATCH_3: Seed[] = [
  { sender: "recruiting@stripe.com",     subject: "Stripe final round – systems design on Thursday",            label: "interview_invite",     conf: 0.95, daysAgo: 7  },
  { sender: "careers@brex.com",          subject: "Update on your Brex application",                           label: "rejection",            conf: 0.86, daysAgo: 6  },
  { sender: "recruiting@vercel.com",     subject: "Vercel final round – meet the team on Friday",              label: "interview_invite",     conf: 0.96, daysAgo: 5  },
  { sender: "no-reply@ashbyhq.com",      subject: "Application Confirmed – Anthropic, Infra Engineer",         label: "auto_acknowledgement", conf: 0.94, daysAgo: 5  },
  { sender: "anna.rogers@srchfirm.com",  subject: "VP Eng opportunity – Series D, $200k+ (are you open?)",     label: "recruiter_outreach",   conf: 0.88, daysAgo: 4  },
  { sender: "careers@figma.com",         subject: "Figma – scheduling your final round this week",             label: "interview_invite",     conf: 0.94, daysAgo: 4  },
  { sender: "careers@rippling.com",      subject: "Rippling Application Update – Senior Engineer",             label: "rejection",            conf: 0.85, daysAgo: 3  },
  { sender: "hiring@mercury.com",        subject: "Mercury – one more step: reference check",                  label: "follow_up_required",   conf: 0.86, daysAgo: 3  },
  { sender: "recruiting@anthropic.com",  subject: "Anthropic – scheduling offer call",                         label: "interview_invite",     conf: 0.96, daysAgo: 2  },
  { sender: "careers@linear.app",        subject: "Linear Application Update – decision inside",               label: "rejection",            conf: 0.84, daysAgo: 2  },
  { sender: "offers@vercel.com",         subject: "Your offer letter – Senior Engineer at Vercel 🎉",          label: "offer",                conf: 0.99, daysAgo: 1  },
  { sender: "no-reply@lever.co",         subject: "Application Confirmed – OpenAI, Research Infra Engineer",   label: "auto_acknowledgement", conf: 0.96, daysAgo: 1  },
  { sender: "lisa.chan@toptech.io",       subject: "Are you still exploring? – quick question",                 label: "recruiter_outreach",   conf: 0.86, daysAgo: 1  },
  { sender: "offers@anthropic.com",      subject: "Offer – Software Engineer, Inference at Anthropic 🎉",     label: "offer",                conf: 0.99, daysAgo: 0  },
  { sender: "recruiting@figma.com",      subject: "Figma – we're preparing your offer, details soon",          label: "follow_up_required",   conf: 0.88, daysAgo: 0  },
];

const SYNC_BATCHES = [SYNC_BATCH_1, SYNC_BATCH_2, SYNC_BATCH_3];

// ─── State management ─────────────────────────────────────────────────────────

interface DemoState {
  emails: EmailItem[];
  runs: Array<{
    job_id: number;
    batch_size: number;
    emails_classified: number;
    new_classifications: number;
    created_at: string;
  }>;
}

let _demoState: DemoState | null = null;

function todayMinus(days: number): string {
  const d = new Date("2026-06-20T12:00:00Z");
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function seedToEmail(s: Seed, id: number): EmailItem {
  return {
    id,
    gmail_message_id: `demo_${id}`,
    sender: s.sender,
    subject: s.subject,
    body_snippet: `${s.subject} — from ${s.sender.split("@")[1] ?? "company"}.`,
    received_at: todayMinus(s.daysAgo),
    label: s.label,
    confidence: s.conf,
  };
}

function buildInitialState(): DemoState {
  return {
    emails: INITIAL_SEEDS.map((s, i) => seedToEmail(s, i + 1)),
    runs: [],
  };
}

function getState(): DemoState {
  if (!_demoState) _demoState = buildInitialState();
  return _demoState;
}

// ─── Sync simulation ──────────────────────────────────────────────────────────

const DEMO_SYNC_MS = 5000; // 5-second animated progress

interface ActiveJob {
  jobId: number;
  startMs: number;
  batchSize: number;
  batchEmails: EmailItem[];
  committed: boolean;
}

let _activeJob: ActiveJob | null = null;

// ─── Public API equivalents ───────────────────────────────────────────────────

export function demoStartSync(batchSize: number): Pick<SyncJob, "job_id" | "status" | "batch_size"> {
  const syncsUsed = getDemoSyncsUsed();
  if (syncsUsed >= DEMO_MAX_SYNCS) throw new Error("No demo syncs remaining.");

  const batch = SYNC_BATCHES[syncsUsed];
  const state = getState();
  const startId = state.emails.length + 1;
  const batchEmails = batch.map((s, i) => seedToEmail(s, startId + i));

  const jobId = Date.now();
  _activeJob = { jobId, startMs: Date.now(), batchSize, batchEmails, committed: false };

  localStorage.setItem(DEMO_SYNCS_KEY, String(syncsUsed + 1));

  return { job_id: jobId, status: "running", batch_size: batchSize };
}

export function demoPollSync(jobId: number): SyncJob {
  const now = Date.now();

  if (!_activeJob || _activeJob.jobId !== jobId) {
    return {
      job_id: jobId, status: "complete", batch_size: 0,
      emails_fetched: 0, emails_classified: 0, emails_skipped: 0,
      new_classifications: 0, error_message: null,
      created_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString(),
    };
  }

  const job = _activeJob;
  const elapsed  = now - job.startMs;
  const progress = Math.min(1, elapsed / DEMO_SYNC_MS);
  const total    = job.batchEmails.length;
  const processed = Math.floor(progress * total);
  const skipped   = Math.floor(processed * 0.12); // ~12% irrelevant
  const classified = processed - skipped;

  if (progress >= 1 && !job.committed) {
    job.committed = true;
    const state = getState();
    state.emails.push(...job.batchEmails);
    state.runs.push({
      job_id: job.jobId,
      batch_size: job.batchSize,
      emails_classified: total,
      new_classifications: total,
      created_at: new Date(job.startMs).toISOString(),
    });
  }

  return {
    job_id: jobId,
    status:            progress >= 1 ? "complete" : "running",
    batch_size:        job.batchSize,
    emails_fetched:    total,
    emails_classified: progress >= 1 ? total          : classified,
    emails_skipped:    progress >= 1 ? Math.floor(total * 0.12) : skipped,
    new_classifications: progress >= 1 ? total        : classified,
    error_message: null,
    created_at:   new Date(job.startMs).toISOString(),
    updated_at:   new Date(now).toISOString(),
  };
}

export function demoFetchFunnel(): FunnelData {
  const emails = getState().emails;
  const counts: Record<string, number> = {};
  for (const e of emails) {
    if (e.label) counts[e.label] = (counts[e.label] ?? 0) + 1;
  }
  const funnel = Object.keys(LABEL_DISPLAY).map((label) => ({
    label,
    display: LABEL_DISPLAY[label] ?? label,
    count: counts[label] ?? 0,
  }));
  return { total: emails.length, funnel };
}

export function demoFetchTrends(): TrendsData {
  const emails = getState().emails;
  const byDate: Record<string, Record<string, number>> = {};
  for (const e of emails) {
    if (!e.label) continue;
    const date = e.received_at.slice(0, 10);
    if (!byDate[date]) byDate[date] = {};
    byDate[date][e.label] = (byDate[date][e.label] ?? 0) + 1;
  }
  const labels = Object.keys(LABEL_DISPLAY);
  const trends = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => {
      const row: Record<string, unknown> = { date };
      for (const l of labels) row[l] = counts[l] ?? 0;
      return row;
    });
  return { trends: trends as unknown as TrendsData["trends"] };
}

export function demoFetchEmails(page: number, label?: string): EmailsPage {
  let emails = [...getState().emails].sort(
    (a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
  );
  if (label) emails = emails.filter((e) => e.label === label);
  const PAGE = 20;
  const count = emails.length;
  const results = emails.slice((page - 1) * PAGE, page * PAGE);
  return { count, results, next: null, previous: null };
}

export function demoFetchHistory(): SyncHistory {
  const state = getState();
  return {
    total_runs: state.runs.length,
    runs: [...state.runs].reverse(),
  };
}
