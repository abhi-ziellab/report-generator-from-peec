"use client";

import { useWizard } from "@/hooks/use-wizard";
import { ReportLayout } from "@/components/report/report-layout";
import { Scorecards, type ScorecardItem } from "@/components/report/scorecards";
import { DataTable } from "@/components/report/data-table";
import { Section } from "@/components/report/section";
import { InsightCards, type InsightCardProps } from "@/components/report/insight-card";
import { PeecBarChart, PeecPieChart } from "@/components/charts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type {
  BrandReportRow,
  BrandVisibilityData,
  CitationData,
  CompetitiveGapData,
  DomainReportRow,
} from "@/lib/types";

// ── Helpers ──

function pct(n: number): string { return (n * 100).toFixed(1) + "%"; }
function delta(current: number, previous: number): string {
  const d = (current - previous) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1)}pp`;
}
function deltaN(current: number, previous: number): string {
  const d = current - previous;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1)}`;
}

// ── Brand Visibility Report ──

function BrandVisibilityReport({ data, isComprehensive }: { data: BrandVisibilityData; isComprehensive: boolean }) {
  const hasPrev = !!data.previousOverall?.length;
  const prevMap = hasPrev ? new Map(data.previousOverall!.map(r => [r.brand.id, r])) : null;
  const sorted = [...data.overall].sort((a, b) => b.visibility - a.visibility);
  const primary = sorted[0];
  if (!primary) return <p className="text-sm text-[var(--peec-text-muted)]">No data available.</p>;

  const prevPrimary = prevMap?.get(primary.brand.id);
  const totalChats = primary.visibility_total;

  // KPI Scorecards
  const kpis: ScorecardItem[] = [
    {
      label: "AI Visibility",
      value: pct(primary.visibility),
      delta: prevPrimary ? delta(primary.visibility, prevPrimary.visibility) : undefined,
      subtitle: `${primary.brand.name}`,
    },
    {
      label: "Chat Appearances",
      value: `${primary.visibility_count.toLocaleString()} / ${totalChats.toLocaleString()}`,
      subtitle: "Chats where brand appeared",
    },
    {
      label: "Share of Voice",
      value: pct(primary.share_of_voice),
      delta: prevPrimary ? delta(primary.share_of_voice, prevPrimary.share_of_voice) : undefined,
    },
    {
      label: "Avg. Position",
      value: primary.position !== undefined ? `#${primary.position.toFixed(1)}` : "N/A",
      delta: prevPrimary?.position !== undefined && primary.position !== undefined
        ? deltaN(primary.position, prevPrimary.position) : undefined,
      invertDelta: true,
    },
    {
      label: "Sentiment",
      value: primary.sentiment !== undefined ? `${primary.sentiment.toFixed(0)}/100` : "N/A",
      delta: prevPrimary?.sentiment !== undefined && primary.sentiment !== undefined
        ? deltaN(primary.sentiment, prevPrimary.sentiment) : undefined,
    },
  ];

  // Visibility by AI Model — horizontal bars
  const modelGroups = new Map<string, BrandReportRow[]>();
  for (const row of data.byModel) {
    const mid = row.model?.id ?? "unknown";
    if (!modelGroups.has(mid)) modelGroups.set(mid, []);
    modelGroups.get(mid)!.push(row);
  }
  const prevModelMap = new Map<string, BrandReportRow>();
  if (data.previousByModel) {
    for (const row of data.previousByModel) {
      if (row.brand.id === primary.brand.id) {
        prevModelMap.set(row.model?.id ?? "unknown", row);
      }
    }
  }

  const modelBarData = Array.from(modelGroups.entries()).map(([modelId, rows]) => {
    const brandRow = rows.find(r => r.brand.id === primary.brand.id);
    const prev = prevModelMap.get(modelId);
    return {
      model: modelId,
      current: brandRow ? +(brandRow.visibility * 100).toFixed(1) : 0,
      mentions: brandRow?.mention_count ?? 0,
      ...(hasPrev ? { previous: prev ? +(prev.visibility * 100).toFixed(1) : 0 } : {}),
    };
  }).sort((a, b) => b.current - a.current);

  // Competitive SOV — all brands
  const sovBarData = sorted.slice(0, 6).map(r => ({
    name: r.brand.name,
    value: +(r.share_of_voice * 100).toFixed(1),
  }));

  // Insights
  const insights: InsightCardProps[] = [];
  if (sorted.length > 1) {
    const gap = ((sorted[0].visibility - sorted[sorted.length - 1].visibility) * 100).toFixed(1);
    insights.push({
      icon: "info",
      text: `${sorted[0].brand.name} leads at ${pct(sorted[0].visibility)} visibility. Gap to ${sorted[sorted.length - 1].brand.name}: ${gap}pp.`,
      sentiment: "neutral",
    });
  }
  if (prevMap) {
    let bigMover = { name: "", d: 0 };
    for (const r of sorted) {
      const prev = prevMap.get(r.brand.id);
      if (!prev) continue;
      const d = r.visibility - prev.visibility;
      if (Math.abs(d) > Math.abs(bigMover.d)) bigMover = { name: r.brand.name, d };
    }
    if (Math.abs(bigMover.d) > 0.005) {
      insights.push({
        icon: bigMover.d > 0 ? "trend-up" : "trend-down",
        text: `Biggest mover: ${bigMover.name} ${bigMover.d > 0 ? "gained" : "lost"} ${Math.abs(bigMover.d * 100).toFixed(1)}pp visibility vs. previous period.`,
        sentiment: bigMover.d > 0 ? "positive" : "negative",
      });
    }
  }

  // Comprehensive: prompt-level data
  const promptMap = data.prompts ? new Map(data.prompts.map(p => [p.id, p])) : null;
  const tagMap = data.tags ? new Map(data.tags.map(t => [t.id, t.name])) : null;

  // Prompt breakdown for primary brand
  let promptRows: { query: string; visibility: number; sov: number; mentions: number; sentiment?: number; volume?: number }[] = [];
  if (isComprehensive && data.byPrompt && promptMap) {
    const byBrand = data.byPrompt.filter(r => r.brand.id === primary.brand.id);
    promptRows = byBrand
      .map(r => {
        const p = promptMap.get(r.prompt?.id ?? "");
        return {
          query: p?.messages[0]?.content ?? r.prompt?.id ?? "—",
          visibility: r.visibility,
          sov: r.share_of_voice,
          mentions: r.mention_count,
          sentiment: r.sentiment,
          volume: p?.volume,
        };
      })
      .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0) || b.visibility - a.visibility)
      .slice(0, 20);
  }

  // Tag breakdown for primary brand
  let tagRows: { tag: string; visibility: number; sov: number; mentions: number }[] = [];
  if (isComprehensive && data.byTag && tagMap) {
    const byBrand = data.byTag.filter(r => r.brand.id === primary.brand.id);
    tagRows = byBrand
      .map(r => ({
        tag: tagMap.get(r.tag?.id ?? "") ?? r.tag?.id ?? "Untagged",
        visibility: r.visibility,
        sov: r.share_of_voice,
        mentions: r.mention_count,
      }))
      .sort((a, b) => b.visibility - a.visibility);
  }

  // Model-level detail table (comprehensive)
  const modelDetailRows: { model: string; visibility: number; sov: number; mentions: number; sentiment?: number; position?: number; prevVis?: number }[] = [];
  if (isComprehensive) {
    for (const [modelId, rows] of modelGroups) {
      const brandRow = rows.find(r => r.brand.id === primary.brand.id);
      if (!brandRow) continue;
      const prev = prevModelMap.get(modelId);
      modelDetailRows.push({
        model: modelId,
        visibility: brandRow.visibility,
        sov: brandRow.share_of_voice,
        mentions: brandRow.mention_count,
        sentiment: brandRow.sentiment,
        position: brandRow.position,
        prevVis: prev?.visibility,
      });
    }
    modelDetailRows.sort((a, b) => b.visibility - a.visibility);
  }

  return (
    <>
      <Scorecards items={kpis} />
      {insights.length > 0 && <InsightCards insights={insights.slice(0, 3)} />}

      {/* Visibility by AI Model */}
      <Section title="Visibility by AI Model" subtitle={`${primary.brand.name} — current${hasPrev ? " vs. previous period" : ""}`}>
        <PeecBarChart
          data={modelBarData}
          xKey="model"
          bars={[
            { dataKey: "current", name: "Current", colorIndex: 2 },
            ...(hasPrev ? [{ dataKey: "previous", name: "Previous", colorIndex: 2, faded: true }] : []),
          ]}
          layout="vertical"
          valueFormatter={v => `${v}%`}
        />
      </Section>

      {/* Competitive Share of Voice */}
      {sorted.length > 1 && (
        <Section title="Share of Voice" subtitle="All tracked brands">
          <PeecPieChart data={sovBarData} innerRadius={50} valueFormatter={v => `${v}%`} height={260} />
        </Section>
      )}

      {/* Competitive Comparison Table */}
      <Section title="Brand Comparison">
        <DataTable
          columns={[
            "Brand", "Visibility", ...(hasPrev ? ["Δ Vis"] : []),
            "SoV", "Mentions", "Position", "Sentiment",
          ]}
          rows={sorted.slice(0, 8).map(r => {
            const prev = prevMap?.get(r.brand.id);
            return [
              r.brand.name,
              pct(r.visibility),
              ...(hasPrev ? [prev ? delta(r.visibility, prev.visibility) : "—"] : []),
              pct(r.share_of_voice),
              r.mention_count.toLocaleString(),
              r.position !== undefined ? `#${r.position.toFixed(1)}` : "N/A",
              r.sentiment !== undefined ? `${r.sentiment.toFixed(0)}` : "N/A",
            ];
          })}
        />
      </Section>

      {/* ── Comprehensive Sections ── */}

      {/* Model Detail Table */}
      {isComprehensive && modelDetailRows.length > 0 && (
        <Section title="Model Performance Detail" subtitle={`${primary.brand.name} across all AI platforms`}>
          <DataTable
            columns={["Model", "Visibility", ...(hasPrev ? ["Δ Vis"] : []), "SoV", "Mentions", "Position", "Sentiment"]}
            rows={modelDetailRows.map(r => [
              r.model,
              pct(r.visibility),
              ...(hasPrev ? [r.prevVis !== undefined ? delta(r.visibility, r.prevVis) : "—"] : []),
              pct(r.sov),
              r.mentions.toLocaleString(),
              r.position !== undefined ? `#${r.position.toFixed(1)}` : "N/A",
              r.sentiment !== undefined ? `${r.sentiment.toFixed(0)}` : "N/A",
            ])}
          />
        </Section>
      )}

      {/* Tag Performance */}
      {isComprehensive && tagRows.length > 0 && (
        <Section title="Performance by Category" subtitle="Visibility across content tags">
          <DataTable
            columns={["Tag", "Visibility", "SoV", "Mentions"]}
            rows={tagRows.map(r => [
              r.tag,
              pct(r.visibility),
              pct(r.sov),
              r.mentions.toLocaleString(),
            ])}
          />
        </Section>
      )}

      {/* Prompt-Level Visibility */}
      {isComprehensive && promptRows.length > 0 && (
        <Section title="Visibility by Search Query" subtitle={`${primary.brand.name} — top ${promptRows.length} prompts by volume`}>
          <DataTable
            columns={["Query", "Volume", "Visibility", "SoV", "Mentions"]}
            rows={promptRows.map(r => [
              `"${r.query.slice(0, 60)}${r.query.length > 60 ? "…" : ""}"`,
              r.volume ? r.volume.toLocaleString() : "—",
              pct(r.visibility),
              pct(r.sov),
              r.mentions.toLocaleString(),
            ])}
          />
        </Section>
      )}
    </>
  );
}

