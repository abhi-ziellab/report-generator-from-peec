"use client";

import { useState } from "react";
import { useWizard } from "@/hooks/use-wizard";

export function StepApiKey() {
  const { dispatch } = useWizard();
  const [apiKey, setApiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [validating, setValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !anthropicKey.trim()) return;

    setValidating(true);
    dispatch({ type: "SET_ERROR", error: null });

    try {
      const res = await fetch("/api/auth/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          anthropicKey: anthropicKey.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        dispatch({ type: "SET_ERROR", error: data.error ?? "Validation failed" });
        setValidating(false);
        return;
      }

      if (data.keyType === "account") {
        // Account-wide key: show project selection
        dispatch({
          type: "SET_AUTH_ACCOUNT",
          apiKey: apiKey.trim(),
          projects: data.projects,
        });
      } else {
        // Brand-specific key: go directly to report type
        // Fetch full metadata
        const metaRes = await fetch(`/api/metadata?project_id=${data.projectId}`);
        const meta = await metaRes.json();

        dispatch({
          type: "SET_AUTH",
          apiKey: apiKey.trim(),
          projectId: data.projectId,
          projectName: data.projectName,
          brands: data.brands,
        });

        if (metaRes.ok) {
          dispatch({
            type: "SET_METADATA",
            brands: meta.brands,
            models: meta.models,
            prompts: meta.prompts,
            tags: meta.tags ?? [],
          });
        }
      }
    } catch {
      dispatch({ type: "SET_ERROR", error: "Network error. Please try again." });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--peec-border)] bg-white p-8">
      <h2 className="text-xl font-semibold mb-2">Connect your accounts</h2>
      <p className="text-[var(--peec-text-muted)] text-sm mb-6">
        Enter your API keys to get started. Both keys are stored only for the duration of your session.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Peec AI Key */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
            Peec AI API Key
          </label>
          <p className="text-xs text-[var(--peec-text-muted)] mb-2">
            Your Peec AI API key from Settings. Supports both <strong>account-wide keys</strong> (<code className="text-[10px] bg-[var(--peec-bg)] px-1 rounded">skc-</code>) and <strong>project-specific keys</strong> (<code className="text-[10px] bg-[var(--peec-bg)] px-1 rounded">skp-</code>).
          </p>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="skp-... or skc-..."
            className="w-full rounded-lg border border-[var(--peec-border)] px-4 py-2.5 text-sm focus:border-[var(--peec-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--peec-primary)]/20"
            autoFocus
          />
        </div>

        {/* Anthropic Key */}
        <div>
          <label htmlFor="anthropicKey" className="block text-sm font-medium mb-1">
            Anthropic API Key
          </label>
          <p className="text-xs text-[var(--peec-text-muted)] mb-2">
            Powers AI-generated narrative insights using <strong>Claude Opus 4.6</strong>. Get your key at{" "}
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--peec-text)]">console.anthropic.com</a>.
          </p>
          <input
            id="anthropicKey"
            type="password"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full rounded-lg border border-[var(--peec-border)] px-4 py-2.5 text-sm focus:border-[var(--peec-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--peec-primary)]/20"
          />
        </div>

        <button
          type="submit"
          disabled={!apiKey.trim() || !anthropicKey.trim() || validating}
          className="rounded-lg bg-[var(--peec-primary)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--peec-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {validating ? "Validating..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
