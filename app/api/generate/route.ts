import { attachBlocksToSections, applyMemeAssetPriority, normalizeSectionBlocks, paragraphsFromBlocks } from "../../lib/blocks";
import { headingFromDocument, isGenericTopicLabel, resolveStoryTopic } from "../../lib/topic";
import { parseOpenAIJson } from "../../lib/http";
import { parseJsonObject } from "../../lib/json";
import type { ResearchMaterial } from "../../lib/research";
import type { SectionBlock } from "../../templates/types";
import { parseFlourishPayload, type Flourish } from "../../lib/flourishes";

export const runtime = "nodejs";
export const maxDuration = 60;

type GenerateRequest = {
  topic?: string;
  document?: string;
  components?: string[];
  materials?: ResearchMaterial[];
  /** When false, do not use web_search — convert manuscript only. */
  scrapeWeb?: boolean;
};

type NewsletterSection = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  quote?: string;
  paragraphs: string[];
  blocks?: SectionBlock[];
};

type MemeFormat = "impact" | "two-panel" | "drake" | "expanding-brain" | "caption-card" | "image";

type IssueMeme = {
  id?: string;
  sectionId: string;
  src?: string;
  title: string;
  alt: string;
  credit: string;
  signalLabel: string;
  format?: MemeFormat;
  topText?: string;
  bottomText?: string;
  panels?: string[];
};

type DynamicIssue = {
  title: { en: string; ja: string };
  dek: { en: string; ja: string };
  sectionsEn: NewsletterSection[];
  sectionsJa: NewsletterSection[];
  flourishes: Flourish[];
  memes: IssueMeme[];
};

const MEME_FORMATS: MemeFormat[] = ["impact", "two-panel", "drake", "expanding-brain", "caption-card", "image"];

function asMemeFormat(value: unknown): MemeFormat {
  const raw = String(value || "").toLowerCase();
  return MEME_FORMATS.includes(raw as MemeFormat) ? (raw as MemeFormat) : "impact";
}

function normalizeMeme(item: Record<string, unknown>, fallbackSectionId: string, topicLabel: string, index: number): IssueMeme | null {
  const topText = typeof item.topText === "string" ? item.topText.trim() : "";
  const bottomText = typeof item.bottomText === "string" ? item.bottomText.trim() : "";
  const panels = Array.isArray(item.panels)
    ? item.panels.map((panel) => String(panel).trim()).filter(Boolean).slice(0, 4)
    : undefined;
  const src = typeof item.src === "string" && /^https?:\/\//i.test(item.src.trim())
    ? item.src.trim()
    : typeof item.src === "string" && item.src.startsWith("/")
      ? item.src.trim()
      : "";
  const title = String(item.title || topText || bottomText || "Editorial meme").trim();
  const hasCopy = Boolean(topText || bottomText || (panels && panels.length) || src);
  if (!hasCopy) return null;

  const format = src && !topText && !bottomText && !(panels && panels.length)
    ? "image"
    : asMemeFormat(item.format || (src ? "image" : "impact"));

  return {
    id: String(item.id || `meme-${index + 1}`),
    sectionId: String(item.sectionId || fallbackSectionId),
    src: src || undefined,
    title,
    alt: String(item.alt || title),
    credit: String(item.credit || "Sunday Data editorial meme"),
    signalLabel: String(item.signalLabel || topicLabel || "topic"),
    format,
    topText: topText || undefined,
    bottomText: bottomText || undefined,
    panels,
  };
}

