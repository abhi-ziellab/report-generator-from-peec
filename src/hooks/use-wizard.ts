"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { Brand, GeneratedReport, Model, Project, Prompt, ReportConfig, Tag, WizardState } from "@/lib/types";
import React from "react";

const initialConfig: ReportConfig = {
  reportType: "brand-visibility",
  startDate: new Date(Date.now() - 28 * 86_400_000).toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
};

const initialState: WizardState = {
  step: 1,
  apiKey: "",
  projectId: "",
  projectName: "",
  projects: [],
  brands: [],
  models: [],
  prompts: [],
  tags: [],
  config: initialConfig,
  report: null,
  loading: false,
  error: null,
  clientLogoUrl: null,
};

type WizardAction =
  | { type: "SET_STEP"; step: number }
  | { type: "SET_AUTH"; apiKey: string; projectId: string; projectName: string; brands: Brand[] }
  | { type: "SET_AUTH_ACCOUNT"; apiKey: string; projects: Project[] }
  | { type: "SET_PROJECT"; projectId: string; projectName: string; brands: Brand[] }
  | { type: "SET_METADATA"; brands: Brand[]; models: Model[]; prompts: Prompt[]; tags: Tag[] }
  | { type: "SET_REPORT_TYPE"; reportType: ReportConfig["reportType"] }
  | { type: "SET_CONFIG"; config: Partial<ReportConfig> }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_REPORT"; report: GeneratedReport }
  | { type: "SET_CLIENT_LOGO"; url: string | null }
  | { type: "RESET" };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step, error: null };
    case "SET_AUTH":
      // Brand-specific key: skip project selection (step 2), go to report type (step 3)
      return {
        ...state,
        apiKey: action.apiKey,
        projectId: action.projectId,
        projectName: action.projectName,
        brands: action.brands,
        projects: [],
        step: 3,
        error: null,
      };
    case "SET_AUTH_ACCOUNT":
      // Account-wide key: go to project selection (step 2)
      return {
        ...state,
        apiKey: action.apiKey,
        projects: action.projects,
        projectId: "",
        projectName: "",
        brands: [],
        step: 2,
        error: null,
      };
    case "SET_PROJECT":
      // Project selected from account-wide key: go to report type (step 3)
      return {
        ...state,
        projectId: action.projectId,
        projectName: action.projectName,
        brands: action.brands,
        step: 3,
        error: null,
      };
    case "SET_METADATA":
      return {
        ...state,
        brands: action.brands,
        models: action.models,
        prompts: action.prompts,
        tags: action.tags,
      };
    case "SET_REPORT_TYPE":
      return {
        ...state,
        config: { ...state.config, reportType: action.reportType },
        step: 4,
        error: null,
      };
    case "SET_CONFIG":
      return {
        ...state,
        config: { ...state.config, ...action.config },
      };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "SET_REPORT":
      return { ...state, report: action.report, loading: false, step: 6 };
    case "SET_CLIENT_LOGO":
      return { ...state, clientLogoUrl: action.url };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const WizardContext = createContext<{
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
} | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  return React.createElement(
    WizardContext.Provider,
    { value: { state, dispatch } },
    children,
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) throw new Error("useWizard must be used within WizardProvider");
  return context;
}
