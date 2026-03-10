"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PrintSafeChart } from "./print-safe-chart";
import { getChartColor } from "./chart-colors";

export interface LineDef {
  dataKey: string;
  name: string;
  colorIndex?: number;
  dashed?: boolean;
}

interface PeecLineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  lines: LineDef[];
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

export function PeecLineChart({
  data,
  xKey,
  lines,
  height = 300,
  valueFormatter,
}: PeecLineChartProps) {
  const formatter = valueFormatter ?? ((v: number) => v.toLocaleString());

  return (
    <PrintSafeChart height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--peec-border-light)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#737373" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#737373" }} tickFormatter={formatter} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value) => formatter(Number(value))}
          contentStyle={TOOLTIP_STYLE}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#737373" }} iconType="circle" iconSize={8} />
        {lines.map((line, i) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={getChartColor(line.colorIndex ?? i)}
            strokeWidth={2}
            strokeDasharray={line.dashed ? "5 5" : undefined}
            dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: getChartColor(line.colorIndex ?? i) }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </PrintSafeChart>
  );
}