function synthesizeMemesFromMaterials(args: {
  materials: ResearchMaterial[];
  sections: NewsletterSection[];
  topic: string;
  existing: IssueMeme[];
}): IssueMeme[] {
  const { materials, sections, topic, existing } = args;
  if (existing.length >= 2) return existing;

  const memeMaterials = materials.filter((material) => material.type === "meme");
  const synthesized: IssueMeme[] = [...existing];
  const formats: MemeFormat[] = ["two-panel", "drake", "impact", "caption-card"];

  memeMaterials.forEach((material, index) => {
    if (synthesized.length >= 4) return;
    const text = (material.text || material.title || "").trim();
    if (!text) return;
    const sectionId = sections[Math.min(index, Math.max(0, sections.length - 1))]?.id || "opening";
    const halves = text.includes("|")
      ? text.split("|").map((part) => part.trim()).filter(Boolean)
      : text.split(/\n+/).map((part) => part.trim()).filter(Boolean);
    const topText = halves[0] || text.slice(0, 72);
    const bottomText = halves[1] || material.title || "When the deck says strategy but the room says vibes.";
    synthesized.push({
      id: `loot-meme-${index + 1}`,
      sectionId,
      title: material.title || `Meme ${index + 1}`,
      alt: text.slice(0, 140),
      credit: material.credit || material.source || "Research meme concept",
      signalLabel: topic || "topic",
      format: formats[index % formats.length],
      topText,
      bottomText,
    });
  });

  // Last-resort topic punchlines if still thin
  if (synthesized.length < 2 && (topic || sections[0]?.title)) {
    const theme = topic || sections[0]?.title || "this week";
    const fallbacks: IssueMeme[] = [
      {
        id: "auto-meme-1",
        sectionId: sections[1]?.id || sections[0]?.id || "opening",
        title: "Reject / Approve",
        format: "drake",
        topText: `Another abstract take on ${theme}`,
        bottomText: "One concrete beat from this week's brief",
        alt: `Drake-style meme about ${theme}`,
        credit: "Sunday Data auto meme",
        signalLabel: theme,
      },
      {
        id: "auto-meme-2",
        sectionId: sections[Math.min(2, Math.max(0, sections.length - 1))]?.id || "opening",
        title: "Expectation / Reality",
        format: "two-panel",
        topText: `We have a clear story on ${theme}`,
        bottomText: "We have a clear costume and a fuzzy story",
        alt: `Two-panel meme about ${theme}`,
        credit: "Sunday Data auto meme",
        signalLabel: theme,
      },
    ];
    fallbacks.forEach((meme) => {
      if (synthesized.length >= 2) return;
      synthesized.push(meme);
    });
  }

  return synthesized.slice(0, 4);
}

const DEFAULT_MODEL = "gpt-5.6-terra";

function getOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return "";
  return response.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) return [];
      return content
        .filter((part) => part && typeof part === "object" && (part as { type?: string }).type === "output_text")
        .map((part) => String((part as { text?: unknown }).text || ""));
    })
    .filter(Boolean)
    .join("\n\n");
}

function asSections(value: unknown): NewsletterSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => {
      const blocks = normalizeSectionBlocks(item.blocks);
      const paragraphs = Array.isArray(item.paragraphs)
        ? item.paragraphs.map((p) => String(p)).filter(Boolean)
        : paragraphsFromBlocks(blocks, []);
      return {
        id: String(item.id || `section-${index + 1}`),
        eyebrow: String(item.eyebrow || `Section ${index + 1}`),
        title: String(item.title || "Untitled"),
        subtitle: typeof item.subtitle === "string" ? item.subtitle : undefined,
        quote: typeof item.quote === "string" ? item.quote : undefined,
        paragraphs,
        blocks: blocks.length ? blocks : undefined,
      };
    })
    .filter((section) => section.paragraphs.length > 0 || (section.blocks && section.blocks.length > 0));
}

type NumericFact = { label: string; value: number; unit?: string; source?: string };

function parseNumericToken(raw: string): { value: number; unit?: string } | null {
  const cleaned = raw.replace(/,/g, "").trim();
  const match = cleaned.match(/^([+-]?\d+(?:\.\d+)?)(\s*%|k|m|b|bn|million|billion)?$/i);
  if (!match) return null;
  let value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const suffix = (match[2] || "").trim().toLowerCase();
  if (suffix === "k") value *= 1_000;
  if (suffix === "m" || suffix === "million") value *= 1_000_000;
  if (suffix === "b" || suffix === "bn" || suffix === "billion") value *= 1_000_000_000;
  return { value, unit: suffix === "%" ? "%" : undefined };
}

