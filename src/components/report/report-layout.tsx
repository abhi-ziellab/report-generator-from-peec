"use client";

import type { GeneratedReport } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";

export function ReportLayout({
  report,
  clientLogoUrl,
  children,
}: {
  report: GeneratedReport;
  clientLogoUrl?: string | null;
  children: React.ReactNode;
}) {
  const logo = clientLogoUrl ?? report.clientLogoUrl;
  const scope = report.config?.reportScope ?? "executive";

  return (
    <div id="report-content" className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-10 pt-10 pb-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="text-3xl font-normal tracking-tight leading-tight text-[var(--peec-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {report.title}
              </h1>
              <p className="text-sm font-medium text-[var(--peec-text)] mt-2.5 tracking-wide uppercase" style={{ letterSpacing: "0.08em", fontSize: "11px" }}>
                {report.projectName}
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--peec-text-muted)] mt-2">
                <span>{formatDateRange(report.dateRange.start, report.dateRange.end)}</span>
                {report.config?.compareWithPrevious && (
                  <>
                    <span className="text-[var(--peec-border)]">|</span>
                    <span>vs. Previous Period</span>
                  </>
                )}
                <span className="text-[var(--peec-border)]">|</span>
                <span>{new Date(report.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                {scope === "comprehensive" && (
                  <>
                    <span className="text-[var(--peec-border)]">|</span>
                    <span className="font-semibold text-[var(--peec-text)]">Comprehensive</span>
                  </>
                )}
              </div>
            </div>
            {logo && (
              <div className="flex-shrink-0 ml-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt="Logo"
                  className="h-10 w-auto object-contain"
                  style={{ maxWidth: 160 }}
                />
              </div>
            )}
          </div>
          {/* Hairline divider */}
          <div className="mt-6 border-b border-[var(--peec-text)]" style={{ borderBottomWidth: "1.5px" }} />
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-10 pt-4 pb-10">
        {children}
      </div>

      {/* Footer — compact, never splits */}
      <footer className="print-break-inside-avoid px-10 py-3 mt-auto" style={{ borderTop: "1px solid var(--peec-border)" }}>
        <div className="mx-auto max-w-5xl">
          <p className="text-[8.5px] text-[var(--peec-text-muted)] leading-snug tracking-wide" style={{ letterSpacing: "0.02em" }}>
            <span className="font-semibold text-[var(--peec-text)]">Methodology</span>
            <span className="mx-1.5 text-[var(--peec-border)]">—</span>
            Data across {report.metadata?.modelCount ?? "multiple"} AI platforms
            {report.metadata?.promptCount ? `, ${report.metadata.promptCount} prompts` : ""}
            {report.metadata?.totalChats ? `, ${report.metadata.totalChats.toLocaleString()} conversations` : ""}
            {report.metadata?.tagCount ? `, ${report.metadata.tagCount} categories` : ""}.
            {" "}Visibility = appearances / total conversations. SoV = brand mentions / category mentions.
          </p>
        </div>
      </footer>
    </div>
  );
}
