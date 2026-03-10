"use client";

export interface InsightCardProps {
  icon: "trend-up" | "trend-down" | "alert" | "star" | "info";
  text: string;
  sentiment: "positive" | "negative" | "neutral";
}

const ACCENT_COLORS: Record<InsightCardProps["sentiment"], string> = {
  positive: "var(--peec-success)",
  negative: "var(--peec-error)",
  neutral: "var(--peec-text-muted)",
};

const ARROWS: Record<InsightCardProps["icon"], { symbol: string; color: (s: InsightCardProps["sentiment"]) => string }> = {
  "trend-up": { symbol: "↗", color: () => "var(--peec-success)" },
  "trend-down": { symbol: "↘", color: () => "var(--peec-error)" },
  alert: { symbol: "!", color: () => "var(--peec-warning)" },
  star: { symbol: "★", color: () => "var(--peec-text)" },
  info: { symbol: "·", color: () => "var(--peec-text-muted)" },
};

export function InsightCard({ icon, text, sentiment }: InsightCardProps) {
  const arrow = ARROWS[icon];

  return (
    <div
      className="flex items-start gap-2.5 py-2 print-break-inside-avoid"
      style={{
        borderLeft: `2px solid ${ACCENT_COLORS[sentiment]}`,
        paddingLeft: "12px",
      }}
    >
      <span
        className="mt-px text-sm font-semibold shrink-0"
        style={{ color: arrow.color(sentiment) }}
      >
        {arrow.symbol}
      </span>
      <p className="text-[12.5px] text-[var(--peec-text)] leading-snug">{text}</p>
    </div>
  );
}

export function InsightCards({ insights }: { insights: InsightCardProps[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="grid gap-1.5 mb-8">
      {insights.map((insight, i) => (
        <InsightCard key={i} {...insight} />
      ))}
    </div>
  );
}
