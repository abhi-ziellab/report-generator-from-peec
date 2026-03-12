import { PeecApiClient } from "../peecai-client";
import type { CitationData, DomainReportRow, Model, ReportConfig, Tag, Topic, UrlReportRow } from "../types";
import { getPreviousPeriod } from "../utils";

export async function fetchCitationData(
  client: PeecApiClient,
  projectId: string,
  config: ReportConfig,
): Promise<CitationData> {
  const baseBody: Record<string, unknown> = {
    project_id: projectId,
    start_date: config.startDate,
    end_date: config.endDate,
  };

  const filters: { field: string; operator: string; values: string[] }[] = [];
  if (config.classifications?.length) {
    filters.push({ field: "classification", operator: "in", values: config.classifications });
  }
  if (config.tagIds?.length) {
    filters.push({ field: "tag_id", operator: "in", values: config.tagIds });
  }
  if (filters.length > 0) baseBody.filters = filters;

  const isComprehensive = config.reportScope === "comprehensive";

  const [domains, urls, domainsByModel, models] = await Promise.all([
    client.post<DomainReportRow[]>("/reports/domains", { ...baseBody }),
    client.post<UrlReportRow[]>("/reports/urls", { ...baseBody, limit: 50 }),
    client.post<DomainReportRow[]>("/reports/domains", {
      ...baseBody,
      dimensions: ["model_id"],
    }),
    client.get<Model[]>("/models", { project_id: projectId, limit: 1000 }),
  ]);

  const result: CitationData = { domains, urls, domainsByModel, models };

  // Fetch previous period data for comparison
  if (config.compareWithPrevious) {
    const prev = getPreviousPeriod(config.startDate, config.endDate);
    const prevBody: Record<string, unknown> = {
      ...baseBody,
      start_date: prev.start,
      end_date: prev.end,
    };
    const [previousDomains, previousDomainsByModel] = await Promise.all([
      client.post<DomainReportRow[]>("/reports/domains", { ...prevBody }),
      client.post<DomainReportRow[]>("/reports/domains", { ...prevBody, dimensions: ["model_id"] }),
    ]);
    result.previousDomains = previousDomains;
    result.previousDomainsByModel = previousDomainsByModel;
  }

  // Comprehensive: fetch URL-by-model + tag metadata
  if (isComprehensive) {
    const [urlsByModel, tags, topics] = await Promise.all([
      client.post<UrlReportRow[]>("/reports/urls", { ...baseBody, dimensions: ["model_id"], limit: 100 }),
      client.get<Tag[]>("/tags", { project_id: projectId, limit: 1000 }),
      client.get<Topic[]>("/topics", { project_id: projectId, limit: 1000 }),
    ]);
    result.urlsByModel = urlsByModel;
    result.tags = tags;
    result.topics = topics;
  }

  return result;
}
