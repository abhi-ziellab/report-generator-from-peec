"use client";

import { useEffect, useMemo, useState } from "react";
import { useWizard } from "@/hooks/use-wizard";
import { getDatePreset, getPreviousPeriod, formatDateRange } from "@/lib/utils";
import { LogoUpload } from "./logo-upload";

const DATE_PRESETS = [
  { label: "Last 7 days", value: "7d" as const },
  { label: "Last 28 days", value: "28d" as const },
  { label: "Last 90 days", value: "90d" as const },
];

export function StepConfigure() {
  const { state, dispatch } = useWizard();
  const config = state.config;

  // Initialize logo from sessionStorage on mount
  useEffect(() => {
    if (!state.clientLogoUrl) {
      try {
        const stored = sessionStorage.getItem("peec_client_logo");
        if (stored) dispatch({ type: "SET_CLIENT_LOGO", url: stored });
      } catch {
        // ignore
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreset = (preset: "7d" | "28d" | "90d") => {
    const range = getDatePreset(preset);
    dispatch({ type: "SET_CONFIG", config: { startDate: range.start, endDate: range.end } });
  };

  const [tagsExpanded, setTagsExpanded] = useState(false);

  const toggleBrand = (brandId: string) => {
    const current = config.brandIds ?? [];
    const next = current.includes(brandId)
      ? current.filter((id) => id !== brandId)
      : [...current, brandId];
    dispatch({ type: "SET_CONFIG", config: { brandIds: next.length > 0 ? next : undefined } });
  };

  const toggleTag = (tagId: string) => {
    const current = config.tagIds ?? [];
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    dispatch({ type: "SET_CONFIG", config: { tagIds: next.length > 0 ? next : undefined } });
  };

  const promptCountByTag = useMemo(() => {
    const counts = new Map<string, number>();
    for (const prompt of state.prompts) {
      for (const tagRef of prompt.tags) {
        counts.set(tagRef.id, (counts.get(tagRef.id) ?? 0) + 1);
      }
    }
    return counts;
  }, [state.prompts]);

  const handleNext = () => {
    dispatch({ type: "SET_STEP", step: 5 });
  };

  const reportTypeLabel = {
    "brand-visibility": "Brand Visibility Analysis",
    "competitive-gap": "Competitive Gap Analysis",
    "citation-report": "AI Citation Report",
  }[config.reportType];

  const previousPeriod = config.compareWithPrevious
    ? getPreviousPeriod(config.startDate, config.endDate)
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--peec-border)] bg-white p-8">
        <h2 className="text-xl font-semibold mb-1">Configure your report</h2>
        <p className="text-sm text-[var(--peec-text-muted)] mb-6">{reportTypeLabel}</p>

        {/* Client Logo */}
        <LogoUpload
          value={state.clientLogoUrl}
          onChange={(url) => dispatch({ type: "SET_CLIENT_LOGO", url })}
        />

        {/* Report Scope */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Report Depth</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "executive" as const, label: "Executive Summary", desc: "Key metrics, top charts, and takeaways — ideal for stakeholders" },
              { value: "comprehensive" as const, label: "Comprehensive Report", desc: "Full landscape analysis with tag, prompt, and model deep-dives" },
            ]).map((option) => {
              const selected = (config.reportScope ?? "executive") === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => dispatch({ type: "SET_CONFIG", config: { reportScope: option.value } })}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? "border-[var(--peec-primary)] bg-[var(--peec-bg)]"
                      : "border-[var(--peec-border)] hover:border-[var(--peec-secondary)]"
                  }`}
                >
                  <p className={`text-sm font-medium ${selected ? "text-[var(--peec-text)]" : "text-[var(--peec-text-muted)]"}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-[var(--peec-text-muted)] mt-1">{option.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Date Range</label>
          <div className="flex gap-2 mb-3">
            {DATE_PRESETS.map((p) => {
              const range = getDatePreset(p.value);
              const isActive = config.startDate === range.start && config.endDate === range.end;
              return (
                <button
                  key={p.value}
                  onClick={() => handlePreset(p.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "border-[var(--peec-primary)] bg-[var(--peec-primary)] text-white"
                      : "border-[var(--peec-border)] hover:border-[var(--peec-primary)] hover:text-[var(--peec-primary)]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => dispatch({ type: "SET_CONFIG", config: { startDate: e.target.value } })}
              className="rounded-lg border border-[var(--peec-border)] px-3 py-2 text-sm focus:border-[var(--peec-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--peec-primary)]/20"
            />
            <span className="text-[var(--peec-text-muted)]">to</span>
            <input
              type="date"
              value={config.endDate}
              onChange={(e) => dispatch({ type: "SET_CONFIG", config: { endDate: e.target.value } })}
              className="rounded-lg border border-[var(--peec-border)] px-3 py-2 text-sm focus:border-[var(--peec-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--peec-primary)]/20"
            />
          </div>
        </div>

        {/* Period Comparison Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.compareWithPrevious ?? false}
              onChange={(e) =>
                dispatch({ type: "SET_CONFIG", config: { compareWithPrevious: e.target.checked } })
              }
              className="h-4 w-4 rounded border-[var(--peec-border)] text-[var(--peec-primary)] focus:ring-[var(--peec-primary)]"
            />
            <span className="text-sm font-medium">Compare with previous period</span>
          </label>
          {previousPeriod && (
            <p className="mt-1 ml-6.5 text-xs text-[var(--peec-text-muted)]">
              Previous: {formatDateRange(previousPeriod.start, previousPeriod.end)}
            </p>
          )}
        </div>

        {/* Brand selection (for brand-visibility and competitive-gap) */}
        {(config.reportType === "brand-visibility" || config.reportType === "competitive-gap") &&
          state.brands.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Brands {!config.brandIds?.length && <span className="font-normal text-[var(--peec-text-muted)]">(all selected by default)</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {state.brands.map((brand) => {
                  const selected = !config.brandIds?.length || config.brandIds.includes(brand.id);
                  return (
                    <button
                      key={brand.id}
                      onClick={() => toggleBrand(brand.id)}
                      className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                        selected
                          ? "border-[var(--peec-primary)] bg-[var(--peec-bg)] text-[var(--peec-text)]"
                          : "border-[var(--peec-border)] text-[var(--peec-text-muted)] hover:border-[var(--peec-secondary)]"
                      }`}
                    >
                      {brand.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {/* Tag selection (all report types) */}
        {state.tags.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Categories (Tags){" "}
              {!config.tagIds?.length && (
                <span className="font-normal text-[var(--peec-text-muted)]">(all selected by default)</span>
              )}
            </label>
            {state.tags.length > 6 ? (
              <>
                {!tagsExpanded ? (
                  <button
                    onClick={() => setTagsExpanded(true)}
                    className="text-sm text-[var(--peec-primary)] hover:underline"
                  >
                    {state.tags.length} tags available — click to filter
                  </button>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {state.tags.map((tag) => {
                        const selected = !config.tagIds?.length || config.tagIds.includes(tag.id);
                        const count = promptCountByTag.get(tag.id) ?? 0;
                        return (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                              selected
                                ? "border-[var(--peec-primary)] bg-[var(--peec-bg)] text-[var(--peec-text)]"
                                : "border-[var(--peec-border)] text-[var(--peec-text-muted)] hover:border-[var(--peec-secondary)]"
                            }`}
                          >
                            {tag.name} ({count})
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setTagsExpanded(false)}
                      className="mt-2 text-xs text-[var(--peec-text-muted)] hover:text-[var(--peec-text)]"
                    >
                      Collapse
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {state.tags.map((tag) => {
                  const selected = !config.tagIds?.length || config.tagIds.includes(tag.id);
                  const count = promptCountByTag.get(tag.id) ?? 0;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                        selected
                          ? "border-[var(--peec-primary)] bg-[var(--peec-bg)] text-[var(--peec-text)]"
                          : "border-[var(--peec-border)] text-[var(--peec-text-muted)] hover:border-[var(--peec-secondary)]"
                      }`}
                    >
                      {tag.name} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => dispatch({ type: "SET_STEP", step: 3 })}
          className="text-sm text-[var(--peec-text-muted)] hover:text-[var(--peec-text)]"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="rounded-lg bg-[var(--peec-primary)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--peec-primary-dark)] transition-colors"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}
