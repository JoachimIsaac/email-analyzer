import { C, card } from "../lib/theme";

interface Props {
  label: string;
  value: string | number;
  color?: string;
}

export default function KpiCard({ label, value, color = C.text }: Props) {
  return (
    <div style={{ ...card, padding: "18px 20px" }} className="flex flex-col gap-1.5">
      <span style={{ color, fontSize: "24px", fontWeight: 700, lineHeight: 1 }}>
        {value}
      </span>
      <span
        style={{
          color: C.muted,
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}
