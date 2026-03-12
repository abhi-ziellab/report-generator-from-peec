"use client";

import { useState } from "react";
import { useWizard } from "@/hooks/use-wizard";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  CUSTOMER: "Active",
  TRIAL: "Trial",
  ONBOARDING: "Onboarding",
  PITCH: "Pitch",
};

export function StepSelectProject() {
  const { state, dispatch } = useWizard();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (projectId: string, projectName: string) => {
    setLoading(projectId);
    dispatch({ type: "SET_ERROR", error: null });

    try {
      // Fetch brands and metadata for the selected project
      const metaRes = await fetch(`/api/metadata?project_id=${projectId}`);
      const meta = await metaRes.json();

      if (!metaRes.ok) {
        dispatch({ type: "SET_ERROR", error: meta.error ?? "Failed to load project data" });
        setLoading(null);
        return;
      }

      dispatch({
        type: "SET_PROJECT",
        projectId,
        projectName,
        brands: meta.brands ?? [],
      });

      dispatch({
        type: "SET_METADATA",
        brands: meta.brands ?? [],
        models: meta.models ?? [],
        prompts: meta.prompts ?? [],
        tags: meta.tags ?? [],
      });
    } catch {
      dispatch({ type: "SET_ERROR", error: "Network error. Please try again." });
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Select a project</h2>
        <p className="text-[var(--peec-text-muted)] text-sm">
          Your account has access to {state.projects.length} project{state.projects.length !== 1 ? "s" : ""}. Choose the one you want to build a report for.
        </p>
      </div>

      <div className="grid gap-3">
        {state.projects.map((project) => (
          <button
            key={project.id}
            onClick={() => handleSelect(project.id, project.name)}
            disabled={loading !== null}
            className={cn(
              "flex items-center justify-between rounded-xl border p-5 text-left transition-all",
              "border-[var(--peec-border)] bg-white hover:border-[var(--peec-primary)] hover:shadow-sm",
              loading === project.id && "border-[var(--peec-primary)] bg-[var(--peec-bg)]",
              loading !== null && loading !== project.id && "opacity-50",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--peec-bg)]">
                <svg className="h-5 w-5 text-[var(--peec-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">{project.name}</h3>
                <p className="text-xs text-[var(--peec-text-muted)]">
                  {STATUS_LABELS[project.status] ?? project.status}
                </p>
              </div>
            </div>
            {loading === project.id && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--peec-border)] border-t-[var(--peec-primary)]" />
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: "SET_STEP", step: 1 })}
        className="mt-4 text-sm text-[var(--peec-text-muted)] hover:text-[var(--peec-text)]"
      >
        Back
      </button>
    </div>
  );
}
