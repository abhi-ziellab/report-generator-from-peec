import { PeecApiClient } from "../peecai-client";
import type { Brand, BrandReportRow, BrandVisibilityData, Model, Prompt, ReportConfig, Tag, Topic } from "../types";
import type { ReportFilter } from "../utils";
import { getPreviousPeriod } from "../utils";

export async function fetchBrandVisibilityData(
  client: PeecApiClient,
  projectId: string,
  config: ReportConfig,
): Promise<BrandVisibilityData> {
  const baseBody: Record<string, unknown> = {
    project_id: projectId,
    start_date: config.startDate,
    end_date: config.endDate,
  };

  if (config.brandIds && config.brandIds.length > 0) {
    const filter: ReportFilter = { field: "brand_id", operator: "in", values: config.brandIds };
    baseBody.filters = [filter];
  }

  const isComprehensive = config.reportScope === "comprehensive";

  const [overall, byModel, brands, models] = await Promise.all([
    client.post<BrandReportRow[]>("/reports/brands", { ...baseBody }),
    client.post<BrandReportRow[]>("/reports/brands", {
      ...baseBody,
      dimensions: ["model_id"],
    }),
    client.get<Brand[]>("/brands", { project_id: projectId, limit: 1000 }),
    client.get<Model[]>("/models", { project_id: projectId, limit: 1000 }),
  ]);

  const result: BrandVisibilityData = { overall, byModel, brands, models };

  // Fetch previous period data if comparison enabled
  if (config.compareWithPrevious) {
    const prev = getPreviousPeriod(config.startDate, config.endDate);
    const prevBody: Record<string, unknown> = {
      ...baseBody,
      start_date: prev.start,
      end_date: prev.end,
    };
    const [previousOverall, previousByModel] = await Promise.all([
      client.post<BrandReportRow[]>("/reports/brands", { ...prevBody }),
      client.post<BrandReportRow[]>("/reports/brands", { ...prevBody, dimensions: ["model_id"] }),
    ]);
    result.previousOverall = previousOverall;
    result.previousByModel = previousByModel;
  }

  // Comprehensive: fetch additional dimensions
  if (isComprehensive) {
    const [byPrompt, byTag, prompts, tags, topics] = await Promise.all([
      client.post<BrandReportRow[]>("/reports/brands", { ...baseBody, dimensions: ["prompt_id"] }),
      client.post<BrandReportRow[]>("/reports/brands", { ...baseBody, dimensions: ["tag_id"] }),
      client.get<Prompt[]>("/prompts", { project_id: projectId, limit: 1000 }),
      client.get<Tag[]>("/tags", { project_id: projectId, limit: 1000 }),
      client.get<Topic[]>("/topics", { project_id: projectId, limit: 1000 }),
    ]);
    result.byPrompt = byPrompt;
    result.byTag = byTag;
    result.prompts = prompts;
    result.tags = tags;
    result.topics = topics;
  }

  return result;
}
