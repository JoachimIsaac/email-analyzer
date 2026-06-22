import { useNavigate } from "react-router-dom";
import { enterDemo } from "../lib/demo";
import { startGoogleLogin } from "../api/auth";
import { C, LABEL_COLOR, LABEL_DISPLAY } from "../lib/theme";

// ─── Tiny helpers ──────────────────────────────────────────────────────────────

const NAV_H = 64;

function LabelBadge({ label }: { label: string }) {
  const color = LABEL_COLOR[label] ?? C.accent;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: "5px",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color,
        backgroundColor: `${color}22`,
      }}
    >
      {LABEL_DISPLAY[label] ?? label}
    </span>
  );
}

function EmailCard({
  from,
  subject,
  snippet,
  label,
  time,
}: {
  from: string;
  subject: string;
  snippet: string;
  label: string;
  time: string;
}) {
  return (
    <div
      style={{
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {from}
        </span>
        <span style={{ color: C.muted, fontSize: "11px", flexShrink: 0 }}>{time}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ color: C.text, fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {subject}
        </span>
        <LabelBadge label={label} />
      </div>
      <span style={{ color: C.muted, fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {snippet}
      </span>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "14px",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "28px" }}>{icon}</span>
      <h3 style={{ color: C.text, fontSize: "16px", fontWeight: 700, margin: 0 }}>{title}</h3>
      <p style={{ color: C.muted, fontSize: "14px", lineHeight: 1.65, margin: 0 }}>{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center" }}>
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.accent}, #818cf8)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: 700,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <h4 style={{ color: C.text, fontSize: "15px", fontWeight: 600, margin: 0 }}>{title}</h4>
      <p style={{ color: C.muted, fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{body}</p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  const ctaPrimary: React.CSSProperties = {
    backgroundColor: C.accent,
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    padding: "13px 28px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.01em",
  };

  const ctaSecondary: React.CSSProperties = {
    backgroundColor: "transparent",
    color: C.text,
    border: `1px solid ${C.border}`,
    borderRadius: "9px",
    padding: "12px 28px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const section: React.CSSProperties = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px",
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh", color: C.text }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: `${C.bg}ee`,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${C.border}`,
          height: `${NAV_H}px`,
        }}
      >
        <div
          style={{ ...section, height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>📬</span>
            <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "0.01em" }}>InboxIQ</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={enterDemo}
              style={{
                ...ctaSecondary,
                padding: "8px 18px",
                fontSize: "13px",
              }}
            >
              Try Demo
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                ...ctaPrimary,
                padding: "8px 18px",
                fontSize: "13px",
              }}
            >
              Sign In →
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{ padding: "100px 0 80px" }}>
        <div style={{ ...section, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "32px" }}>

          {/* Pill badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: `${C.accent}18`,
              border: `1px solid ${C.accent}44`,
              borderRadius: "99px",
              padding: "6px 16px",
              fontSize: "12px",
              color: "#a5b4fc",
              fontWeight: 500,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
              }}
            />
            Powered by GPT-4o mini · Works with any Gmail account
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h1
              style={{
                fontSize: "clamp(36px, 5.5vw, 62px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                margin: 0,
                background: "linear-gradient(135deg, #f1f5f9 30%, #a5b4fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your job-search inbox,<br />finally under control.
            </h1>
            <p
              style={{
                color: C.muted,
                fontSize: "clamp(15px, 2vw, 18px)",
                lineHeight: 1.7,
                maxWidth: "580px",
                margin: "0 auto",
              }}
            >
              Stop drowning in application emails. InboxIQ connects to Gmail,
              reads every message with AI, and instantly categorizes
              rejections, interviews, offers, and recruiter outreach — so you
              always know exactly where you stand.
            </p>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            <button onClick={enterDemo} style={{ ...ctaPrimary, fontSize: "15px", padding: "14px 32px" }}>
              Try the Demo — no sign-up needed
            </button>
            <button onClick={() => navigate("/login")} style={{ ...ctaSecondary, fontSize: "15px", padding: "14px 32px" }}>
              Connect my Gmail →
            </button>
          </div>

          <p style={{ color: "#374151", fontSize: "12px", margin: 0 }}>
            Read-only Gmail access · No emails stored without classification · Free to use
          </p>
        </div>
      </section>

      {/* ── Email preview strip ──────────────────────────────── */}
      <section style={{ padding: "0 0 90px" }}>
        <div style={section}>
          <div
            style={{
              backgroundColor: C.card2,
              border: `1px solid ${C.border}`,
              borderRadius: "18px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {["#f87171", "#fbbf24", "#34d399"].map((c) => (
                  <span key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: c, display: "inline-block" }} />
                ))}
              </div>
              <span style={{ color: C.muted, fontSize: "12px" }}>Gmail · Job Search</span>
            </div>
            <EmailCard from="recruiting@stripe.com"    subject="Next steps for your Software Engineer application"          snippet="Hi — the team loved your background. We'd like to schedule a technical screen…" label="interview_invite"     time="2h ago" />
            <EmailCard from="no-reply@greenhouse.io"   subject="Application received – Backend Engineer @ Meta"             snippet="Thanks for applying to the Backend Engineer role. We'll be in touch…"          label="auto_acknowledgement" time="1d ago" />
            <EmailCard from="careers@notion.so"        subject="We've reviewed your application at Notion"                  snippet="After careful consideration, we've decided to move forward with other candidates…" label="rejection"          time="2d ago" />
            <EmailCard from="sarah.chen@recruiter.co"  subject="Exciting opportunity: Senior Engineer at a top fintech"     snippet="I came across your profile and thought you'd be a perfect fit for a role I'm working on…" label="recruiter_outreach" time="3d ago" />
            <EmailCard from="offers@vercel.com"        subject="Your offer letter – Senior Engineer at Vercel"              snippet="We're thrilled to extend an offer for the Senior Software Engineer position…"   label="offer"              time="4d ago" />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section style={{ padding: "0 0 100px" }}>
        <div style={section}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Built for how job searching actually works
            </h2>
            <p style={{ color: C.muted, fontSize: "16px", margin: 0 }}>
              No spreadsheets. No manual tagging. Just clarity.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <FeatureCard
              icon="🧠"
              title="Two-pass AI classification"
              body="First pass checks relevance in under 20 tokens. Second pass reads the full email body before labeling. You get accuracy without burning your API budget."
            />
            <FeatureCard
              icon="⚡"
              title="Live sync with progress tracking"
              body="Pick a batch size, hit sync, and watch emails get classified in real time. A live counter shows exactly how many have been processed — and how many were skipped."
            />
            <FeatureCard
              icon="📊"
              title="Pipeline analytics at a glance"
              body="Rejection rate. Interview conversion. Recruiter noise ratio. All computed automatically so you can identify patterns across your entire job search."
            />
            <FeatureCard
              icon="🔒"
              title="Read-only Gmail access"
              body="InboxIQ only ever reads your inbox — it never sends, deletes, or modifies anything. OAuth tokens are encrypted at rest. Your inbox stays yours."
            />
            <FeatureCard
              icon="🏷️"
              title="6 meaningful label types"
              body="Auto-acknowledgements, rejections, interview invites, follow-ups required, recruiter outreach, and offers. Every category that actually matters in a job search."
            />
            <FeatureCard
              icon="📈"
              title="Trend charts over time"
              body="See how your pipeline has evolved day by day. Spot when interview activity peaks or when a batch of rejections arrived — and adjust your strategy accordingly."
            />
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 0",
          backgroundColor: C.card,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={section}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Up and running in 60 seconds
            </h2>
            <p style={{ color: C.muted, fontSize: "15px", margin: 0 }}>
              Three steps. No configuration required.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "40px" }}>
            <Step
              n={1}
              title="Connect your Gmail"
              body="Sign in with Google. InboxIQ requests read-only access — nothing else. The whole OAuth flow takes under 10 seconds."
            />
            <Step
              n={2}
              title="Sync your inbox"
              body="Pick how many emails to scan (10 to 500). Hit sync and watch the AI work through them live. Duplicate emails are automatically skipped."
            />
            <Step
              n={3}
              title="See your pipeline"
              body="Your dashboard updates instantly. Filter emails by label, check your KPIs, and explore trend charts to understand your job search at a macro level."
            />
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <section style={{ padding: "60px 0" }}>
        <div style={section}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "24px",
              textAlign: "center",
            }}
          >
            {[
              { value: "6",      label: "Email categories" },
              { value: "2-pass", label: "AI classification" },
              { value: "500",    label: "Emails per sync" },
              { value: "0",      label: "Emails stored unclassified" },
            ].map(({ value, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "34px",
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${C.text}, #a5b4fc)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {value}
                </span>
                <span style={{ color: C.muted, fontSize: "12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section
        style={{
          padding: "90px 0",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            ...section,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "28px",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Stop guessing.<br />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.accent}, #34d399)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Start tracking.
            </span>
          </h2>
          <p style={{ color: C.muted, fontSize: "16px", maxWidth: "460px", lineHeight: 1.7, margin: 0 }}>
            Try the interactive demo in seconds — no account, no Gmail connection required.
            Explore a pre-loaded inbox and see the dashboard for yourself.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            <button onClick={enterDemo} style={{ ...ctaPrimary, fontSize: "15px", padding: "14px 36px" }}>
              Try the Demo — it's free
            </button>
            <button onClick={startGoogleLogin} style={{ ...ctaSecondary, fontSize: "15px", padding: "14px 36px" }}>
              Connect Gmail
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: `1px solid ${C.border}`,
          padding: "28px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>📬</span>
          <span style={{ color: C.muted, fontSize: "13px", fontWeight: 600 }}>InboxIQ</span>
        </div>
        <span style={{ color: "#1f2937", fontSize: "12px" }}>
          Built with Django · React · Gmail API · GPT-4o mini
        </span>
      </footer>

    </div>
  );
}
