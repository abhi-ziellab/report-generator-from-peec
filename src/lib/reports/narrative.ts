import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type {
  BrandReportRow,
  BrandVisibilityData,
  CitationData,
  CompetitiveGapData,
  DomainReportRow,
  ReportSection,
  ReportType,
  UrlReportRow,
} from "../types";

function getModel(apiKey?: string) {
  const provider = createAnthropic({ apiKey });
  return provider("claude-opus-4-6");
}

const SYSTEM_PROMPT = `You are an AI search analytics expert writing a section of a professional report.

CRITICAL RULES:
- ONLY use the exact numbers provided in the VERIFIED FACTS section below. Do not calculate, estimate, or invent any numbers.
- Every statistic you mention MUST appear verbatim in the facts provided.
- If a fact is not provided, do not make it up. Say "data not available" instead.
- Write in a professional, analytical tone suitable for agency/brand executives.
- Write 3-5 single-sentence bullet points, each 15-25 words, with specific numbers.
- Start each bullet with "- " (dash space).
- Do not use markdown headings (## etc.) — just write concise bullet points.`;

// ── Pre-compute facts deterministically in code ──

interface ComputedFact {
  label: string;
  value: string;
}

function computeBrandOverviewFacts(rows: BrandReportRow[]): ComputedFact[] {
  if (rows.length === 0) return [{ label: "Status", value: "No brand data available for this period" }];

  const facts: ComputedFact[] = [];
  const sorted = [...rows].sort((a, b) => b.visibility - a.visibility);

  facts.push({ label: "Number of brands tracked", value: `${rows.length}` });
  facts.push({ label: "Top brand by visibility", value: `${sorted[0].brand.name} at ${(sorted[0].visibility * 100).toFixed(1)}%` });

  if (sorted.length > 1) {
    facts.push({ label: "Second brand", value: `${sorted[1].brand.name} at ${(sorted[1].visibility * 100).toFixed(1)}%` });
    facts.push({ label: "Lowest visibility brand", value: `${sorted[sorted.length - 1].brand.name} at ${(sorted[sorted.length - 1].visibility * 100).toFixed(1)}%` });
    const gap = ((sorted[0].visibility - sorted[sorted.length - 1].visibility) * 100).toFixed(1);
    facts.push({ label: "Visibility gap (top to bottom)", value: `${gap} percentage points` });
  }

  const totalMentions = rows.reduce((s, r) => s + r.mention_count, 0);
  facts.push({ label: "Total mentions across all brands", value: `${totalMentions.toLocaleString()}` });

  const topSoV = sorted.sort((a, b) => b.share_of_voice - a.share_of_voice)[0];
  facts.push({ label: "Highest share of voice", value: `${topSoV.brand.name} at ${(topSoV.share_of_voice * 100).toFixed(1)}%` });

  const withSentiment = rows.filter((r) => r.sentiment !== undefined);
  if (withSentiment.length > 0) {
    const avgSentiment = withSentiment.reduce((s, r) => s + (r.sentiment ?? 0), 0) / withSentiment.length;
    facts.push({ label: "Average sentiment (0-100, 50=neutral)", value: `${avgSentiment.toFixed(1)}` });
    const bestSentiment = withSentiment.sort((a, b) => (b.sentiment ?? 0) - (a.sentiment ?? 0))[0];
    facts.push({ label: "Best sentiment", value: `${bestSentiment.brand.name} at ${bestSentiment.sentiment?.toFixed(1)}` });
  }

  const withPosition = rows.filter((r) => r.position !== undefined);
  if (withPosition.length > 0) {
    const bestPosition = withPosition.sort((a, b) => (a.position ?? 99) - (b.position ?? 99))[0];
    facts.push({ label: "Best avg position (lower=better)", value: `${bestPosition.brand.name} at ${bestPosition.position?.toFixed(1)}` });
  }

  // Per-brand breakdown
  for (const row of rows) {
    facts.push({
      label: `${row.brand.name}`,
      value: `visibility=${(row.visibility * 100).toFixed(1)}%, SoV=${(row.share_of_voice * 100).toFixed(1)}%, mentions=${row.mention_count}${row.sentiment !== undefined ? `, sentiment=${row.sentiment.toFixed(0)}` : ""}${row.position !== undefined ? `, position=${row.position.toFixed(1)}` : ""}`,
    });
  }

  return facts;
}

