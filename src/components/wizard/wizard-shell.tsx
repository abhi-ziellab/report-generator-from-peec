"use client";

import { useWizard } from "@/hooks/use-wizard";
import { cn } from "@/lib/utils";

const BASE_STEPS = [
  { step: 1, label: "API Key" },
  { step: 3, label: "Report Type" },
  { step: 4, label: "Configure" },
  { step: 5, label: "Generate" },
];

const PROJECT_STEP = { step: 2, label: "Project" };

export function WizardShell({ children }: { children: React.ReactNode }) {
  const { state } = useWizard();

  // Show project selection step only for account-wide keys
  const hasProjectStep = state.projects.length > 0 || state.step === 2;
  const steps = hasProjectStep
    ? [BASE_STEPS[0], PROJECT_STEP, ...BASE_STEPS.slice(1)]
    : BASE_STEPS;

  return (
    <div>
      {/* Step indicator */}
      <nav className="mb-8">
        <ol className="flex items-center gap-2">
          {steps.map((s, i) => (
            <li key={s.step} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  state.step > s.step
                    ? "bg-[var(--peec-success)] text-white"
                    : state.step === s.step
                      ? "bg-[var(--peec-primary)] text-white"
                      : "bg-[var(--peec-border)] text-[var(--peec-text-muted)]",
                )}
              >
                {state.step > s.step ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:inline",
                  state.step === s.step
                    ? "font-medium text-[var(--peec-text)]"
                    : "text-[var(--peec-text-muted)]",
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px w-8 sm:w-12",
                    state.step > s.step
                      ? "bg-[var(--peec-success)]"
                      : "bg-[var(--peec-border)]",
                  )}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Error display */}
      {state.error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Step content */}
      {children}
    </div>
  );
}
