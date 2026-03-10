"use client";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";
import { PrintSafeChart } from "./print-safe-chart";
import { getChartColor } from "./chart-colors";

interface PeecPieChartProps {
  data: { name: string; value: number }[];
  innerRadius?: number;
  showLegend?: boolean;
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

export function PeecPieChart({
  data,
  innerRadius = 55,
  showLegend = true,
  height = 300,
  valueFormatter,
}: PeecPieChartProps) {
  const formatter = valueFormatter ?? ((v: number) => v.toLocaleString());

  return (
    <PrintSafeChart height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 35}
          dataKey="value"
          nameKey="name"
          isAnimationActive={false}
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={{ stroke: "#737373", strokeWidth: 0.5 }}
          style={{ fontSize: 11 }}
          strokeWidth={2}
          stroke="#fff"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={getChartColor(i)} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatter(Number(value))}
          contentStyle={TOOLTIP_STYLE}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#737373" }}
            iconType="circle"
            iconSize={8}
          />
        )}
      </PieChart>
    </PrintSafeChart>
  );
}
