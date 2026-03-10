"use client";

import { useEffect, useRef } from "react";
import { useWizard } from "@/hooks/use-wizard";

export function StepGenerate() {
  const { state, dispatch } = useWizard();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    dispatch({ type: "SET_LOADING", loading: true });

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: state.projectId,
        projectName: state.projectName,
        config: state.config,
        clientLogoUrl: state.clientLogoUrl,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to generate report");
        }
        return res.json();
      })
      .then((report) => {
        dispatch({ type: "SET_REPORT", report });
      })
      .catch((err) => {
        dispatch({ type: "SET_ERROR", error: err.message });
        dispatch({ type: "SET_STEP", step: 4 });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-xl border border-[var(--peec-border)] bg-white p-12 text-center">
      <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-[var(--peec-border)] border-t-[var(--peec-primary)]" />
      <h2 className="text-xl font-semibold mb-2">Generating your report</h2>
      <p className="text-[var(--peec-text-muted)] text-sm">
        Fetching data from Peec AI and generating narrative insights...
      </p>
      <p className="text-[var(--peec-text-muted)] text-xs mt-2">
        This may take 15-30 seconds
      </p>
    </div>
  );
}
