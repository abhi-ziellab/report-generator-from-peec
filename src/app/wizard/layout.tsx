"use client";

import { PeecLogo } from "@/components/peec-logo";

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--peec-bg)]">
      <header className="border-b border-[var(--peec-border)] bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-3">
          <PeecLogo height={24} className="text-[var(--peec-text)]" />
          <span className="text-[var(--peec-border)]">|</span>
          <span className="text-sm text-[var(--peec-text-muted)]">Report Builder</span>
          <span className="rounded-full bg-[var(--peec-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--peec-text-muted)] tracking-wide">BETA 1.0</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
