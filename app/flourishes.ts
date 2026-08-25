/** Shared flourish types — the structured research ingredients that decorate
 *  the human draft without ever rewriting it. */

export type FlourishSource = { title: string; url: string };

export type FlourishType = "story" | "viz" | "stat-cluster" | "trend" | "quote" | "table";

export type Flourish = {
  id: string;
  sectionId: string;
  signalLabel: string;
  type: FlourishType;
  title: string;
  /** story text or trend narrative */
  body?: string;
  chart?: {
    kind: "bar" | "line" | "column" | "donut" | "gauge" | "area";
    unit?: string;
    series: { label: string; value: number }[];
  };
  stats?: { value: string; label: string; source?: string }[];
  trend?: {
    direction: "rising" | "falling" | "emerging" | "contested";
    horizon: string;
    confidence: "high" | "medium" | "low";
    basis: string;
  };
  quote?: { text: string; attribution: string; url?: string };
  table?: { columns: string[]; rows: string[][] };
  caption?: string;
  sources: FlourishSource[];
  /** true when the model could not verify enough evidence — needs human resolution */
  unresolved?: boolean;
};

export const flourishTypeLabels: Record<FlourishType, string> = {
  story: "Story passage",
  viz: "Data visualization",
  "stat-cluster": "Statistical insight",
  trend: "Trend insight",
  quote: "Quote",
  table: "Timeline / table",
};

export const trendGlyphs: Record<NonNullable<Flourish["trend"]>["direction"], string> = {
  rising: "↗",
  falling: "↘",
  emerging: "✦",
  contested: "⇌",
};

/** Defensive parse of a model response that should be JSON but may be fenced or
 *  wrapped in prose. Returns null when no parseable flourish payload exists. */
export function parseFlourishPayload(raw: string): { flourishes: Flourish[]; reviewNotes?: string } | null {
  const candidates: string[] = [];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) candidates.push(fenced[1]);
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(raw.slice(first, last + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as { flourishes?: unknown; reviewNotes?: unknown };
      if (Array.isArray(parsed.flourishes)) {
        const flourishes = parsed.flourishes
          .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
          .map((f, index) => normalizeFlourish(f, index))
          .filter((f): f is Flourish => f !== null);
        if (flourishes.length) {
          return {
            flourishes,
            reviewNotes: typeof parsed.reviewNotes === "string" ? parsed.reviewNotes : undefined,
          };
        }
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

function normalizeFlourish(f: Record<string, unknown>, index: number): Flourish | null {
  const type = String(f.type || "");
  const valid: FlourishType[] = ["story", "viz", "stat-cluster", "trend", "quote", "table"];
  if (!valid.includes(type as FlourishType)) return null;
  const sources = Array.isArray(f.sources)
    ? (f.sources as Record<string, unknown>[])
        .filter((s) => s && typeof s === "object" && s.url)
        .map((s) => ({ title: String(s.title || s.url), url: String(s.url) }))
    : [];
  return {
    id: String(f.id || `flourish-${index}`),
    sectionId: String(f.sectionId || ""),
    signalLabel: String(f.signalLabel || ""),
    type: type as FlourishType,
    title: String(f.title || "Untitled flourish"),
    body: typeof f.body === "string" ? f.body : undefined,
    chart: isChart(f.chart) ? f.chart : undefined,
    stats: isStats(f.stats) ? f.stats : undefined,
    trend: isTrend(f.trend) ? f.trend : undefined,
    quote: isQuote(f.quote) ? f.quote : undefined,
    table: isTable(f.table) ? f.table : undefined,
    caption: typeof f.caption === "string" ? f.caption : undefined,
    sources,
    unresolved: f.unresolved === true,
  };
}

const CHART_KINDS = new Set(["bar", "line", "column", "donut", "gauge", "area"]);

function isChart(value: unknown): value is NonNullable<Flourish["chart"]> {
  if (!value || typeof value !== "object") return false;
  const chart = value as Record<string, unknown>;
  const minPoints = chart.kind === "gauge" ? 1 : 2;
  return (
    CHART_KINDS.has(String(chart.kind)) &&
    Array.isArray(chart.series) &&
    chart.series.length >= minPoints &&
    (chart.series as Record<string, unknown>[]).every((point) => point && typeof point.label === "string" && typeof point.value === "number" && Number.isFinite(point.value))
  );
}

function isStats(value: unknown): value is NonNullable<Flourish["stats"]> {
  return Array.isArray(value) && value.length >= 1 && (value as Record<string, unknown>[]).every((stat) => stat && typeof stat === "object" && stat.value !== undefined && stat.label !== undefined);
}

function isTrend(value: unknown): value is NonNullable<Flourish["trend"]> {
  if (!value || typeof value !== "object") return false;
  const trend = value as Record<string, unknown>;
  return ["rising", "falling", "emerging", "contested"].includes(String(trend.direction)) && typeof trend.basis === "string";
}

function isQuote(value: unknown): value is NonNullable<Flourish["quote"]> {
  if (!value || typeof value !== "object") return false;
  const quote = value as Record<string, unknown>;
  return typeof quote.text === "string" && typeof quote.attribution === "string";
}

function isTable(value: unknown): value is NonNullable<Flourish["table"]> {
  if (!value || typeof value !== "object") return false;
  const table = value as Record<string, unknown>;
  return Array.isArray(table.columns) && Array.isArray(table.rows);
}
