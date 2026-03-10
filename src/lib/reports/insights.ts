import type { InsightCardProps } from "@/components/report/insight-card";
import type { BrandReportRow, BrandVisibilityData, CitationData, CompetitiveGapData, DomainReportRow } from "../types";

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function pp(current: number, previous: number): string {
  const delta = (current - previous) * 100;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}pp`;
}

export function computeBrandVisibilityInsights(
  data: BrandVisibilityData,
  previousOverall?: BrandReportRow[],
): InsightCardProps[] {
  const insights: InsightCardProps[] = [];
  const { overall } = data;
  if (overall.length === 0) return insights;

  const sorted = [...overall].sort((a, b) => b.visibility - a.visibility);
  const top = sorted[0];

  // Top brand
  const prevMap = previousOverall ? new Map(previousOverall.map((r) => [r.brand.id, r])) : null;
  const prevTop = prevMap?.get(top.brand.id);

  if (prevTop) {
    insights.push({
      icon: top.visibility >= prevTop.visibility ? "trend-up" : "trend-down",
      text: `${top.brand.name} leads visibility at ${pct(top.visibility)}, ${pp(top.visibility, prevTop.visibility)} vs previous period.`,
      sentiment: top.visibility >= prevTop.visibility ? "positive" : "negative",
    });
  } else {
    insights.push({
      icon: "star",
      text: `${top.brand.name} leads visibility at ${pct(top.visibility)} with ${top.mention_count.toLocaleString()} mentions.`,
      sentiment: "positive",
    });
  }

  // Visibility gap
  if (sorted.length > 1) {
    const last = sorted[sorted.length - 1];
    const gap = ((top.visibility - last.visibility) * 100).toFixed(1);
    insights.push({
      icon: "info",
      text: `Visibility gap between ${top.brand.name} and ${last.brand.name} is ${gap}pp.`,
      sentiment: "neutral",
    });
  }

  // Sentiment
  const withSentiment = overall.filter((r) => r.sentiment !== undefined);
  if (withSentiment.length > 0) {
    const best = [...withSentiment].sort((a, b) => (b.sentiment ?? 0) - (a.sentiment ?? 0))[0];
    const worst = [...withSentiment].sort((a, b) => (a.sentiment ?? 0) - (b.sentiment ?? 0))[0];
    if (best.brand.id !== worst.brand.id) {
      insights.push({
        icon: "info",
        text: `Sentiment strongest for ${best.brand.name} (${best.sentiment?.toFixed(0)}/100), weakest for ${worst.brand.name} (${worst.sentiment?.toFixed(0)}/100).`,
        sentiment: "neutral",
      });
    }
  }

  // SoV leader
  const sovSorted = [...overall].sort((a, b) => b.share_of_voice - a.share_of_voice);
  const sovLeader = sovSorted[0];
  insights.push({
    icon: "star",
    text: `${sovLeader.brand.name} commands ${pct(sovLeader.share_of_voice)} share of voice across all AI models.`,
    sentiment: "positive",
  });

  // Period comparison biggest mover
  if (prevMap && prevMap.size > 0) {
    let biggestGain = { name: "", delta: -Infinity };
    for (const row of overall) {
      const prev = prevMap.get(row.brand.id);
      if (!prev) continue;
      const delta = row.visibility - prev.visibility;
      if (delta > biggestGain.delta) {
        biggestGain = { name: row.brand.name, delta };
      }
    }
    if (biggestGain.delta > 0.001) {
      insights.push({
        icon: "trend-up",
        text: `${biggestGain.name} saw the biggest gain: ${(biggestGain.delta * 100).toFixed(1)}pp increase in visibility.`,
        sentiment: "positive",
      });
    }
  }

  return insights.slice(0, 6);
}

export function computeCompetitiveGapInsights(
  data: CompetitiveGapData,
  previousOverall?: BrandReportRow[],
): InsightCardProps[] {
  const insights: InsightCardProps[] = [];
  const { overall, byPrompt, prompts } = data;
  if (overall.length === 0) return insights;

  const sorted = [...overall].sort((a, b) => b.visibility - a.visibility);
  const leader = sorted[0];
  const challenger = sorted.length > 1 ? sorted[1] : null;

  // Leader
  insights.push({
    icon: "star",
    text: `${leader.brand.name} leads overall visibility at ${pct(leader.visibility)}${challenger ? `, ${((leader.visibility - challenger.visibility) * 100).toFixed(1)}pp ahead of ${challenger.brand.name}` : ""}.`,
    sentiment: "positive",
  });

  // Period delta for leader
  if (previousOverall) {
    const prevLeader = previousOverall.find((r) => r.brand.id === leader.brand.id);
    if (prevLeader) {
      const dir = leader.visibility >= prevLeader.visibility ? "up" : "down";
      insights.push({
        icon: dir === "up" ? "trend-up" : "trend-down",
        text: `${leader.brand.name} visibility ${dir === "up" ? "increased" : "decreased"} by ${Math.abs((leader.visibility - prevLeader.visibility) * 100).toFixed(1)}pp vs previous period.`,
        sentiment: dir === "up" ? "positive" : "negative",
      });
    }
  }

  // Biggest gap prompt
  const promptMap = new Map(prompts.map((p) => [p.id, p.messages[0]?.content ?? p.id]));
  const grouped = new Map<string, BrandReportRow[]>();
  for (const row of byPrompt) {
    const pid = row.prompt?.id ?? "unknown";
    if (!grouped.has(pid)) grouped.set(pid, []);
    grouped.get(pid)!.push(row);
  }

  let maxGap = { prompt: "", gap: 0, leader: "", second: "" };
  for (const [pid, rows] of grouped) {
    if (rows.length < 2) continue;
    const s = [...rows].sort((a, b) => b.visibility - a.visibility);
    const gap = s[0].visibility - s[1].visibility;
    if (gap > maxGap.gap) {
      maxGap = {
        prompt: (promptMap.get(pid) ?? pid).slice(0, 60),
        gap,
        leader: s[0].brand.name,
        second: s[1].brand.name,
      };
    }
  }
  if (maxGap.gap > 0) {
    insights.push({
      icon: "alert",
      text: `Biggest competitive gap: "${maxGap.prompt}" — ${maxGap.leader} leads by ${(maxGap.gap * 100).toFixed(1)}pp over ${maxGap.second}.`,
      sentiment: "negative",
    });
  }

  // Total mentions
  const totalMentions = overall.reduce((s, r) => s + r.mention_count, 0);
  insights.push({
    icon: "info",
    text: `${totalMentions.toLocaleString()} total mentions tracked across ${overall.length} brands and ${grouped.size} search prompts.`,
    sentiment: "neutral",
  });

  return insights.slice(0, 6);
}

export function computeCitationInsights(
  data: CitationData,
  previousDomains?: DomainReportRow[],
): InsightCardProps[] {
  const insights: InsightCardProps[] = [];
  const { domains, urls } = data;
  if (domains.length === 0) return insights;

  // Classification breakdown
  const classCount = new Map<string, number>();
  for (const d of domains) {
    const cls = d.classification ?? "OTHER";
    classCount.set(cls, (classCount.get(cls) ?? 0) + 1);
  }

  const total = domains.length;
  const ownCount = classCount.get("OWN") ?? 0;
  const editorialCount = classCount.get("EDITORIAL") ?? 0;

  if (ownCount > 0 || editorialCount > 0) {
    insights.push({
      icon: ownCount / total < 0.2 ? "alert" : "info",
      text: `OWN domains account for ${((ownCount / total) * 100).toFixed(0)}% of cited sources — editorial sources make up ${((editorialCount / total) * 100).toFixed(0)}%.`,
      sentiment: ownCount / total < 0.2 ? "negative" : "neutral",
    });
  }

  // Top domain
  const topDomain = domains[0];
  if (topDomain) {
    const prevD = previousDomains?.find((d) => d.domain === topDomain.domain);
    if (prevD && topDomain.usage_rate !== undefined && prevD.usage_rate !== undefined) {
      insights.push({
        icon: topDomain.usage_rate >= prevD.usage_rate ? "trend-up" : "trend-down",
        text: `${topDomain.domain} remains the top cited domain at ${pct(topDomain.usage_rate)}, ${pp(topDomain.usage_rate, prevD.usage_rate)} vs previous period.`,
        sentiment: topDomain.usage_rate >= prevD.usage_rate ? "positive" : "negative",
      });
    } else if (topDomain.usage_rate !== undefined) {
      insights.push({
        icon: "star",
        text: `${topDomain.domain} is the most cited domain at ${pct(topDomain.usage_rate)} usage rate (${topDomain.classification ?? "N/A"}).`,
        sentiment: "positive",
      });
    }
  }

  // Top URL type
  if (urls.length > 0) {
    const typeCount = new Map<string, number>();
    for (const u of urls) {
      typeCount.set(u.classification, (typeCount.get(u.classification) ?? 0) + 1);
    }
    const topType = [...typeCount.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topType) {
      insights.push({
        icon: "info",
        text: `Most common cited URL type: ${topType[0]} (${topType[1]} of ${urls.length} tracked URLs).`,
        sentiment: "neutral",
      });
    }
  }

  // Total URLs and citation volume
  if (urls.length > 0) {
    const totalCitations = urls.reduce((s, u) => s + u.citation_count, 0);
    insights.push({
      icon: "info",
      text: `${totalCitations.toLocaleString()} total citations across ${urls.length} tracked URLs from ${domains.length} domains.`,
      sentiment: "neutral",
    });
  }

  return insights.slice(0, 6);
}