// ── Competitive Gap Report ──

function CompetitiveGapReport({ data, isComprehensive }: { data: CompetitiveGapData; isComprehensive: boolean }) {
  const hasPrev = !!data.previousOverall?.length;
  const prevMap = hasPrev ? new Map(data.previousOverall!.map(r => [r.brand.id, r])) : null;
  const sorted = [...data.overall].sort((a, b) => b.visibility - a.visibility);
  const promptMap = new Map(data.prompts.map(p => [p.id, p]));
  const tagMap = data.tags ? new Map(data.tags.map(t => [t.id, t.name])) : null;

  if (sorted.length === 0) return <p className="text-sm text-[var(--peec-text-muted)]">No data.</p>;

  const leader = sorted[0];
  const prevLeader = prevMap?.get(leader.brand.id);
  const totalChats = leader.visibility_total;

  // KPIs
  const kpis: ScorecardItem[] = [
    {
      label: "AI Visibility",
      value: pct(leader.visibility),
      delta: prevLeader ? delta(leader.visibility, prevLeader.visibility) : undefined,
      subtitle: `${leader.brand.name} (Leader)`,
    },
    {
      label: "Conversations",
      value: totalChats.toLocaleString(),
      subtitle: "Total AI chats analyzed",
    },
    {
      label: "Share of Voice",
      value: pct(leader.share_of_voice),
      delta: prevLeader ? delta(leader.share_of_voice, prevLeader.share_of_voice) : undefined,
    },
    {
      label: "Brands Tracked",
      value: sorted.length.toString(),
    },
    {
      label: "Prompts Tracked",
      value: data.prompts.length.toString(),
    },
  ];

  // Head-to-head bars
  const headToHead = sorted.slice(0, 6).map(r => ({
    brand: r.brand.name,
    visibility: +(r.visibility * 100).toFixed(1),
    sov: +(r.share_of_voice * 100).toFixed(1),
  }));

  // Model breakdown — grouped bar per model, brands as series
  const topBrands = sorted.slice(0, 5);
  const modelGroups = new Map<string, BrandReportRow[]>();
  for (const row of data.byModel) {
    const mid = row.model?.id ?? "unknown";
    if (!modelGroups.has(mid)) modelGroups.set(mid, []);
    modelGroups.get(mid)!.push(row);
  }
  const modelBarData = Array.from(modelGroups.entries()).map(([modelId, rows]) => {
    const entry: Record<string, unknown> = { model: modelId };
    for (const b of topBrands) {
      const row = rows.find(r => r.brand.id === b.brand.id);
      entry[b.brand.name] = row ? +(row.visibility * 100).toFixed(1) : 0;
    }
    return entry;
  });

  // Previous model data for comparison
  const prevModelGroups = new Map<string, BrandReportRow[]>();
  if (data.previousByModel) {
    for (const row of data.previousByModel) {
      const mid = row.model?.id ?? "unknown";
      if (!prevModelGroups.has(mid)) prevModelGroups.set(mid, []);
      prevModelGroups.get(mid)!.push(row);
    }
  }

  // Previous prompt data for comparison
  const prevPromptGroups = new Map<string, BrandReportRow[]>();
  if (data.previousByPrompt) {
    for (const row of data.previousByPrompt) {
      const pid = row.prompt?.id ?? "unknown";
      if (!prevPromptGroups.has(pid)) prevPromptGroups.set(pid, []);
      prevPromptGroups.get(pid)!.push(row);
    }
  }

  // Top prompts by opportunity
  const promptGroups = new Map<string, BrandReportRow[]>();
  for (const row of data.byPrompt) {
    const pid = row.prompt?.id ?? "unknown";
    if (!promptGroups.has(pid)) promptGroups.set(pid, []);
    promptGroups.get(pid)!.push(row);
  }

  const promptRows = Array.from(promptGroups.entries())
    .map(([pid, rows]) => {
      const prompt = promptMap.get(pid);
      const s = [...rows].sort((a, b) => b.visibility - a.visibility);
      const gap = s.length > 1 ? s[0].visibility - s[1].visibility : 0;
      // Previous period gap for this prompt
      const prevRows = prevPromptGroups.get(pid);
      let prevGap: number | undefined;
      if (prevRows && prevRows.length > 1) {
        const ps = [...prevRows].sort((a, b) => b.visibility - a.visibility);
        prevGap = ps[0].visibility - ps[1].visibility;
      }
      return { pid, prompt, rows: s, leader: s[0], gap, prevGap, volume: prompt?.volume ?? 0 };
    })
    .sort((a, b) => b.volume - a.volume || b.gap - a.gap)
    .slice(0, isComprehensive ? 25 : 15);

  // Insights
  const insights: InsightCardProps[] = [];
  if (sorted.length > 1) {
    const challenger = sorted[1];
    insights.push({
      icon: "star",
      text: `${leader.brand.name} leads at ${pct(leader.visibility)}, ${((leader.visibility - challenger.visibility) * 100).toFixed(1)}pp ahead of ${challenger.brand.name}.`,
      sentiment: "positive",
    });
  }
  if (prevMap) {
    let bigGain = { name: "", d: -Infinity };
    let bigLoss = { name: "", d: Infinity };
    for (const r of sorted) {
      const prev = prevMap.get(r.brand.id);
      if (!prev) continue;
      const d = r.visibility - prev.visibility;
      if (d > bigGain.d) bigGain = { name: r.brand.name, d };
      if (d < bigLoss.d) bigLoss = { name: r.brand.name, d };
    }
    if (bigGain.d > 0.005) insights.push({ icon: "trend-up", text: `${bigGain.name} gained ${(bigGain.d * 100).toFixed(1)}pp — biggest visibility increase this period.`, sentiment: "positive" });
    if (bigLoss.d < -0.005) insights.push({ icon: "trend-down", text: `${bigLoss.name} lost ${Math.abs(bigLoss.d * 100).toFixed(1)}pp — biggest visibility decline this period.`, sentiment: "negative" });
  }

  // Tag breakdown (comprehensive)
  let tagCompData: { tag: string; brands: { name: string; visibility: number }[] }[] = [];
  if (isComprehensive && data.byTag && tagMap) {
    const tagGroups = new Map<string, BrandReportRow[]>();
    for (const row of data.byTag) {
      const tid = row.tag?.id ?? "unknown";
      if (!tagGroups.has(tid)) tagGroups.set(tid, []);
      tagGroups.get(tid)!.push(row);
    }
    tagCompData = Array.from(tagGroups.entries())
      .map(([tid, rows]) => ({
        tag: tagMap.get(tid) ?? tid,
        brands: [...rows].sort((a, b) => b.visibility - a.visibility).slice(0, 5).map(r => ({
          name: r.brand.name,
          visibility: r.visibility,
        })),
      }))
      .sort((a, b) => (b.brands[0]?.visibility ?? 0) - (a.brands[0]?.visibility ?? 0));
  }

  return (
    <>
      <Scorecards items={kpis} />
      {insights.length > 0 && <InsightCards insights={insights.slice(0, 3)} />}

      {/* Head-to-head */}
      <Section title="Competitive Landscape" subtitle="Visibility & Share of Voice">
        <PeecBarChart
          data={headToHead}
          xKey="brand"
          bars={[
            { dataKey: "visibility", name: "Visibility %", colorIndex: 0 },
            { dataKey: "sov", name: "Share of Voice %", colorIndex: 1 },
          ]}
          valueFormatter={v => `${v}%`}
        />
      </Section>

      {/* Comparison table */}
      <Section title="Brand Comparison">
        <DataTable
          columns={["Brand", "Visibility", ...(hasPrev ? ["Δ Vis"] : []), "SoV", ...(hasPrev ? ["Δ SoV"] : []), "Mentions", "Position", "Sentiment"]}
          rows={sorted.slice(0, 8).map(r => {
            const prev = prevMap?.get(r.brand.id);
            return [
              r.brand.name,
              pct(r.visibility),
              ...(hasPrev ? [prev ? delta(r.visibility, prev.visibility) : "—"] : []),
              pct(r.share_of_voice),
              ...(hasPrev ? [prev ? delta(r.share_of_voice, prev.share_of_voice) : "—"] : []),
              r.mention_count.toLocaleString(),
              r.position !== undefined ? `#${r.position.toFixed(1)}` : "N/A",
              r.sentiment !== undefined ? `${r.sentiment.toFixed(0)}` : "N/A",
            ];
          })}
        />
      </Section>

      {/* By Model */}
      {modelBarData.length > 1 && topBrands.length > 1 && (
        <Section title="Visibility by AI Model" subtitle="Top brands across platforms">
          <PeecBarChart
            data={modelBarData}
            xKey="model"
            bars={topBrands.map((b, i) => ({ dataKey: b.brand.name, name: b.brand.name, colorIndex: i }))}
            valueFormatter={v => `${v}%`}
          />
        </Section>
      )}

      {/* Model Comparison Table (comprehensive) */}
      {isComprehensive && data.previousByModel && (
        <Section title="Model-Level Trends" subtitle="Competitive positioning change per AI platform">
          <DataTable
            columns={["Model", "Leader", "Visibility", ...(hasPrev ? ["Δ Vis"] : []), "#2", "Gap"]}
            rows={Array.from(modelGroups.entries()).map(([modelId, rows]) => {
              const s = [...rows].sort((a, b) => b.visibility - a.visibility);
              const top = s[0];
              const second = s[1];
              const prevRows = prevModelGroups.get(modelId);
              const prevTop = prevRows ? [...prevRows].sort((a, b) => b.visibility - a.visibility).find(r => r.brand.id === top.brand.id) : undefined;
              return [
                modelId,
                top.brand.name,
                pct(top.visibility),
                ...(hasPrev ? [prevTop ? delta(top.visibility, prevTop.visibility) : "—"] : []),
                second ? `${second.brand.name} (${pct(second.visibility)})` : "—",
                second ? `${((top.visibility - second.visibility) * 100).toFixed(1)}pp` : "—",
              ];
            })}
          />
        </Section>
      )}

      {/* Top Prompts */}
      {promptRows.length > 0 && (
        <Section title="Top Search Prompts" subtitle={`${promptRows.length} highest-opportunity queries`}>
          <DataTable
            columns={["Query", "Volume", "Leader", "Visibility", "Gap", ...(hasPrev && data.previousByPrompt ? ["Δ Gap"] : []), "SoV"]}
            rows={promptRows.map(p => [
              `"${(p.prompt?.messages[0]?.content ?? p.pid).slice(0, 55)}${(p.prompt?.messages[0]?.content ?? "").length > 55 ? "…" : ""}"`,
              p.volume ? p.volume.toLocaleString() : "—",
              p.leader.brand.name,
              pct(p.leader.visibility),
              p.rows.length > 1 ? `${(p.gap * 100).toFixed(1)}pp` : "—",
              ...(hasPrev && data.previousByPrompt ? [
                p.prevGap !== undefined ? deltaN(p.gap * 100, p.prevGap * 100) + "pp" : "new",
              ] : []),
              pct(p.leader.share_of_voice),
            ])}
          />
        </Section>
      )}

      {/* Tag Segmentation (comprehensive) */}
      {isComprehensive && tagCompData.length > 0 && (
        <Section title="Competitive Positioning by Category" subtitle="How brands perform across content tags">
          <DataTable
            columns={["Tag", "Leader", "Visibility", "#2", "#3"]}
            rows={tagCompData.map(t => [
              t.tag,
              t.brands[0] ? t.brands[0].name : "—",
              t.brands[0] ? pct(t.brands[0].visibility) : "—",
              t.brands[1] ? `${t.brands[1].name} (${pct(t.brands[1].visibility)})` : "—",
              t.brands[2] ? `${t.brands[2].name} (${pct(t.brands[2].visibility)})` : "—",
            ])}
          />
        </Section>
      )}
    </>
  );
}

