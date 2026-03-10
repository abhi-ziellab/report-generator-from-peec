"use client";

interface DeltaIndicatorProps {
  current: number;
  previous: number;
  format?: "percent" | "points" | "number";
  size?: "sm" | "md";
}

export function DeltaIndicator({
  current,
  previous,
  format = "points",
  size = "md",
}: DeltaIndicatorProps) {
  const diff = current - previous;
  const direction = diff > 0.001 ? "up" : diff < -0.001 ? "down" : "flat";

  let label: string;
  if (format === "percent") {
    const pct = previous !== 0 ? ((diff / previous) * 100) : 0;
    label = `${Math.abs(pct).toFixed(1)}`;
  } else if (format === "points") {
    const pp = Math.abs(diff * 100);
    label = `${pp.toFixed(1)}`;
  } else {
    label = `${Math.abs(diff).toLocaleString()}`;
  }

  const arrow = direction === "up" ? "↗" : direction === "down" ? "↘" : "↔";
  const color = direction === "up"
    ? "var(--peec-success)"
    : direction === "down"
    ? "var(--peec-error)"
    : "var(--peec-text-muted)";

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${size === "sm" ? "text-xs" : "text-sm"}`}
      style={{ color }}
    >
      {arrow} {label}
    </span>
  );
}
