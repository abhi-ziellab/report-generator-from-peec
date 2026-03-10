/** Peec AI dashboard chart palette — matches the brand's line/bar/pie colors */
export const PEEC_CHART_COLORS = [
  "#e74c3c", // coral/red
  "#4f46e5", // indigo
  "#3b82f6", // blue
  "#eab308", // amber
  "#22c55e", // green
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
] as const;

export function getChartColor(index: number): string {
  return PEEC_CHART_COLORS[index % PEEC_CHART_COLORS.length];
}

/** Lighter version for previous period comparison (50% opacity) */
export function getChartColorFaded(index: number): string {
  const hex = getChartColor(index);
  return hex + "80"; // ~50% opacity
}

/** Classification badge colors — matches Peec dashboard pills */
export const CLASSIFICATION_COLORS: Record<string, { bg: string; text: string }> = {
  UGC: { bg: "#dbeafe", text: "#2563eb" },
  EDITORIAL: { bg: "#fce7f3", text: "#db2777" },
  CORPORATE: { bg: "#fef3c7", text: "#d97706" },
  OWN: { bg: "#dcfce7", text: "#16a34a" },
  COMPETITOR: { bg: "#fee2e2", text: "#dc2626" },
  INSTITUTIONAL: { bg: "#e0e7ff", text: "#4338ca" },
  REFERENCE: { bg: "#f3e8ff", text: "#7c3aed" },
  OTHER: { bg: "#f1f5f9", text: "#64748b" },
};