// ── Citation Report ──

function CitationReport({ data, isComprehensive }: { data: CitationData; isComprehensive: boolean }) {
  const hasPrev = !!data.previousDomains?.length;
  const prevDomainMap = hasPrev ? new Map(data.previousDomains!.map(d => [d.domain, d])) : null;

  if (data.domains.length === 0 && data.urls.length === 0) {
    return <p className="text-sm text-[var(--peec-text-muted)]">No citation data available.</p>;
  }

  // Classification breakdown — current
  const classCounts = new Map<string, { count: number; totalUsage: number }>();
  for (const d of data.domains) {
    const cls = d.classification ?? "OTHER";
    const entry = classCounts.get(cls) ?? { count: 0, totalUsage: 0 };
    entry.count++;
    entry.totalUsage += d.usage_rate ?? 0;
    classCounts.set(cls, entry);
  }
  // Classification breakdown — previous (for drift)
  const prevClassCounts = new Map<string, { count: number; totalUsage: number }>();
  if (data.previousDomains) {
    for (const d of data.previousDomains) {
      const cls = d.classification ?? "OTHER";
      const entry = prevClassCounts.get(cls) ?? { count: 0, totalUsage: 0 };
      entry.count++;
      entry.totalUsage += d.usage_rate ?? 0;
      prevClassCounts.set(cls, entry);
    }
  }

  const classPieData = [...classCounts.entries()]
    .map(([name, { count }]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value);

  const totalDomains = data.domains.length;
  const prevTotalDomains = data.previousDomains?.length ?? 0;
  const ownCount = classCounts.get("OWN")?.count ?? 0;
  const editCount = classCounts.get("EDITORIAL")?.count ?? 0;
  const compCount = classCounts.get("COMPETITOR")?.count ?? 0;
  const prevOwnCount = prevClassCounts.get("OWN")?.count ?? 0;

  // Content type breakdown from URLs
  const typeCounts = new Map<string, number>();
  for (const u of data.urls) {
    typeCounts.set(u.classification, (typeCounts.get(u.classification) ?? 0) + 1);
  }
  const typeBarData = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ type: name, count: value }));

  // KPIs with deltas
  const totalCitations = data.urls.reduce((s, u) => s + u.citation_count, 0);
  const topDomain = data.domains[0];
  const prevTopDomain = topDomain && prevDomainMap ? prevDomainMap.get(topDomain.domain) : null;
  const ownPctCur = totalDomains > 0 ? ownCount / totalDomains : 0;
  const ownPctPrev = prevTotalDomains > 0 ? prevOwnCount / prevTotalDomains : 0;

  const kpis: ScorecardItem[] = [
    {
      label: "Domains Cited",
      value: totalDomains.toLocaleString(),
      delta: hasPrev ? deltaN(totalDomains, prevTotalDomains) : undefined,
    },
    { label: "URLs Tracked", value: data.urls.length.toString() },
    { label: "Total Citations", value: totalCitations.toLocaleString() },
    {
      label: "OWN Sources",
      value: `${(ownPctCur * 100).toFixed(0)}%`,
      subtitle: `${ownCount} of ${totalDomains} domains`,
      delta: hasPrev ? delta(ownPctCur, ownPctPrev) : undefined,
    },
    {
      label: "Top Domain",
      value: topDomain?.usage_rate ? pct(topDomain.usage_rate) : "N/A",
      subtitle: topDomain?.domain ?? "",
      delta: prevTopDomain?.usage_rate !== undefined && topDomain?.usage_rate !== undefined
        ? delta(topDomain.usage_rate, prevTopDomain.usage_rate) : undefined,
    },
  ];

  // Insights
  const insights: InsightCardProps[] = [];
  if (ownCount > 0) {
    const ownPctStr = (ownPctCur * 100).toFixed(0);
    const sentiment = ownPctCur < 0.2 ? "negative" : "neutral";
    insights.push({
      icon: ownPctCur < 0.2 ? "alert" : "info",
      text: `OWN domains: ${ownPctStr}% of sources. Editorial: ${((editCount / totalDomains) * 100).toFixed(0)}%. Competitor: ${((compCount / totalDomains) * 100).toFixed(0)}%.`,
      sentiment,
    });
  }
  if (data.urls.length > 0) {
    const topType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topType) {
      insights.push({
        icon: "info",
        text: `Most cited content type: ${topType[0]} (${topType[1]} URLs). Consider producing more ${topType[0].toLowerCase().replace(/_/g, " ")} content.`,
        sentiment: "neutral",
      });
    }
  }

  // Citation drift — biggest movers
  const drifts: { domain: string; classification: string | null; currentUsage: number; prevUsage: number; change: number }[] = [];
  if (hasPrev && prevDomainMap) {
    for (const d of data.domains) {
      const prev = prevDomainMap.get(d.domain);
      const prevUsage = prev?.usage_rate ?? 0;
      const curUsage = d.usage_rate ?? 0;
      drifts.push({ domain: d.domain, classification: d.classification, currentUsage: curUsage, prevUsage, change: curUsage - prevUsage });
    }
    if (data.previousDomains) {
      const currentDomainSet = new Set(data.domains.map(d => d.domain));
      for (const pd of data.previousDomains) {
        if (!currentDomainSet.has(pd.domain) && (pd.usage_rate ?? 0) > 0.005) {
          drifts.push({ domain: pd.domain, classification: pd.classification, currentUsage: 0, prevUsage: pd.usage_rate ?? 0, change: -(pd.usage_rate ?? 0) });
        }
      }
    }
    drifts.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const bigGainer = drifts.find(d => d.change > 0.005);
    const bigLoser = drifts.find(d => d.change < -0.005);
    if (bigGainer) {
      insights.push({
        icon: "trend-up",
        text: `Biggest citation gainer: ${bigGainer.domain} (${bigGainer.classification ?? "N/A"}) ${bigGainer.change > 0 ? "+" : ""}${(bigGainer.change * 100).toFixed(1)}pp usage rate.`,
        sentiment: "positive",
      });
    }
    if (bigLoser) {
      insights.push({
        icon: "trend-down",
        text: `Biggest citation drop: ${bigLoser.domain} (${bigLoser.classification ?? "N/A"}) ${(bigLoser.change * 100).toFixed(1)}pp usage rate.`,
        sentiment: "negative",
      });
    }
  }

  // Split domains
  const ownEditDomains = data.domains.filter(d => d.classification === "OWN" || d.classification === "EDITORIAL").slice(0, isComprehensive ? 15 : 8);
  const compDomains = data.domains.filter(d => d.classification === "COMPETITOR").slice(0, isComprehensive ? 10 : 5);
  const driftRows = drifts.slice(0, isComprehensive ? 15 : 10);

  // Model-level source preferences (comprehensive)
  let modelSourceData: { model: string; classifications: Map<string, { count: number; avgUsage: number }> }[] = [];
  if (isComprehensive && data.domainsByModel.length > 0) {
    const byModel = new Map<string, DomainReportRow[]>();
    for (const row of data.domainsByModel) {
      const mid = row.model?.id ?? "unknown";
      if (!byModel.has(mid)) byModel.set(mid, []);
      byModel.get(mid)!.push(row);
    }
    modelSourceData = Array.from(byModel.entries()).map(([model, rows]) => {
      const classifications = new Map<string, { count: number; avgUsage: number }>();
      for (const r of rows) {
        const cls = r.classification ?? "OTHER";
        const entry = classifications.get(cls) ?? { count: 0, avgUsage: 0 };
        entry.count++;
        entry.avgUsage += r.usage_rate ?? 0;
        classifications.set(cls, entry);
      }
      return { model, classifications };
    });
  }

  // Previous model comparison for classification drift per model
  let modelDriftData: { model: string; ownCur: number; ownPrev: number; editCur: number; editPrev: number; compCur: number; compPrev: number }[] = [];
  if (isComprehensive && data.previousDomainsByModel && data.domainsByModel.length > 0) {
    const curByModel = new Map<string, DomainReportRow[]>();
    for (const row of data.domainsByModel) {
      const mid = row.model?.id ?? "unknown";
      if (!curByModel.has(mid)) curByModel.set(mid, []);
      curByModel.get(mid)!.push(row);
    }
    const prevByModel = new Map<string, DomainReportRow[]>();
    for (const row of data.previousDomainsByModel) {
      const mid = row.model?.id ?? "unknown";
      if (!prevByModel.has(mid)) prevByModel.set(mid, []);
      prevByModel.get(mid)!.push(row);
    }
    for (const [modelId, curRows] of curByModel) {
      const prevRows = prevByModel.get(modelId) ?? [];
      const countCls = (rows: DomainReportRow[], cls: string) => rows.filter(r => r.classification === cls).length;
      const total = (rows: DomainReportRow[]) => rows.length || 1;
      modelDriftData.push({
        model: modelId,
        ownCur: countCls(curRows, "OWN") / total(curRows),
        ownPrev: countCls(prevRows, "OWN") / total(prevRows),
        editCur: countCls(curRows, "EDITORIAL") / total(curRows),
        editPrev: countCls(prevRows, "EDITORIAL") / total(prevRows),
        compCur: countCls(curRows, "COMPETITOR") / total(curRows),
        compPrev: countCls(prevRows, "COMPETITOR") / total(prevRows),
      });
    }
  }

  return (
    <>
      <Scorecards items={kpis} />
      {insights.length > 0 && <InsightCards insights={insights.slice(0, 4)} />}

      {/* Citation Drift */}
      {driftRows.length > 0 && (
        <Section title="Citation Drift" subtitle="Domains with biggest usage rate changes vs. previous period">
          <DataTable
            columns={["Domain", "Classification", "Current", "Previous", "Δ Usage Rate"]}
            rows={driftRows.map(d => [
              d.domain,
              d.classification ?? "N/A",
              pct(d.currentUsage),
              pct(d.prevUsage),
              delta(d.currentUsage, d.prevUsage),
            ])}
          />
        </Section>
      )}

      {/* Source Classification + Content Types side by side */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Section title="Source Classification" subtitle="What types of domains AI cites">
          <PeecPieChart data={classPieData} innerRadius={40} height={240} valueFormatter={v => `${v} domains`} />
        </Section>
        <Section title="Content Types Cited" subtitle="Most cited URL formats">
          <PeecBarChart
            data={typeBarData}
            xKey="type"
            bars={[{ dataKey: "count", name: "URLs", colorIndex: 1 }]}
            layout="vertical"
            height={Math.max(180, typeBarData.length * 32)}
          />
        </Section>
      </div>

      {/* Classification Trend by Model (comprehensive with comparison) */}
      {isComprehensive && modelDriftData.length > 0 && (
        <Section title="Source Mix by AI Model" subtitle="How each model's citation preferences changed">
          <DataTable
            columns={["Model", "OWN %", "Δ OWN", "Editorial %", "Δ Editorial", "Competitor %", "Δ Competitor"]}
            rows={modelDriftData.map(m => [
              m.model,
              pct(m.ownCur),
              delta(m.ownCur, m.ownPrev),
              pct(m.editCur),
              delta(m.editCur, m.editPrev),
              pct(m.compCur),
              delta(m.compCur, m.compPrev),
            ])}
          />
        </Section>
      )}

      {/* Model Source Preferences (comprehensive, no comparison needed) */}
      {isComprehensive && !data.previousDomainsByModel && modelSourceData.length > 0 && (
        <Section title="Citation Patterns by Model" subtitle="Which AI models cite which source types">
          <DataTable
            columns={["Model", "Domains", "Top Classification", "OWN %"]}
            rows={modelSourceData.map(m => {
              const total = Array.from(m.classifications.values()).reduce((s, v) => s + v.count, 0);
              const topCls = [...m.classifications.entries()].sort((a, b) => b[1].count - a[1].count)[0];
              const ownCls = m.classifications.get("OWN");
              return [
                m.model,
                total.toString(),
                topCls ? `${topCls[0]} (${((topCls[1].count / total) * 100).toFixed(0)}%)` : "—",
                ownCls ? `${((ownCls.count / total) * 100).toFixed(0)}%` : "0%",
              ];
            })}
          />
        </Section>
      )}

      {/* Own/Editorial Domains */}
      {ownEditDomains.length > 0 && (
        <Section title="Top Own & Editorial Sources" subtitle="Domains you control or influence">
          <DataTable
            columns={["Domain", "Classification", "Usage Rate", ...(hasPrev ? ["Δ Usage"] : []), "Avg Citations"]}
            rows={ownEditDomains.map(d => {
              const prev = prevDomainMap?.get(d.domain);
              return [
                d.domain,
                d.classification ?? "N/A",
                d.usage_rate !== undefined ? pct(d.usage_rate) : "N/A",
                ...(hasPrev ? [prev?.usage_rate !== undefined && d.usage_rate !== undefined ? delta(d.usage_rate, prev.usage_rate) : "new"] : []),
                d.citation_avg.toFixed(2),
              ];
            })}
          />
        </Section>
      )}

      {/* Competitor Domains */}
      {compDomains.length > 0 && (
        <Section title="Competitor Sources" subtitle="Competitor domains cited by AI">
          <DataTable
            columns={["Domain", "Usage Rate", ...(hasPrev ? ["Δ Usage"] : []), "Avg Citations"]}
            rows={compDomains.map(d => {
              const prev = prevDomainMap?.get(d.domain);
              return [
                d.domain,
                d.usage_rate !== undefined ? pct(d.usage_rate) : "N/A",
                ...(hasPrev ? [prev?.usage_rate !== undefined && d.usage_rate !== undefined ? delta(d.usage_rate, prev.usage_rate) : "new"] : []),
                d.citation_avg.toFixed(2),
              ];
            })}
          />
        </Section>
      )}

      {/* Top URLs */}
      {data.urls.length > 0 && (
        <Section title="Top Cited URLs" subtitle="Most referenced content pieces">
          <DataTable
            columns={["Title / URL", "Type", "Citations", "Avg Citations"]}
            rows={data.urls.slice(0, isComprehensive ? 20 : 10).map(u => [
              <div key={u.url}>
                <p className="text-sm text-[var(--peec-text)] leading-tight">{u.title || "Untitled"}</p>
                <p className="text-[10px] text-[var(--peec-text-muted)] mt-0.5 truncate max-w-[500px]">{u.url}</p>
              </div>,
              u.classification,
              u.citation_count.toLocaleString(),
              u.citation_avg.toFixed(2),
            ])}
          />
        </Section>
      )}
    </>
  );
}

