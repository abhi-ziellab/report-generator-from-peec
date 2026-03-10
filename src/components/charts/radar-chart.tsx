"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";
import { PrintSafeChart } from "./print-safe-chart";
import { getChartColor } from "./chart-colors";

interface PeecRadarChartProps {
  data: Record<string, unknown>[];
  angleKey: string;
  dataKeys: { key: string; name: string }[];
  height?: number;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#1a1a1a",
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontSize: 12,
  padding: "8px 12px",
};

export function PeecRadarChart({
  data,
  angleKey,
  dataKeys,
  height = 350,
}: PeecRadarChartProps) {
  return (
    <PrintSafeChart height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="var(--peec-border)" />
        <PolarAngleAxis dataKey={angleKey} tick={{ fontSize: 10, fill: "#737373" }} />
        <PolarRadiusAxis tick={{ fontSize: 9, fill: "#737373" }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        {dataKeys.map((dk, i) => (
          <Radar
            key={dk.key}
            name={dk.name}
            dataKey={dk.key}
            stroke={getChartColor(i)}
            fill={getChartColor(i)}
            fillOpacity={0.1}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 11, color: "#737373" }} iconType="circle" iconSize={8} />
      </RadarChart>
    </PrintSafeChart>
  );
}
