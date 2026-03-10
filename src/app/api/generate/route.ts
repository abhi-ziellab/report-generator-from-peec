import { NextRequest, NextResponse } from "next/server";
import { PeecApiClient } from "@/lib/peecai-client";
import { decrypt } from "@/lib/cookie";
import { fetchBrandVisibilityData } from "@/lib/reports/brand-visibility";
import { fetchCompetitiveGapData } from "@/lib/reports/competitive-gap";
import { fetchCitationData } from "@/lib/reports/citation-report";
import { generateNarrative } from "@/lib/reports/narrative";
import { formatDateRange } from "@/lib/utils";
import type { BrandVisibilityData, CompetitiveGapData, GeneratedReport, ReportConfig, ReportMetadata } from "@/lib/types";

const REPORT_TITLES: Record<string, string> = {
  "brand-visibility": "AI Visibility Report",
  "competitive-gap": "Competitive Intelligence Report",
  "citation-report": "AI Citation & Source Report",
};

export async function POST(request: NextRequest) {
  try {
    const encryptedKey = request.cookies.get("peecai_key")?.value;
    if (!encryptedKey) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const apiKey = decrypt(encryptedKey);

    // Read Anthropic key from cookie
    const encryptedAnthropicKey = request.cookies.get("anthropic_key")?.value;
    const anthropicApiKey = encryptedAnthropicKey ? decrypt(encryptedAnthropicKey) : null;

    const { projectId, projectName, config, clientLogoUrl } = (await request.json()) as {
      projectId: string;
      projectName: string;
      config: ReportConfig;
      clientLogoUrl?: string | null;
    };

    if (!projectId || !config?.reportType || !config?.startDate || !config?.endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = new PeecApiClient(apiKey);
    const dateRange = formatDateRange(config.startDate, config.endDate);

    // Fetch data based on report type
    let data;
    switch (config.reportType) {
      case "brand-visibility":
        data = await fetchBrandVisibilityData(client, projectId, config);
        break;
      case "competitive-gap":
        data = await fetchCompetitiveGapData(client, projectId, config);
        break;
      case "citation-report":
        data = await fetchCitationData(client, projectId, config);
        break;
      default:
        return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
    }

    // Compute metadata
    const metadata: ReportMetadata = {
      modelCount: "models" in data ? data.models.length : undefined,
      promptCount: "prompts" in data ? (data as CompetitiveGapData).prompts.length : undefined,
      scope: config.reportScope ?? "executive",
    };
    if ("overall" in data && (data as BrandVisibilityData).overall.length > 0) {
      metadata.totalChats = (data as BrandVisibilityData).overall[0].visibility_total;
    }
    if ("tags" in data && Array.isArray(data.tags)) {
      metadata.tagCount = data.tags.length;
    }
    if ("topics" in data && Array.isArray(data.topics)) {
      metadata.topicCount = data.topics.length;
    }

    // Generate LLM narrative (requires Anthropic key)
    let sections;
    if (anthropicApiKey) {
      sections = await generateNarrative(config.reportType, data, dateRange, anthropicApiKey);
    } else {
      sections = [
        {
          title: "Key Takeaways",
          narrative: "AI-generated insights unavailable — no Anthropic API key was provided.",
          type: "executive-summary" as const,
        },
      ];
    }

    const report: GeneratedReport = {
      type: config.reportType,
      title: REPORT_TITLES[config.reportType] ?? "Report",
      projectName,
      dateRange: { start: config.startDate, end: config.endDate },
      generatedAt: new Date().toISOString(),
      sections,
      data,
      clientLogoUrl: clientLogoUrl ?? null,
      config,
      metadata,
    };

    return NextResponse.json(report);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Report generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