// ── Main Report Page ──

export default function ReportPage() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const report = state.report;

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--peec-bg)]">
        <div className="text-center">
          <p className="text-[var(--peec-text-muted)] mb-4">No report generated yet.</p>
          <button
            onClick={() => { dispatch({ type: "SET_STEP", step: 1 }); router.push("/wizard"); }}
            className="rounded-lg bg-[var(--peec-primary)] px-6 py-2.5 text-sm font-medium text-white"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const isComprehensive = report.config?.reportScope === "comprehensive";

  // Set document title to the report title for PDF export
  useEffect(() => {
    document.title = `${report.title} - ${report.projectName}`;
    return () => { document.title = "Report"; };
  }, [report.title, report.projectName]);

  return (
    <ReportLayout report={report} clientLogoUrl={state.clientLogoUrl}>
      {/* Data visualizations — the core report */}
      {report.type === "brand-visibility" && (
        <BrandVisibilityReport data={report.data as BrandVisibilityData} isComprehensive={isComprehensive} />
      )}
      {report.type === "competitive-gap" && (
        <CompetitiveGapReport data={report.data as CompetitiveGapData} isComprehensive={isComprehensive} />
      )}
      {report.type === "citation-report" && (
        <CitationReport data={report.data as CitationData} isComprehensive={isComprehensive} />
      )}

      {/* Key Takeaways — LLM narrative, compact bullets */}
      {report.sections.length > 0 && (
        <Section title="Key Takeaways">
          <div className="text-[12.5px] text-[var(--peec-text)] leading-relaxed space-y-1">
            {report.sections.map((section, i) => (
              <div key={i}>
                {section.narrative.split("\n").filter(l => l.trim()).map((line, j) => (
                  <p key={j} className="mb-1.5 print-break-inside-avoid">{line}</p>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="no-print flex items-center gap-4 mt-6 pt-4 border-t border-[var(--peec-border)]">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-[var(--peec-primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--peec-primary-dark)] transition-colors"
        >
          Export PDF
        </button>
        <button
          onClick={() => { dispatch({ type: "RESET" }); router.push("/wizard"); }}
          className="rounded-lg border border-[var(--peec-border)] px-5 py-2 text-sm font-medium hover:bg-[var(--peec-bg)] transition-colors"
        >
          New Report
        </button>
      </div>
    </ReportLayout>
  );
}