function extractNumericFacts(materials: ResearchMaterial[], document: string): NumericFact[] {
  const facts: NumericFact[] = [];
  const seen = new Set<string>();
  const blobs: Array<{ text: string; title: string; source?: string }> = [
    ...materials.map((item) => ({
      text: `${item.title}. ${item.text || ""}`,
      title: item.title,
      source: item.source || item.credit,
    })),
    ...(document ? [{ text: document.slice(0, 12_000), title: "Field notes", source: "document" }] : []),
  ];

  const pattern = /(?:^|[^\w])((?:\$)?\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(%|percent|percentage|k|m|b|bn|million|billion)?/gi;
  for (const blob of blobs) {
    const matches = blob.text.matchAll(pattern);
    for (const match of matches) {
      const token = `${match[1]}${match[2] || ""}`.replace(/^\$/, "");
      const parsed = parseNumericToken(token.replace(/percent(?:age)?/i, "%"));
      if (!parsed || parsed.value <= 0) continue;
      const around = blob.text.slice(Math.max(0, (match.index || 0) - 40), (match.index || 0) + 60).replace(/\s+/g, " ").trim();
      const label = around.slice(0, 42) || blob.title.slice(0, 42);
      const key = `${parsed.value}-${label.slice(0, 18)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      facts.push({ label, value: parsed.value, unit: parsed.unit, source: blob.source });
      if (facts.length >= 12) return facts;
    }
  }
  return facts;
}

function synthesizeDataFlourishes(args: {
  existing: Flourish[];
  materials: ResearchMaterial[];
  document: string;
  sections: NewsletterSection[];
  components: string[];
}): Flourish[] {
  const wantsStats = args.components.includes("stats");
  if (!wantsStats) return args.existing;
  const vizCount = args.existing.filter((item) => item.type === "viz" && item.chart).length;
  const statCount = args.existing.filter((item) => item.type === "stat-cluster").length;
  if (vizCount >= 3 && statCount >= 1) return args.existing;

  const facts = extractNumericFacts(args.materials, args.document);
  if (facts.length < 2) return args.existing;

  const sectionId = args.sections[1]?.id || args.sections[0]?.id || "opening";
  const extras: Flourish[] = [];
  const percents = facts.filter((fact) => fact.unit === "%" || fact.value <= 100);
  const magnitudes = facts.filter((fact) => fact.unit !== "%" && fact.value > 100);

  if (vizCount < 3 && magnitudes.length >= 3) {
    extras.push({
      id: "viz-from-evidence",
      sectionId,
      signalLabel: "Evidence chart",
      type: "viz",
      title: "Signals pulled from the research field",
      chart: {
        kind: "column",
        series: magnitudes.slice(0, 6).map((fact) => ({ label: fact.label.slice(0, 18), value: fact.value })),
      },
      caption: "Comparable magnitudes extracted from selected sources, notes, and scraped pages.",
      sources: args.materials.filter((item) => item.url).slice(0, 3).map((item) => ({ title: item.title, url: item.url as string })),
    });
  }

  if (vizCount < 3 && percents.length >= 3) {
    extras.push({
      id: "viz-share-from-evidence",
      sectionId: args.sections[2]?.id || sectionId,
      signalLabel: "Share analysis",
      type: "viz",
      title: "How the percentages stack",
      chart: {
        kind: "donut",
        unit: "%",
        series: percents.slice(0, 5).map((fact) => ({ label: fact.label.slice(0, 18), value: fact.value })),
      },
      caption: "Percentage findings from the document and web materials, shown as a share map.",
      sources: [],
    });
  }

  if (vizCount < 3 && percents[0]) {
    extras.push({
      id: "viz-gauge-from-evidence",
      sectionId,
      signalLabel: "Lead signal",
      type: "viz",
      title: percents[0].label,
      chart: { kind: "gauge", unit: "%", series: [{ label: percents[0].label.slice(0, 24), value: percents[0].value }] },
      caption: "Lead quantitative signal from the gathered evidence.",
      sources: [],
    });
  }

  if (statCount < 1) {
    extras.push({
      id: "stats-from-evidence",
      sectionId,
      signalLabel: "Field numbers",
      type: "stat-cluster",
      title: "Numbers the research keeps repeating",
      stats: facts.slice(0, 4).map((fact) => ({
        value: fact.unit === "%" ? `${fact.value}%` : fact.value.toLocaleString(),
        label: fact.label,
        source: fact.source,
      })),
      sources: [],
    });
  }

  const existingIds = new Set(args.existing.map((item) => item.id));
  return [...args.existing, ...extras.filter((item) => !existingIds.has(item.id))];
}

export async function GET() {
  return Response.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
  });
}

export async function POST(request: Request) {
  try {
    return await generateIssue(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function generateIssue(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OpenAI is not configured. Add OPENAI_API_KEY (and OPENAI_MODEL) in Vercel → Settings → Environment Variables." },
      { status: 503 },
    );
  }

  let body: GenerateRequest;
  try {
    body = await request.json() as GenerateRequest;
  } catch {
    return Response.json({ error: "The generate request was not valid JSON." }, { status: 400 });
  }

  const topicRaw = body.topic?.trim() || "";
  const document = body.document?.trim() || "";
  const materials = Array.isArray(body.materials) ? body.materials.slice(0, 24) : [];
  const components = Array.isArray(body.components) && body.components.length
    ? body.components
    : ["text", "images", "stats", "quotes", "memes"];
  const scrapeWeb = body.scrapeWeb !== false;

  if (!topicRaw && !document) {
    return Response.json({ error: "A topic or document is required." }, { status: 400 });
  }
  if (!materials.length) {
    return Response.json({ error: "Select at least one researched material before generating." }, { status: 400 });
  }

  const docHeading = headingFromDocument(document);
  const topic = resolveStoryTopic({
    userTopic: topicRaw,
    inferredTopic: docHeading,
    document,
  });

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const hasManuscript = document.length > 200;
  const prompt = [
    scrapeWeb
      ? "Build a complete Sunday Data newsletter issue from the user's source materials AND the selected researched web materials."
      : "Convert the user's SOURCE MANUSCRIPT into a complete Sunday Data visual newsletter. Do NOT invent live web news. Stay inside the document.",
    "Compose it like thesundaydata.com archive issues (c6w3 / c6w6): long chapters with INTERLEAVED prose, memes, charts, argument callouts, and images — not an essay with visuals dumped at the end.",
    scrapeWeb ? "" : "MANUSCRIPT-ONLY MODE: no web scrape. Invent editorial memes, callouts, and charts from numbers/quotes already in the manuscript. Mark unresolved=true when a figure is illustrative rather than verified online.",
    `WORKING TITLE / TOPIC LABEL: ${topic}`,
    hasManuscript
      ? "STORY AUTHORITY: USER SOURCE MATERIALS are the manuscript. The working title is only a label. If the label is generic (e.g. \"sunday newsletter\") or conflicts with the manuscript, IGNORE the label and write the issue about the manuscript themes."
      : "",
    document ? `USER SOURCE MATERIALS (extracted notes, Google Docs, websites, PDFs, Word, Excel):\n${document.slice(0, 40_000)}` : "",
    `REQUESTED COMPONENTS: ${components.join(", ")}`,
    "SELECTED MATERIALS (JSON):",
    JSON.stringify(materials, null, 2),
    "",
    "Return ONLY JSON in this shape:",
    `{
  "title": { "en": "...", "ja": "..." },
  "dek": { "en": "1-2 sentence deck", "ja": "..." },
  "sectionsEn": [
    {
      "id": "opening",
      "eyebrow": "Opening",
      "title": "...",
      "subtitle": "optional",
      "quote": "optional pull quote",
      "paragraphs": ["fallback flat paragraphs if needed"],
      "blocks": [
        { "type": "prose", "paragraphs": ["..."] },
        { "type": "meme", "memeId": "meme-1" },
        { "type": "flourish", "flourishId": "unique-slug" },
        { "type": "callout", "kicker": "Core idea", "title": "...", "body": "...", "points": ["optional"] },
        { "type": "image", "src": "https://...", "title": "...", "credit": "...", "caption": "..." },
        { "type": "quote", "text": "...", "attribution": "..." },
        { "type": "prose", "paragraphs": ["..."] }
      ]
    }
  ],
  "sectionsJa": [ { "id": "opening", "eyebrow": "Opening", "title": "...", "paragraphs": ["..."], "blocks": [{ "type": "prose", "paragraphs": ["..."] }] } ],
  "flourishes": [
    {
      "id": "unique-slug",
      "sectionId": "opening",
      "signalLabel": "short label",
      "type": "story" | "viz" | "stat-cluster" | "trend" | "quote" | "table",
      "title": "...",
      "body": "optional",
      "chart": { "kind": "bar" | "line" | "column" | "donut" | "gauge" | "area", "unit": "%", "series": [{ "label": "A", "value": 1 }] },
      "stats": [{ "value": "12%", "label": "...", "source": "..." }],
      "trend": { "direction": "rising", "horizon": "6 months", "confidence": "medium", "basis": "..." },
      "quote": { "text": "...", "attribution": "...", "url": "https://..." },
      "table": { "columns": ["A"], "rows": [["B"]] },
      "caption": "...",
      "sources": [{ "title": "...", "url": "https://..." }],
      "unresolved": false
    }
  ],
  "memes": [
    {
      "id": "meme-1",
      "sectionId": "opening",
      "format": "impact" | "two-panel" | "drake" | "expanding-brain" | "caption-card" | "image",
      "title": "short meme title",
      "topText": "setup line grounded in THIS issue",
      "bottomText": "punchline grounded in THIS issue",
      "panels": ["optional panel 1", "optional panel 2"],
      "alt": "accessibility description",
      "credit": "Sunday Data editorial meme",
      "signalLabel": "theme tag",
      "src": ""
    }
  ],
  "reviewNotes": "short editor note"
}`,
    "",
    "Rules:",
    "- Write a rich issue: 4-6 English sections. Each section MUST include an ordered blocks array with 6-12 beats when text is combined with memes/stats/images/quotes.",
    "- Archive rhythm per chapter: open stakes (prose) → early meme or stat-cluster → deeper prose → viz/table → callout that restates the argument → closing prose. Spread flourishes; do not dump all visuals after the essay.",
    "- Every memeId / flourishId referenced in blocks must exist in memes[] / flourishes[].",
    "- Include at least one callout block per section (argument card like 'visible ritual vs invisible mechanism').",
    "- The newsletter body must be about the SOURCE MANUSCRIPT themes. The working title is not the story unless it clearly names those themes.",
    "- CRITICAL: Do not invent a different story. If the source manuscript is about tech cargo cults, Snapchat SPECS, AR glasses, style-as-moat, embodied AI, or Physical AI, the issue must stay on those themes — never pivot to a meta essay about \"Sunday newsletter\" or the publishing process.",
    "- Prefer turning the user's manuscript into polished sections before adding outside research.",
    scrapeWeb
      ? "- Prefer real numbers/quotes/URLs from selected materials. Mark unresolved=true when evidence is weak."
      : "- Do not cite live web URLs you did not receive. Prefer manuscript numbers/quotes. For charts built from thin numeric evidence, mark unresolved=true and label captions as illustrative.",
    "- Only include flourishes for requested components: text→story, images→image blocks, stats→stat-cluster/viz, quotes→quote, memes→memes array, charts→viz/table/trend.",
    components.includes("memes")
      ? "- MEMES ARE REQUIRED: return 2-4 original editorial memes with ids. Captions MUST reference concrete beats from THIS issue. Prefer manuscript/loot image URLs in src when available (format image). Otherwise use format + topText/bottomText (drake/two-panel/impact). Do not invent fake meme CDN URLs."
      : "- Do not include memes unless the memes component is requested.",
    "- If selected materials include type meme, turn those caption ideas into finished memes with sharper punchlines and reference them from blocks.",
    "- If selected materials include type image with imageUrl, place them as image blocks inside the relevant chapter (not only in a gallery).",
    "- DATA VISUALIZATION IS REQUIRED whenever stats, numbers, percents, rankings, or time series appear in the document or selected materials.",
    "- If stats are requested OR 3+ numeric facts exist, include at least 3 viz flourishes using different chart kinds (column, bar, line/area, donut, gauge) plus 1 stat-cluster and 1 trend.",
    "- Every viz must use real numbers from the materials/document. Caption must be a 1-2 sentence analysis of what the chart shows, not a restatement of the title.",
    scrapeWeb ? "" : "- Lean hard into visual storytelling: callouts, memes, stat rails, and interleaved blocks on every chapter so the manuscript feels like a Living field guide.",
    "- Do not use em dashes.",
    "- Make it feel like a moving field guide, not a static template essay.",
  ].filter(Boolean).join("\n");

  const openAIBody: Record<string, unknown> = {
    model,
    instructions: scrapeWeb
      ? "You are a newsletter editor. Stay faithful to the user's source manuscript. Output only valid JSON for a complete bilingual issue."
      : "You are a newsletter editor converting a manuscript into a visual Sunday Data issue. Do not browse or invent live web coverage. Output only valid JSON.",
    input: prompt,
  };
  if (scrapeWeb) {
    openAIBody.tools = [{ type: "web_search", search_context_size: "medium" }];
    openAIBody.include = ["web_search_call.action.sources"];
  }

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(openAIBody),
  });

  const response = await parseOpenAIJson(openAIResponse);
  if (!openAIResponse.ok) {
    const error = response.error && typeof response.error === "object"
      ? String((response.error as { message?: unknown }).message || "OpenAI could not complete generation.")
      : "OpenAI could not complete generation.";
    return Response.json({ error }, { status: openAIResponse.status });
  }

  const rawText = getOutputText(response);
  if (!rawText) {
    return Response.json({ error: "Generation completed without readable output." }, { status: 502 });
  }

  const parsed = parseJsonObject(rawText);
  if (!parsed) {
    // Fallback: try flourish-only parse for partial recovery
    const flourishParsed = parseFlourishPayload(rawText);
    if (!flourishParsed) {
      return Response.json({ error: "Could not parse newsletter JSON." }, { status: 502 });
    }
    return Response.json({
      issue: null,
      flourishes: flourishParsed.flourishes,
      research: flourishParsed.reviewNotes || rawText.slice(0, 1200),
      citations: [],
      model,
      generatedAt: new Date().toISOString(),
    });
  }

  const titleObj = (parsed.title && typeof parsed.title === "object") ? parsed.title as Record<string, unknown> : {};
  const dekObj = (parsed.dek && typeof parsed.dek === "object") ? parsed.dek as Record<string, unknown> : {};
  const sectionsEn = asSections(parsed.sectionsEn);
  const sectionsJa = asSections(parsed.sectionsJa);
  const flourishParsed = parseFlourishPayload(JSON.stringify({ flourishes: parsed.flourishes || [] }));
  const fallbackSectionId = sectionsEn[0]?.id || "opening";
  let memes: IssueMeme[] = Array.isArray(parsed.memes)
    ? parsed.memes
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item, index) => normalizeMeme(item, fallbackSectionId, topic || "topic", index))
      .filter((item): item is IssueMeme => !!item)
    : [];

  if (components.includes("memes")) {
    memes = synthesizeMemesFromMaterials({
      materials,
      sections: sectionsEn.length ? sectionsEn : [{ id: "opening", eyebrow: "Opening", title: topic || "Newsletter", paragraphs: ["."] }],
      topic,
      existing: memes,
    });
    // Manuscript / loot images that are meme-typed win first; then apply caption bases
    for (const material of materials) {
      if (material.type !== "meme" || !material.imageUrl) continue;
      if (memes.some((meme) => meme.src === material.imageUrl)) continue;
      memes.unshift({
        id: `manuscript-meme-${memes.length + 1}`,
        sectionId: sectionsEn[0]?.id || "opening",
        src: material.imageUrl,
        title: material.title,
        alt: material.text || material.title,
        credit: material.credit || material.source || "Manuscript meme",
        signalLabel: topic || "meme",
        format: "image",
        topText: material.text?.split("|")[0]?.trim(),
        bottomText: material.text?.split("|")[1]?.trim(),
      });
    }
    memes = applyMemeAssetPriority(memes);
  } else {
    memes = [];
  }

  const imageMaterials = components.includes("images")
    ? materials
      .filter((material) => material.type === "image" && material.imageUrl)
      .map((material, index) => ({
        src: material.imageUrl as string,
        title: material.title,
        credit: material.credit || material.source || "Research image",
        caption: material.text || undefined,
        sectionId: sectionsEn[Math.min(index + 1, Math.max(0, sectionsEn.length - 1))]?.id,
      }))
    : [];

  // Keep research images available as meme/figure assets for templates that still read memes[]
  if (components.includes("images")) {
    for (const material of imageMaterials) {
      if (memes.some((meme) => meme.src === material.src)) continue;
      memes.push({
        id: `image-${memes.length + 1}`,
        sectionId: material.sectionId || sectionsEn[0]?.id || "opening",
        src: material.src,
        title: material.title || "Figure",
        alt: material.title || "Figure",
        credit: material.credit || "Research image",
        signalLabel: topic || "image",
        format: "image",
      });
    }
  }

  const flourishes = synthesizeDataFlourishes({
    existing: flourishParsed?.flourishes || [],
    materials,
    document,
    sections: sectionsEn.length ? sectionsEn : [{ id: "opening", eyebrow: "Opening", title: topic || "Newsletter", paragraphs: ["."] }],
    components,
  });

  const baseSectionsEn: NewsletterSection[] = sectionsEn.length ? sectionsEn : [{
    id: "opening",
    eyebrow: "Opening",
    title: topic || "Newsletter",
    paragraphs: [document.slice(0, 1200) || "No sections were generated."],
  }];
  const baseSectionsJa: NewsletterSection[] = sectionsJa.length ? sectionsJa : baseSectionsEn;

  const sectionsEnWithBlocks = attachBlocksToSections({
    sections: baseSectionsEn,
    flourishes,
    memes,
    imageMaterials,
  });
  const sectionsJaWithBlocks = attachBlocksToSections({
    sections: baseSectionsJa,
    flourishes,
    memes,
    imageMaterials,
  });

  const issue: DynamicIssue = {
    title: {
      en: String(titleObj.en || topic || "Sunday Data"),
      ja: String(titleObj.ja || titleObj.en || topic || "Sunday Data"),
    },
    dek: {
      en: String(dekObj.en || "A researched issue built from your topic and selected web materials."),
      ja: String(dekObj.ja || dekObj.en || "A researched issue built from your topic and selected web materials."),
    },
    sectionsEn: sectionsEnWithBlocks,
    sectionsJa: sectionsJaWithBlocks,
    flourishes,
    memes,
  };

  return Response.json({
    issue,
    flourishes: issue.flourishes,
    research: typeof parsed.reviewNotes === "string" ? parsed.reviewNotes : "Dynamic newsletter generated from selected research.",
    citations: materials
      .filter((item) => item.url)
      .map((item) => ({ title: item.title, url: item.url as string }))
      .slice(0, 24),
    model,
    generatedAt: new Date().toISOString(),
  });
}
