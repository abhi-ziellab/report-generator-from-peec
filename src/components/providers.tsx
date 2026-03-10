"use client";

import { WizardProvider } from "@/hooks/use-wizard";

export function Providers({ children }: { children: React.ReactNode }) {
  return <WizardProvider>{children}</WizardProvider>;
}
