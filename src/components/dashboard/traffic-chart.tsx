"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { date: string; visits: number; clicks: number };

const INK = "#141413";
const MUTED = "#9c988c";

function label(date: string, short = false) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", short ? { month: "numeric", day: "numeric" } : { month: "short", day: "numeric" });
}

export function TrafficChart({ data }: { data: Point[] }) {
  const tickEvery = data.length > 31 ? 14 : data.length > 8 ? 6 : 1;
  return (
    <div className="h-full min-h-64 w-full" role="img" aria-label="Daily visits and product clicks">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="#dcd7c9" strokeDasharray="3 4" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => label(d, true)}
            interval={tickEvery - 1}
            tick={{ fontSize: 11, fill: "#6f6c63", fontFamily: "var(--font-geist-mono)" }}
            tickLine={false}
            axisLine={{ stroke: "#dcd7c9" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#6f6c63", fontFamily: "var(--font-geist-mono)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(20,20,19,0.05)" }}
            labelFormatter={(d) => label(String(d))}
            contentStyle={{
              background: "#fbfaf6",
              border: "1px solid #dcd7c9",
              borderRadius: 10,
              fontSize: 12,
              fontFamily: "var(--font-geist-mono)",
            }}
          />
          <Bar dataKey="clicks" name="Clicks" fill={INK} radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Line dataKey="visits" name="Visits" stroke={MUTED} strokeWidth={1.75} dot={false} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
