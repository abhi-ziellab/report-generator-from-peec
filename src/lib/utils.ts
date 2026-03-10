/** Server-side filter for analytics report endpoints. */
export interface ReportFilter {
  field: string;
  operator: "in" | "not_in";
  values: string[];
}

/** Merges convenience shortcut parameters into a filters array. */
export function mergeFilters(
  filters: ReportFilter[] | undefined,
  ...shortcuts: Array<{ field: string; value: string | undefined }>
): ReportFilter[] | undefined {
  const merged: ReportFilter[] = filters ? [...filters] : [];
  const existingFields = new Set(merged.map((f) => f.field));
  for (const { field, value } of shortcuts) {
    if (value !== undefined && !existingFields.has(field)) {
      merged.push({ field, operator: "in", values: [value] });
      existingFields.add(field);
    }
  }
  return merged.length > 0 ? merged : undefined;
}

/** Validates and normalizes a date range. Caps future end_date to today. */
export function validateDateRange(
  startDate?: string,
  endDate?: string,
): { start_date?: string; end_date?: string } {
  const today = new Date().toISOString().slice(0, 10);
  const effectiveEnd = endDate && endDate > today ? today : endDate;

  if (startDate && effectiveEnd && startDate > effectiveEnd) {
    throw new Error(
      `Invalid date range: start_date (${startDate}) is after end_date (${effectiveEnd}).`
    );
  }

  return { start_date: startDate, end_date: effectiveEnd };
}

/** Extract project ID from a project-scoped API key. Format: skp-<base64>-<suffix> */
export function extractProjectId(apiKey: string): string | null {
  const parts = apiKey.split("-");
  // Format: skp-<base64segment>-<suffix> — the base64 part is between first and last dash
  if (parts.length < 3 || parts[0] !== "skp") return null;

  // The base64 segment could contain dashes, so take everything between "skp-" and the last segment
  const base64Part = parts.slice(1, -1).join("-");
  try {
    const decoded = Buffer.from(base64Part, "base64").toString("utf8");
    // Project IDs match: or_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const match = decoded.match(/or_[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

/** Format a date range as human-readable string */
export function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}

/** Get a preset date range ending today */
export function getDatePreset(preset: "7d" | "28d" | "90d"): { start: string; end: string } {
  const days = { "7d": 7, "28d": 28, "90d": 90 }[preset];
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Compute a previous period of the same duration ending the day before `start`. */
export function getPreviousPeriod(start: string, end: string): { start: string; end: string } {
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const durationMs = e.getTime() - s.getTime();
  const prevEnd = new Date(s.getTime() - 86_400_000); // day before start
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return {
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10),
  };
}
