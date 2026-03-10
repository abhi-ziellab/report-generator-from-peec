"use client";

import { useWizard } from "@/hooks/use-wizard";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { StepApiKey } from "@/components/wizard/step-api-key";
import { StepSelectProject } from "@/components/wizard/step-select-project";
import { StepReportType } from "@/components/wizard/step-report-type";
import { StepConfigure } from "@/components/wizard/step-configure";
import { StepGenerate } from "@/components/wizard/step-generate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WizardPage() {
  const { state } = useWizard();
  const router = useRouter();

  useEffect(() => {
    if (state.step === 6 && state.report) {
      router.push("/report");
    }
  }, [state.step, state.report, router]);

  return (
    <WizardShell>
      {state.step === 1 && <StepApiKey />}
      {state.step === 2 && <StepSelectProject />}
      {state.step === 3 && <StepReportType />}
      {state.step === 4 && <StepConfigure />}
      {state.step === 5 && <StepGenerate />}
    </WizardShell>
  );
}