function computeModelBreakdownFacts(byModel: BrandReportRow[], models: { id: string }[]): ComputedFact[] {
  const facts: ComputedFact[] = [];
  const grouped = new Map<string, BrandReportRow[]>();
  for (const row of byModel) {
    const mid = row.model?.id ?? "unknown";
    if (!grouped.has(mid)) grouped.set(mid, []);
    grouped.get(mid)!.push(row);
  }

  facts.push({ label: "Number of AI models", value: `${grouped.size}` });

  for (const [modelId, rows] of grouped) {
    const sorted = [...rows].sort((a, b) => b.visibility - a.visibility);
    const top = sorted[0];
    facts.push({
      label: `Model ${modelId} — top brand`,
      value: `${top.brand.name} at ${(top.visibility * 100).toFixed(1)}% visibility`,
    });
    if (sorted.length > 1) {
      const bottom = sorted[sorted.length - 1];
      facts.push({
        label: `Model ${modelId} — lowest brand`,
        value: `${bottom.brand.name} at ${(bottom.visibility * 100).toFixed(1)}% visibility`,
      });
    }
    // All brands for this model
    for (const r of sorted) {
      facts.push({
        label: `Model ${modelId} — ${r.brand.name}`,
        value: `visibility=${(r.visibility * 100).toFixed(1)}%, SoV=${(r.share_of_voice * 100).toFixed(1)}%, mentions=${r.mention_count}`,
      });
    }
  }

  return facts;
}

function computeCompetitiveGapFacts(data: CompetitiveGapData): ComputedFact[] {
  const facts: ComputedFact[] = [];
  const promptMap = new Map(data.prompts.map((p) => [p.id, p.messages[0]?.content ?? p.id]));

  // Find biggest gaps per prompt
  const grouped = new Map<string, BrandReportRow[]>();
  for (const row of data.byPrompt) {
    const pid = row.prompt?.id ?? "unknown";
    if (!grouped.has(pid)) grouped.set(pid, []);
    grouped.get(pid)!.push(row);
  }

  const gaps: { prompt: string; leader: string; leaderVis: number; others: { name: string; vis: number }[] }[] = [];
  for (const [pid, rows] of grouped) {
    if (rows.length < 2) continue;
    const sorted = [...rows].sort((a, b) => b.visibility - a.visibility);
    gaps.push({
      prompt: promptMap.get(pid) ?? pid,
      leader: sorted[0].brand.name,
      leaderVis: sorted[0].visibility,
      others: sorted.slice(1).map((r) => ({ name: r.brand.name, vis: r.visibility })),
    });
  }

  // Sort by biggest gap between first and second
  gaps.sort((a, b) => {
    const gapA = a.leaderVis - (a.others[0]?.vis ?? 0);
    const gapB = b.leaderVis - (b.others[0]?.vis ?? 0);
    return gapB - gapA;
  });

  facts.push({ label: "Number of prompts analyzed", value: `${grouped.size}` });

  for (const g of gaps.slice(0, 10)) {
    const gap = ((g.leaderVis - (g.others[0]?.vis ?? 0)) * 100).toFixed(1);
    facts.push({
      label: `Prompt "${g.prompt.slice(0, 80)}"`,
      value: `Leader: ${g.leader} (${(g.leaderVis * 100).toFixed(1)}%), gap of ${gap}pp to ${g.others[0]?.name ?? "N/A"} (${((g.others[0]?.vis ?? 0) * 100).toFixed(1)}%)`,
    });
  }

  return facts;
}

function computeCitationFacts(data: CitationData): { domainFacts: ComputedFact[]; urlFacts: ComputedFact[]; modelFacts: ComputedFact[] } {
  const domainFacts: ComputedFact[] = [];
  const urlFacts: ComputedFact[] = [];
  const modelFacts: ComputedFact[] = [];

  // Domain stats
  domainFacts.push({ label: "Total domains tracked", value: `${data.domains.length}` });

  const byClass = new Map<string, DomainReportRow[]>();
  for (const d of data.domains) {
    const cls = d.classification ?? "UNKNOWN";
    if (!byClass.has(cls)) byClass.set(cls, []);
    byClass.get(cls)!.push(d);
  }
  for (const [cls, rows] of byClass) {
    const avgUsage = rows.reduce((s, r) => s + (r.usage_rate ?? 0), 0) / rows.length;
    domainFacts.push({ label: `${cls} domains`, value: `${rows.length} domains, avg usage rate ${(avgUsage * 100).toFixed(1)}%` });
  }

  for (const d of data.domains.slice(0, 15)) {
    domainFacts.push({
      label: d.domain,
      value: `classification=${d.classification ?? "N/A"}, usage_rate=${d.usage_rate !== undefined ? (d.usage_rate * 100).toFixed(1) + "%" : "N/A"}, citation_avg=${d.citation_avg.toFixed(2)}`,
    });
  }

  // URL stats
  urlFacts.push({ label: "Total URLs tracked", value: `${data.urls.length}` });
  for (const u of data.urls.slice(0, 15)) {
    urlFacts.push({
      label: u.url.slice(0, 80),
      value: `classification=${u.classification}, citations=${u.citation_count}, citation_avg=${u.citation_avg.toFixed(2)}, title="${u.title ?? "N/A"}"`,
    });
  }

  // Model citation differences
  const domsByModel = new Map<string, DomainReportRow[]>();
  for (const row of data.domainsByModel) {
    const mid = row.model?.id ?? "unknown";
    if (!domsByModel.has(mid)) domsByModel.set(mid, []);
    domsByModel.get(mid)!.push(row);
  }

  for (const [modelId, rows] of domsByModel) {
    const ownDomains = rows.filter((r) => r.classification === "OWN");
    const avgOwn = ownDomains.length > 0
      ? (ownDomains.reduce((s, r) => s + (r.usage_rate ?? 0), 0) / ownDomains.length * 100).toFixed(1)
      : "N/A";
    const top = [...rows].sort((a, b) => (b.usage_rate ?? 0) - (a.usage_rate ?? 0))[0];
    modelFacts.push({
      label: `Model ${modelId}`,
      value: `top domain: ${top?.domain ?? "N/A"} (${top?.usage_rate !== undefined ? (top.usage_rate * 100).toFixed(1) + "%" : "N/A"}), OWN avg usage: ${avgOwn}%`,
    });
  }

  return { domainFacts, urlFacts, modelFacts };
}

