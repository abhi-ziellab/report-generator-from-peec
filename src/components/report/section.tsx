"use client";

import { cn } from "@/lib/utils";

export function Section({
  title,
  subtitle,
  highlight = false,
  children,
}: {
  title: string;
  subtitle?: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "mb-10",
        highlight && "rounded-xl border border-[var(--peec-border)] bg-white p-6",
      )}
    >
      <div className="mb-4">
        <h3
          className="text-[15px] font-semibold tracking-tight text-[var(--peec-text)]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "17px" }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-[var(--peec-text-muted)] mt-0.5 tracking-wide">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
