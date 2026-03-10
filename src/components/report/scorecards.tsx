"use client";

export interface ScorecardItem {
  label: string;
  value: string;
  subtitle?: string;
  delta?: string;
  invertDelta?: boolean; // true = down is good (e.g., position)
}

export function Scorecards({ items }: { items: ScorecardItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 print-break-inside-avoid">
      {items.map((item) => {
        const deltaNum = item.delta ? parseFloat(item.delta) : 0;
        const isPositive = item.invertDelta ? deltaNum < -0.01 : deltaNum > 0.01;
        const isNegative = item.invertDelta ? deltaNum > 0.01 : deltaNum < -0.01;
        const arrow = isPositive ? "↗" : isNegative ? "↘" : "↔";
        const color = isPositive
          ? "var(--peec-success)"
          : isNegative
          ? "var(--peec-error)"
          : "var(--peec-text-muted)";

        return (
          <div
            key={item.label}
            className="rounded-lg border border-[var(--peec-border)] bg-white px-4 py-3.5"
          >
            <p
              className="text-[10px] uppercase tracking-widest text-[var(--peec-text-muted)] mb-1.5"
              style={{ letterSpacing: "0.1em" }}
            >
              {item.label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-semibold text-[var(--peec-text)] tabular-nums tracking-tight leading-none">{item.value}</p>
              {item.delta && (
                <span className="text-[11px] font-medium tabular-nums" style={{ color }}>
                  {arrow} {item.delta}
                </span>
              )}
            </div>
            {item.subtitle && (
              <p className="text-[10px] text-[var(--peec-text-muted)] mt-1.5">{item.subtitle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
