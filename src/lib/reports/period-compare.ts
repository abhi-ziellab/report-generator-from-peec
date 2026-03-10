import type { BrandReportRow, DomainReportRow } from "../types";

export interface PeriodDelta {
  current: number;
  previous: number;
  absoluteChange: number;
  percentChange: number | null;
  direction: "up" | "down" | "flat";
}

export function computeDelta(current: number, previous: number): PeriodDelta {
  const absoluteChange = current - previous;
  const percentChange = previous !== 0 ? (absoluteChange / previous) * 100 : null;
  const direction =
    absoluteChange > 0.001 ? "up" : absoluteChange < -0.001 ? "down" : "flat";
  return { current, previous, absoluteChange, percentChange, direction };
}

export function computeBrandDeltas(
  current: BrandReportRow[],
  previous: BrandReportRow[],
): Map<string, { visibility: PeriodDelta; sov: PeriodDelta; mentions: PeriodDelta; sentiment?: PeriodDelta }> {
  const prevMap = new Map(previous.map((r) => [r.brand.id, r]));
  const result = new Map<
    string,
    { visibility: PeriodDelta; sov: PeriodDelta; mentions: PeriodDelta; sentiment?: PeriodDelta }
  >();

  for (const row of current) {
    const prev = prevMap.get(row.brand.id);
    if (!prev) continue;

    result.set(row.brand.id, {
      visibility: computeDelta(row.visibility, prev.visibility),
      sov: computeDelta(row.share_of_voice, prev.share_of_voice),
      mentions: computeDelta(row.mention_count, prev.mention_count),
      sentiment:
        row.sentiment !== undefined && prev.sentiment !== undefined
          ? computeDelta(row.sentiment, prev.sentiment)
          : undefined,
    });
  }

  return result;
}

export function computeDomainDeltas(
  current: DomainReportRow[],
  previous: DomainReportRow[],
): Map<string, { usageRate: PeriodDelta; citationAvg: PeriodDelta }> {
  const prevMap = new Map(previous.map((r) => [r.domain, r]));
  const result = new Map<string, { usageRate: PeriodDelta; citationAvg: PeriodDelta }>();

  for (const row of current) {
    const prev = prevMap.get(row.domain);
    if (!prev) continue;

    result.set(row.domain, {
      usageRate: computeDelta(row.usage_rate ?? 0, prev.usage_rate ?? 0),
      citationAvg: computeDelta(row.citation_avg, prev.citation_avg),
    });
  }

  return result;
}
