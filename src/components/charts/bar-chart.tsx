"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PrintSafeChart } from "./print-safe-chart";
import { getChartColor, getChartColorFaded } from "./chart-colors";

export interface BarDef {
  dataKey: string;
  name: string;
  colorIndex?: number;
  faded?: boolean;
}

interface PeecBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: BarDef[];
  layout?: "horizontal" | "vertical";
  stacked?: boolean;
  height?: number;
  valueFormatter?: (v: number) => string;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#1a1a1a",
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontSize: 12,
  padding: "8px 12px",
};

export function PeecBarChart({
  data,
  xKey,
  bars,
  layout = "horizontal",
  stacked = false,
  height,
  valueFormatter,
}: PeecBarChartProps) {
  const chartHeight = height ?? (layout === "vertical" ? Math.max(250, data.length * 36) : 300);
  const formatter = valueFormatter ?? ((v: number) => v.toLocaleString());

  return (
    <PrintSafeChart height={chartHeight}>
      <BarChart
        data={data}
        layout={layout === "vertical" ? "vertical" : "horizontal"}
        margin={{ top: 5, right: 30, left: layout === "vertical" ? 10 : 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--peec-border-light)" vertical={false} />
        {layout === "vertical" ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#737373" }} tickFormatter={formatter} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fontSize: 11, fill: "#737373" }}
              width={120}
              axisLine={false}
              tickLine={false}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#737373" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#737373" }} tickFormatter={formatter} axisLine={false} tickLine={false} />
          </>
        )}
        <Tooltip
          formatter={(value) => formatter(Number(value))}
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#737373" }} />
        {bars.map((bar, i) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.faded ? getChartColorFaded(bar.colorIndex ?? i) : getChartColor(bar.colorIndex ?? i)}
            stackId={stacked ? "stack" : undefined}
            isAnimationActive={false}
            radius={[3, 3, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </PrintSafeChart>
  );
}
