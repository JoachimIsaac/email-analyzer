import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchFunnel, fetchTrends, type FunnelData, type TrendRow } from "../api/dashboard";
import { C, card, LABEL_COLOR, LABEL_DISPLAY } from "../lib/theme";

const TOOLTIP = {
  contentStyle: { backgroundColor: C.card2, border: `1px solid ${C.border}`, borderRadius: 8 },
  labelStyle: { color: C.muted },
  itemStyle: { color: C.text },
};

const SectionTitle = ({ children }: { children: string }) => (
  <p
    style={{
      color: C.muted,
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "16px",
    }}
  >
    {children}
  </p>
);

export default function AnalyticsPage() {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [trends, setTrends] = useState<TrendRow[]>([]);

  useEffect(() => {
    fetchFunnel().then(setFunnel).catch(console.error);
    fetchTrends().then((d) => setTrends(d.trends)).catch(console.error);
  }, []);

  const donutData = (funnel?.funnel ?? []).filter((r) => r.count > 0);
  const barData = [...(funnel?.funnel ?? [])].sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-5">
      {/* Top row — donut + horizontal bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Donut */}
        <div style={{ ...card, padding: "20px 24px" }}>
          <SectionTitle>Overall Category Breakdown</SectionTitle>
          {donutData.length === 0 ? (
            <p style={{ color: C.muted, fontSize: "13px", textAlign: "center", padding: "40px 0" }}>
              No data yet — run a sync.
            </p>
          ) : (
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={170} height={170}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="count"
                    nameKey="display"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.label} fill={LABEL_COLOR[entry.label] ?? C.accent} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col gap-2.5 flex-1">
                {donutData.map((r) => (
                  <div key={r.label} className="flex items-center gap-2">
                    <span
                      style={{
                        display: "inline-block",
                        width: "10px",
                        height: "10px",
                        borderRadius: "2px",
                        backgroundColor: LABEL_COLOR[r.label],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "#94a3b8", fontSize: "12px", flex: 1 }}>
                      {r.display}
                    </span>
                    <span style={{ color: C.muted, fontSize: "12px", fontWeight: 600 }}>
                      {r.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Horizontal bar chart */}
        <div style={{ ...card, padding: "20px 24px" }}>
          <SectionTitle>Category Counts — All Time</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.muted, fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="display"
                width={90}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip {...TOOLTIP} />
              <Bar dataKey="count" name="Count" radius={[0, 3, 3, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.label} fill={LABEL_COLOR[entry.label] ?? C.accent} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend line chart */}
      {trends.length > 0 && (
        <div style={{ ...card, padding: "20px 24px" }}>
          <SectionTitle>Category Trends Over Time</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trends} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 10 }} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} />
              <Tooltip {...TOOLTIP} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                formatter={(value: string) => (
                  <span style={{ color: "#94a3b8" }}>
                    {LABEL_DISPLAY[value] ?? value}
                  </span>
                )}
              />
              {Object.keys(LABEL_COLOR).map((label) => (
                <Line
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={LABEL_COLOR[label]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
