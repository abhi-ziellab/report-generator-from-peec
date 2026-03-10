"use client";

import { useWizard } from "@/hooks/use-wizard";
import type { ReportType } from "@/lib/types";
import { cn } from "@/lib/utils";

const REPORT_TYPES: { id: ReportType; title: string; description: string; icon: string }[] = [
  {
    id: "brand-visibility",
    title: "Brand Visibility Analysis",
    description:
      "Analyze your brand's visibility, sentiment, and position across AI models like ChatGPT and Perplexity.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    id: "competitive-gap",
    title: "Competitive Gap Analysis",
    description:
      "Compare your brand against competitors. Identify visibility gaps across prompts and AI models.",
    icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  },
  {
    id: "citation-report",
    title: "AI Citation Report",
    description:
      "Discover which domains and URLs get cited in AI responses. Find content optimization opportunities.",
    icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  },
];

export function StepReportType() {
  const { state, dispatch } = useWizard();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Choose a report type</h2>
        <p className="text-[var(--peec-text-muted)] text-sm">
          Project: <span className="font-medium text-[var(--peec-text)]">{state.projectName}</span>
        </p>
      </div>

      <div className="grid gap-4">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.id}
            onClick={() => dispatch({ type: "SET_REPORT_TYPE", reportType: rt.id })}
            className={cn(
              "flex items-start gap-4 rounded-xl border p-6 text-left transition-all hover:border-[var(--peec-primary)] hover:shadow-sm",
              "border-[var(--peec-border)] bg-white",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--peec-bg)]">
              <svg className="h-5 w-5 text-[var(--peec-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={rt.icon} />
              </svg>
            </div>
            <div>
              <h3 className="font-medium mb-1">{rt.title}</h3>
              <p className="text-sm text-[var(--peec-text-muted)]">{rt.description}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: "SET_STEP", step: state.projects.length > 0 ? 2 : 1 })}
        className="mt-4 text-sm text-[var(--peec-text-muted)] hover:text-[var(--peec-text)]"
      >
        Back
      </button>
    </div>
  );
}