// ── LLM calls: one per section, with only verified facts ──

function factsToText(facts: ComputedFact[]): string {
  return facts.map((f) => `- ${f.label}: ${f.value}`).join("\n");
}

async function generateSection(
  sectionTitle: string,
  instruction: string,
  facts: ComputedFact[],
  type: ReportSection["type"],
  apiKey?: string,
): Promise<ReportSection> {
  const { text } = await generateText({
    model: getModel(apiKey),
    system: SYSTEM_PROMPT,
    prompt: `SECTION: ${sectionTitle}

VERIFIED FACTS (use ONLY these numbers):
${factsToText(facts)}

TASK: ${instruction}`,
    maxOutputTokens: 500,
  });

  return { title: sectionTitle, narrative: text.trim(), type };
}

// ── Per-report orchestrators (single LLM call each → one "Key Takeaways" section) ──

async function generateBrandVisibilitySections(data: BrandVisibilityData, dateRange: string, apiKey?: string): Promise<ReportSection[]> {
  const facts = [
    ...computeBrandOverviewFacts(data.overall),
    ...computeModelBreakdownFacts(data.byModel, data.models),
  ];

  return [
    await generateSection(
      "Key Takeaways",
      `Write 4-6 bullet points covering: top performer and competitive gaps, model-by-model patterns, sentiment standouts, and one actionable recommendation. Period: ${dateRange}. Each bullet: 15-25 words with specific numbers.`,
      facts,
      "executive-summary",
      apiKey,
    ),
  ];
}

async function generateCompetitiveGapSections(data: CompetitiveGapData, dateRange: string, apiKey?: string): Promise<ReportSection[]> {
  const facts = [
    ...computeBrandOverviewFacts(data.overall),
    ...computeCompetitiveGapFacts(data),
    ...computeModelBreakdownFacts(data.byModel, data.models).slice(0, 15),
  ];

  return [
    await generateSection(
      "Key Takeaways",
      `Write 4-6 bullet points covering: who leads and by how much, biggest prompt-level gaps, model-specific advantages, and one actionable recommendation. Period: ${dateRange}. Each bullet: 15-25 words with specific numbers.`,
      facts,
      "executive-summary",
      apiKey,
    ),
  ];
}

async function generateCitationSections(data: CitationData, dateRange: string, apiKey?: string): Promise<ReportSection[]> {
  const { domainFacts, urlFacts, modelFacts } = computeCitationFacts(data);
  const facts = [
    ...domainFacts,
    ...urlFacts.slice(0, 10),
    ...modelFacts,
  ];

  return [
    await generateSection(
      "Key Takeaways",
      `Write 4-6 bullet points covering: OWN vs editorial vs competitor source mix, top cited domains and content types, model citation differences, and one actionable recommendation. Period: ${dateRange}. Each bullet: 15-25 words with specific numbers.`,
      facts,
      "executive-summary",
      apiKey,
    ),
  ];
}

// ── Main export ──

export async function generateNarrative(
  reportType: ReportType,
  data: BrandVisibilityData | CompetitiveGapData | CitationData,
  dateRange: string,
  apiKey?: string,
): Promise<ReportSection[]> {
  switch (reportType) {
    case "brand-visibility":
      return generateBrandVisibilitySections(data as BrandVisibilityData, dateRange, apiKey);
    case "competitive-gap":
      return generateCompetitiveGapSections(data as CompetitiveGapData, dateRange, apiKey);
    case "citation-report":
      return generateCitationSections(data as CitationData, dateRange, apiKey);
  }
}
