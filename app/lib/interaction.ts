import type { ResearchMaterial } from "./research";
import type { Flourish } from "./flourishes";

export type InteractionHint = "timeline" | "network" | "conditional" | "garden";

export type InteractivePayload = {
  kind: InteractionHint;
  title: string;
  prompt?: string;
  series?: { label: string; value: number }[];
  nodes?: { id: string; label: string }[];
  links?: { from: string; to: string }[];
  scenarios?: { id: string; label: string; outcome: string }[];
};

const TIME_WORDS = /\b(year|years|month|months|week|weeks|quarter|quarters|timeline|over time|from \d{4}|since \d{4}|trend|growth|decline|series)\b/i;
const NETWORK_WORDS = /\b(network|actors?|nodes?|partners?|coalition|cluster|ecosystem|orchestrat|supplier|distributor|graph|connection|dependency)\b/i;
const CONDITIONAL_WORDS = /\b(if |when |unless |scenario|stress test|counterfactual|sensitivity|what if|heuristic|assume|conditional|toggle|goal.?function.?form)\b/i;
const GARDEN_WORDS = /\b(culture|garden|norms?|ritual|repeated|emergence|community|moat)\b/i;

export function detectInteractionHint(text: string): InteractionHint | undefined {
  const sample = text.slice(0, 4000);
  if (NETWORK_WORDS.test(sample) && (CONDITIONAL_WORDS.test(sample) || /resilien|collapse|remove/i.test(sample))) {
    return "network";
  }
  if (TIME_WORDS.test(sample) && /\d/.test(sample)) return "timeline";
  if (CONDITIONAL_WORDS.test(sample)) return "conditional";
  if (GARDEN_WORDS.test(sample) && NETWORK_WORDS.test(sample)) return "garden";
  if (NETWORK_WORDS.test(sample)) return "network";
  return undefined;
}

export function tagMaterialHint(material: ResearchMaterial): ResearchMaterial {
  if (material.interactionHint) return material;
  const hint = detectInteractionHint([material.title, material.text, material.source].filter(Boolean).join("\n"));
  return hint ? { ...material, interactionHint: hint } : material;
}

export function buildInteractiveFromFlourish(flourish: Flourish): InteractivePayload | null {
  if (flourish.chart?.series?.length) {
    return {
      kind: "timeline",
      title: flourish.title,
      prompt: flourish.caption || "Scrub the series to see how the signal moves.",
      series: flourish.chart.series.map((point) => ({ label: point.label, value: point.value })),
    };
  }
  if (flourish.table?.rows?.length) {
    const nodes = flourish.table.rows.slice(0, 6).map((row, index) => ({
      id: `n${index}`,
      label: String(row[0] || `Node ${index + 1}`),
    }));
    if (nodes.length >= 3) {
      const links = nodes.slice(0, -1).map((node, index) => ({
        from: node.id,
        to: nodes[index + 1].id,
      }));
      return {
        kind: "network",
        title: flourish.title,
        prompt: "Remove a node and watch whether the network still holds.",
        nodes,
        links,
      };
    }
  }
  if (flourish.stats?.length || flourish.trend) {
    return {
      kind: "conditional",
      title: flourish.title,
      prompt: "Toggle the scenario and compare the outcome.",
      scenarios: [
        {
          id: "base",
          label: "Base case",
          outcome: flourish.caption || flourish.body || flourish.title,
        },
        {
          id: "stress",
          label: "Stress / remove key dependency",
          outcome: flourish.trend?.basis
            || "When the load-bearing node weakens, cooperation and measured contribution fall.",
        },
        {
          id: "renew",
          label: "Function preserved, form changed",
          outcome: "Keep the value-producing function; swap the form. The moat survives if the function still fires.",
        },
      ],
    };
  }
  return null;
}

export function synthesizeInteractiveBlocks(args: {
  flourishes: Flourish[];
  sectionId: string;
}): { flourishes: Flourish[]; interactive: Array<{ flourishId: string; payload: InteractivePayload }> } {
  const interactive: Array<{ flourishId: string; payload: InteractivePayload }> = [];
  for (const flourish of args.flourishes) {
    if (flourish.sectionId && flourish.sectionId !== args.sectionId) continue;
    const text = [flourish.title, flourish.body, flourish.caption, flourish.signalLabel].filter(Boolean).join("\n");
    const hint = flourish.interactionHint || detectInteractionHint(text);
    if (!hint) continue;
    const payload = buildInteractiveFromFlourish({ ...flourish, interactionHint: hint });
    if (!payload) continue;
    interactive.push({ flourishId: flourish.id, payload: { ...payload, kind: hint === "garden" ? "garden" : payload.kind } });
  }
  return { flourishes: args.flourishes, interactive };
}
