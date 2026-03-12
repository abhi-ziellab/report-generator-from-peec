/** Standard Peec AI API envelope — most list/report endpoints wrap results in `{ data: T }`. */
export interface ApiResponse<T> {
  data: T;
}

/** A Peec AI project representing a tracked brand or campaign. */
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
}

export type ProjectStatus =
  | "CUSTOMER"
  | "CUSTOMER_ENDED"
  | "PITCH"
  | "PITCH_ENDED"
  | "TRIAL"
  | "TRIAL_ENDED"
  | "ONBOARDING"
  | "DELETED";

/** A brand being tracked within a project, with its associated domains. */
export interface Brand {
  id: string;
  name: string;
  domains?: string[];
}

export interface PromptMessage {
  content: string;
}

/** A search prompt that Peec AI monitors across AI models. */
export interface Prompt {
  id: string;
  messages: PromptMessage[];
  tags: DimensionRef[];
  topic: DimensionRef | null;
  user_location: { country: string };
  volume?: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
}

/** An AI model tracked by Peec AI (e.g. ChatGPT, Perplexity). */
export interface Model {
  id: string;
  is_active: boolean;
}

/** Lightweight reference to a dimension entity (prompt, model, tag, or topic) by ID. */
export interface DimensionRef {
  id: string;
}

/** Brand analytics row from the /reports/brands endpoint. */
export interface BrandReportRow {
  brand: { id: string; name: string };
  prompt?: DimensionRef;
  model?: DimensionRef;
  tag?: DimensionRef;
  topic?: DimensionRef;
  visibility: number;
  visibility_count: number;
  visibility_total: number;
  share_of_voice: number;
  mention_count: number;
  sentiment?: number;
  sentiment_sum?: number;
  sentiment_count?: number;
  position?: number;
  position_sum?: number;
  position_count?: number;
}

export type DomainClassification =
  | "UGC"
  | "CORPORATE"
  | "EDITORIAL"
  | "INSTITUTIONAL"
  | "OTHER"
  | "REFERENCE"
  | "COMPETITOR"
  | "OWN";

export type UrlClassification =
  | "HOMEPAGE"
  | "CATEGORY_PAGE"
  | "PRODUCT_PAGE"
  | "LISTICLE"
  | "COMPARISON"
  | "PROFILE"
  | "ALTERNATIVE"
  | "DISCUSSION"
  | "HOW_TO_GUIDE"
  | "ARTICLE"
  | "OTHER";

/** Domain analytics row from the /reports/domains endpoint. */
export interface DomainReportRow {
  domain: string;
  classification: DomainClassification | null;
  prompt?: DimensionRef;
  model?: DimensionRef;
  tag?: DimensionRef;
  topic?: DimensionRef;
  usage_rate?: number;
  citation_avg: number;
}

/** URL analytics row from the /reports/urls endpoint. */
export interface UrlReportRow {
  url: string;
  classification: UrlClassification;
  title: string | null;
  prompt?: DimensionRef;
  model?: DimensionRef;
  tag?: DimensionRef;
  topic?: DimensionRef;
  usage_count: number;
  citation_count: number;
  citation_avg: number;
}

// ── Wizard-specific types ──

export type ReportType = "brand-visibility" | "competitive-gap" | "citation-report";

export type ReportScope = "executive" | "comprehensive";

export interface ReportConfig {
  reportType: ReportType;
  reportScope?: ReportScope;
  startDate: string;
  endDate: string;
  brandIds?: string[];
  tagIds?: string[];
  dimensions?: string[];
  classifications?: string[];
  compareWithPrevious?: boolean;
}

export interface WizardState {
  step: number;
  apiKey: string;
  projectId: string;
  projectName: string;
  projects: Project[];
  brands: Brand[];
  models: Model[];
  prompts: Prompt[];
  tags: Tag[];
  config: ReportConfig;
  report: GeneratedReport | null;
  loading: boolean;
  error: string | null;
  clientLogoUrl: string | null;
}

export interface BrandVisibilityData {
  overall: BrandReportRow[];
  byModel: BrandReportRow[];
  brands: Brand[];
  models: Model[];
  previousOverall?: BrandReportRow[];
  previousByModel?: BrandReportRow[];
  // Comprehensive fields
  byPrompt?: BrandReportRow[];
  byTag?: BrandReportRow[];
  prompts?: Prompt[];
  tags?: Tag[];
  topics?: Topic[];
}

export interface CompetitiveGapData {
  overall: BrandReportRow[];
  byPrompt: BrandReportRow[];
  byModel: BrandReportRow[];
  brands: Brand[];
  models: Model[];
  prompts: Prompt[];
  previousOverall?: BrandReportRow[];
  previousByModel?: BrandReportRow[];
  previousByPrompt?: BrandReportRow[];
  // Comprehensive fields
  byTag?: BrandReportRow[];
  tags?: Tag[];
  topics?: Topic[];
}

export interface CitationData {
  domains: DomainReportRow[];
  urls: UrlReportRow[];
  domainsByModel: DomainReportRow[];
  models: Model[];
  previousDomains?: DomainReportRow[];
  previousDomainsByModel?: DomainReportRow[];
  // Comprehensive fields
  urlsByModel?: UrlReportRow[];
  tags?: Tag[];
  topics?: Topic[];
}

export interface ReportMetadata {
  modelCount?: number;
  promptCount?: number;
  totalChats?: number;
  tagCount?: number;
  topicCount?: number;
  scope?: ReportScope;
}

export interface GeneratedReport {
  type: ReportType;
  title: string;
  projectName: string;
  dateRange: { start: string; end: string };
  generatedAt: string;
  sections: ReportSection[];
  data: BrandVisibilityData | CompetitiveGapData | CitationData;
  clientLogoUrl?: string | null;
  config?: ReportConfig;
  metadata?: ReportMetadata;
}

export interface ReportSection {
  title: string;
  narrative: string;
  type: "executive-summary" | "data" | "recommendations";
  snippets?: import("@/components/report/insight-card").InsightCardProps[];
}
