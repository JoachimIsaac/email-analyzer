export const C = {
  bg:          "#0d0f1a",
  card:        "#111827",
  card2:       "#1a2035",
  border:      "#1f2d45",
  text:        "#f1f5f9",
  muted:       "#64748b",
  accent:      "#6366f1",
  accentHover: "#4f46e5",
} as const;

export const card = {
  backgroundColor: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: "12px",
} as const;

export const LABEL_COLOR: Record<string, string> = {
  auto_acknowledgement: "#06b6d4",
  rejection:            "#f87171",
  interview_invite:     "#60a5fa",
  follow_up_required:   "#fbbf24",
  recruiter_outreach:   "#a78bfa",
  offer:                "#34d399",
};

export const LABEL_DISPLAY: Record<string, string> = {
  auto_acknowledgement: "Auto-Ack",
  rejection:            "Rejection",
  interview_invite:     "Interview",
  follow_up_required:   "Follow-up",
  recruiter_outreach:   "Recruiter",
  offer:                "Offer",
};
