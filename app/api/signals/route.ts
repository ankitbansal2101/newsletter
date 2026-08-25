import { NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

/* ── Ostrich data shapes ── */

type OstrichLead = {
  cluster_id: number;
  headline: string;
  category: string;
  status: string;
  weighted_score: number;
  records: number;
  sources: number;
  source_mix: Record<string, number>;
  source_classes: Record<string, number>;
  evidence_roles: Record<string, number>;
  top_topics: string;
  summary: string;
  reporting_value: string;
  coverage_gap: string;
  top_evidence: {
    date: string;
    source: string;
    signal_class: string;
    evidence_role: string;
    authority_weight: number;
    signal_pct: number;
    weighted_signal: number;
    entity: string;
    topic: string;
    text: string;
  }[];
  next_moves: string[];
};

type OstrichCluster = {
  cluster_id: number;
  cluster_name: string;
  category: string;
  terms: string[];
  topics: string[];
  size: number;
  source_count: number;
  source_diversity: number;
  recent_count: number;
  velocity: number;
  signal_mean: number;
  signal_p90: number;
  top_source: string;
  attention_score: number;
  rank: number;
  thesis: string;
  why_now: string;
};

/* ── Studio-facing shapes ── */

type Signal = {
  id: number;
  short: string;
  title: string;
  category: string;
  score: number;
  records: number;
  sources: number;
  status: string;
  mix: string;
  evidence: { title: string; source: string; date: string }[];
  tone: string;
};

type TopologyNode = {
  clusterId: number;
  rank: number;
  headline: string;
  category: string;
  score: number;
  freshRecords: number;
  freshSources: number;
  dominantType: string;
  hasNews: boolean;
  hasPrimary: boolean;
  x: number;
  y: number;
};

type TopologyLink = {
  source: number;
  target: number;
  affinity: number;
  flow: number;
  direction: string;
  flowFrom: number | null;
  flowTo: number | null;
  lagDays: number | null;
  sameCategory: boolean;
  sharedSourceType: boolean;
  basis: string[];
};

/* ── Tone assignment ── */
const categoryTones: Record<string, string> = {
  Robotics: "coral",
  "AI / LLM": "blue",
  Quantum: "violet",
  Deployment: "mint",
  "AI / Science": "yellow",
  "ML Research": "rose",
  Energy: "amber",
  "Bio / Health": "green",
  Compute: "cyan",
  "Climate / Earth": "teal",
};

const toneList = ["coral", "blue", "violet", "mint", "yellow", "rose", "amber", "green", "cyan", "teal"];

function getTone(category: string, index: number): string {
  return categoryTones[category] || toneList[index % toneList.length];
}

/* ── Evidence role → dominant type ── */
function dominantTypeFromRoles(roles: Record<string, number>): string {
  const entries = Object.entries(roles).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return "corpus";
  const top = entries[0][0];
  if (top === "arxiv") return "arxiv";
  if (top === "news" || top === "newsletter") return "news";
  if (top === "sec") return "sec";
  if (top === "ml_community" || top === "community") return "ml_community";
  return "corpus";
}

/* ── Mix string ── */
function buildMixString(sourceClasses: Record<string, number>): string {
  return Object.entries(sourceClasses)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`)
    .join(" · ");
}

/* ── Short headline from Ostrich headline ── */
function shortenHeadline(headline: string): string {
  // "Robotics / Computer Vision / Machine Learning activity is accelerating across 6 sources"
  // → "Robot policies are growing a memory" isn't derivable, so use a truncated version
  const cleaned = headline
    .replace(/\s+activity is accelerating.*$/, "")
    .replace(/\s+is accelerating.*$/, "");
  if (cleaned.length <= 45) return cleaned;
  return cleaned.slice(0, 42) + "…";
}

/* ── Transform lead → Signal ── */
function leadToSignal(lead: OstrichLead, index: number): Signal {
  return {
    id: lead.cluster_id,
    short: shortenHeadline(lead.headline),
    title: lead.headline,
    category: lead.category,
    score: lead.weighted_score,
    records: lead.records,
    sources: lead.sources,
    status: lead.status,
    mix: buildMixString(lead.source_classes),
    evidence: (lead.top_evidence || []).slice(0, 3).map((e) => ({
      title: e.text.slice(0, 80) + (e.text.length > 80 ? "…" : ""),
      source: e.source,
      date: e.date,
    })),
    tone: getTone(lead.category, index),
  };
}

/* ── Build topology nodes from cluster intelligence ── */
function clusterToNode(cluster: OstrichCluster, leads: OstrichLead[]): TopologyNode {
  const lead = leads.find((l) => l.cluster_id === cluster.cluster_id);
  const dominantType = lead ? dominantTypeFromRoles(lead.evidence_roles) : cluster.top_source || "corpus";
  const hasNews = lead ? "news_discourse" in (lead.source_classes || {}) : false;
  const hasPrimary = lead ? "primary_docs" in (lead.source_classes || {}) : false;

  return {
    clusterId: cluster.cluster_id,
    rank: cluster.rank,
    headline: cluster.cluster_name,
    category: cluster.category,
    score: cluster.attention_score || cluster.signal_mean || 0,
    freshRecords: lead?.records || cluster.recent_count || 0,
    freshSources: lead?.sources || cluster.source_count || 0,
    dominantType,
    hasNews,
    hasPrimary,
    // Layout: use a force-directed-like spread based on rank and category
    x: 100 + ((cluster.rank * 37 + cluster.cluster_id * 13) % 800),
    y: 50 + ((cluster.rank * 23 + cluster.cluster_id * 7) % 500),
  };
}

/* ── Build topology links from shared categories and overlapping sources ── */
function buildLinks(nodes: TopologyNode[], leads: OstrichLead[]): TopologyLink[] {
  const links: TopologyLink[] = [];
  const leadMap = new Map(leads.map((l) => [l.cluster_id, l]));

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const sameCategory = a.category === b.category;

      const leadA = leadMap.get(a.clusterId);
      const leadB = leadMap.get(b.clusterId);

      // Check for shared source types
      const rolesA = leadA ? Object.keys(leadA.evidence_roles) : [];
      const rolesB = leadB ? Object.keys(leadB.evidence_roles) : [];
      const sharedRoles = rolesA.filter((r) => rolesB.includes(r));
      const sharedSourceType = sharedRoles.length > 0;

      // Only create links when there's a meaningful connection
      if (!sameCategory && !sharedSourceType) continue;

      const affinity = sameCategory ? 60 + sharedRoles.length * 10 : sharedRoles.length * 20;
      if (affinity < 30) continue;

      // Direction: higher-scored node flows to lower-scored
      const flow = Math.min(affinity, 80);
      const [from, to] = a.score >= b.score ? [a, b] : [b, a];

      links.push({
        source: a.clusterId,
        target: b.clusterId,
        affinity: Math.min(affinity, 100),
        flow,
        direction: sameCategory ? "directed" : "co_emergent",
        flowFrom: sameCategory ? from.clusterId : null,
        flowTo: sameCategory ? to.clusterId : null,
        lagDays: null,
        sameCategory,
        sharedSourceType,
        basis: [
          ...(sameCategory ? [`same category: ${a.category}`] : []),
          ...(sharedRoles.length ? [`shared evidence: ${sharedRoles.join(", ")}`] : []),
        ],
      });
    }
  }

  // Limit to top links by affinity to avoid visual clutter
  return links.sort((a, b) => b.affinity - a.affinity).slice(0, 60);
}

/* ── Find latest weekly data directory ── */
function findLatestWeeklyDir(): string | null {
  const dataDir = join(process.cwd(), "data");

  // Check for pre-copied weekly-latest
  const latestDir = join(dataDir, "weekly-latest");
  if (existsSync(join(latestDir, "summaries"))) return latestDir;

  // Check ostrich weekly directories
  const ostrichWeekly = join(process.cwd(), "..", "ostrich", "data", "weekly");
  if (!existsSync(ostrichWeekly)) return null;

  const weeks = readdirSync(ostrichWeekly)
    .filter((d) => d.startsWith("2026-W"))
    .sort()
    .reverse();

  return weeks.length ? join(ostrichWeekly, weeks[0]) : null;
}

/* ── GET handler ── */
export async function GET() {
  try {
    const weeklyDir = findLatestWeeklyDir();
    const dataDir = join(process.cwd(), "data");

    if (!weeklyDir) {
      return NextResponse.json({ error: "No weekly data found", fallback: true }, { status: 404 });
    }

    // Read weekly signal summary
    const summaryPath = join(weeklyDir, "summaries", "weighted_summary_easy_signal.json");
    if (!existsSync(summaryPath)) {
      return NextResponse.json({ error: "No signal summary found" }, { status: 404 });
    }

    const summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
    const leads: OstrichLead[] = summary.leads || [];

    // Transform leads into signals (top 6 for the studio)
    const signals: Signal[] = leads.slice(0, 6).map(leadToSignal);

    // Read cluster intelligence for topology
    const clusterPath = join(dataDir, "cluster_intelligence.json");
    let topology = { nodes: [] as TopologyNode[], links: [] as TopologyLink[] };

    if (existsSync(clusterPath)) {
      const clusters: OstrichCluster[] = JSON.parse(readFileSync(clusterPath, "utf-8"));
      // Use top 40 clusters by rank
      const topClusters = clusters.filter((c) => c.rank <= 40).sort((a, b) => a.rank - b.rank);
      const nodes = topClusters.map((c) => clusterToNode(c, leads));
      const links = buildLinks(nodes, leads);
      topology = { nodes, links };
    }

    return NextResponse.json({
      signals,
      allLeads: leads.slice(0, 40).map(leadToSignal),
      topology,
      meta: {
        week: summary.week,
        profile: summary.profile,
        totalRecords: summary.corpus_stats?.week_records || summary.corpus_and_coverage?.weekly_documents_records || 0,
        totalSources: summary.corpus_stats?.week_sources || summary.corpus_and_coverage?.active_processed_sources?.length || 0,
        matchedClusters: summary.corpus_stats?.week_clusters || summary.corpus_and_coverage?.matched_clusters || 0,
      },
    });
  } catch (err) {
    console.error("Signal API error:", err);
    return NextResponse.json({ error: "Failed to load signals" }, { status: 500 });
  }
}
