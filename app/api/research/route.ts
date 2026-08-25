import { headingFromDocument, isGenericTopicLabel, resolveStoryTopic } from "../../lib/topic";
import { parseJsonObject } from "../../lib/json";
import type { ResearchMaterial } from "../../lib/research";

export type { ResearchMaterial };

export const runtime = "nodejs";
export const maxDuration = 60;

type ResearchRequest = {
  topic?: string;
  document?: string;
};

const DEFAULT_MODEL = "gpt-5.6-terra";
const USER_AGENT = "SundayDataStudio/1.0 (newsletter research; localhost)";

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

function collectSourceUrls(response: Record<string, unknown>): string[] {
  const urls = new Set<string>();
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const action = (item as { action?: unknown }).action;
    if (action && typeof action === "object") {
      const sources = (action as { sources?: unknown }).sources;
      if (Array.isArray(sources)) {
        for (const source of sources) {
          if (!source || typeof source !== "object") continue;
          const url = (source as { url?: unknown }).url;
          if (typeof url === "string" && /^https?:\/\//i.test(url)) urls.add(url);
        }
      }
    }
    const content = (item as { content?: unknown }).content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (!part || typeof part !== "object") continue;
        const annotations = (part as { annotations?: unknown }).annotations;
        if (!Array.isArray(annotations)) continue;
        for (const annotation of annotations) {
          if (!annotation || typeof annotation !== "object") continue;
          const url = (annotation as { url?: unknown }).url;
          if (typeof url === "string" && /^https?:\/\//i.test(url)) urls.add(url);
        }
      }
    }
  }
  return [...urls];
}

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function absolutizeUrl(candidate: string, pageUrl: string): string | null {
  try {
    return new URL(candidate, pageUrl).toString();
  } catch {
    return null;
  }
}

function looksLikeAvatarOrCircularSource(url: string): boolean {
  return /music\.apple\.com|mzstatic\.com|is\d-ssl\.mzstatic|i\.scdn\.co|spotify\.com|fbcdn\.net|pbs\.twimg\.com\/profile|googleusercontent\.com\/a\//i.test(url);
}

function looksLikeImageUrl(url: string): boolean {
  return /\.(avif|bmp|gif|jpe?g|png|webp)(\?|#|$)/i.test(url)
    || /\/image|img|media|cdn|static|photo|upload|wp-content|resizer|dims/i.test(url);
}

async function fetchPageHeroImage(pageUrl: string): Promise<ResearchMaterial | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(pageUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) return null;
    const html = (await response.text()).slice(0, 250_000);
    const rawImage =
      extractMetaContent(html, "og:image")
      || extractMetaContent(html, "og:image:secure_url")
      || extractMetaContent(html, "twitter:image")
      || extractMetaContent(html, "twitter:image:src");
    if (!rawImage) return null;
    const imageUrl = absolutizeUrl(rawImage, pageUrl);
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return null;
    if (looksLikeAvatarOrCircularSource(imageUrl) || looksLikeAvatarOrCircularSource(pageUrl)) return null;

    const title =
      extractMetaContent(html, "og:title")
      || extractMetaContent(html, "twitter:title")
      || new URL(pageUrl).hostname;
    const site =
      extractMetaContent(html, "og:site_name")
      || new URL(pageUrl).hostname.replace(/^www\./, "");

    return {
      id: `image-web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "image",
      title: title.slice(0, 140),
      text: `Latest web image pulled from ${site}`,
      url: pageUrl,
      imageUrl,
      credit: site,
      source: site,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLatestWebImages(pageUrls: string[], topic: string): Promise<ResearchMaterial[]> {
  const uniquePages = [...new Set(pageUrls)]
    .filter((url) => /^https?:\/\//i.test(url))
    .filter((url) => !/wikipedia\.org|wikimedia\.org/i.test(url))
    .slice(0, 14);

  const settled = await Promise.all(uniquePages.map((url) => fetchPageHeroImage(url)));
  const images = settled.filter((item): item is ResearchMaterial => !!item);

  // Deduplicate by image URL
  const seen = new Set<string>();
  const deduped: ResearchMaterial[] = [];
  for (const image of images) {
    const key = image.imageUrl || "";
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      ...image,
      title: image.title || `${topic} image`,
      id: `image-web-${deduped.length + 1}`,
    });
  }
  return deduped.slice(0, 10);
}

function normalizeMaterials(raw: unknown): ResearchMaterial[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(["article", "quote", "stat", "image", "meme"]);
  const materials: ResearchMaterial[] = [];
  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const type = String(record.type || "");
    if (!allowed.has(type)) continue;
    const imageUrl = typeof record.imageUrl === "string" ? record.imageUrl.trim() : undefined;
    if (type === "image" && imageUrl && (!looksLikeImageUrl(imageUrl) || !/^https?:\/\//i.test(imageUrl))) continue;
    if (type === "image" && imageUrl && looksLikeAvatarOrCircularSource(imageUrl)) continue;
    materials.push({
      id: String(record.id || `${type}-${index + 1}`),
      type: type as ResearchMaterial["type"],
      title: String(record.title || "Untitled"),
      text: typeof record.text === "string" ? record.text : undefined,
      url: typeof record.url === "string" ? record.url : undefined,
      imageUrl: imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : undefined,
      credit: typeof record.credit === "string" ? record.credit : undefined,
      source: typeof record.source === "string" ? record.source : undefined,
    });
  }
  return materials.slice(0, 30);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Add OPENAI_API_KEY to .env.local" }, { status: 503 });
  }

  let body: ResearchRequest;
  try {
    body = await request.json() as ResearchRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const topicRaw = body.topic?.trim() || "";
  const document = body.document?.trim() || "";
  if (!topicRaw && !document) {
    return Response.json({ error: "Provide a topic or a document." }, { status: 400 });
  }

  const docHeading = headingFromDocument(document);
  const topic = resolveStoryTopic({
    userTopic: topicRaw,
    inferredTopic: docHeading,
    document,
  });

  const researchQuery = !isGenericTopicLabel(topic) ? topic : (docHeading || document.slice(0, 180));
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const hasSourceDoc = document.length > 200;

  const prompt = [
    "You are a newsletter research scout.",
    hasSourceDoc
      ? "The user provided SOURCE MATERIALS (a draft, Google Doc, notes, or attachments). Those materials DEFINE the story. Stay on that story and only fetch web evidence that supports, updates, or illustrates the same themes."
      : "Search the LIVE CURRENT web and return usable ingredients for a Sunday Data style newsletter.",
    `WORKING TITLE / TOPIC LABEL: ${topic}`,
    hasSourceDoc
      ? "STORY AUTHORITY: If the working title is generic (e.g. \"sunday newsletter\", \"newsletter\") or conflicts with the manuscript, IGNORE it. Research the manuscript themes only."
      : "",
    document ? `USER SOURCE MATERIALS (canonical — stay faithful):\n${document.slice(0, 40_000)}` : "",
    "",
    "Return ONLY JSON:",
    `{
  "summary": "2-3 sentence brief of the SOURCE story and what is happening around those same themes RIGHT NOW",
  "materials": [
    {
      "id": "article-1",
      "type": "article" | "quote" | "stat" | "image" | "meme",
      "title": "short label",
      "text": "excerpt, quote text, meme caption idea, or stat explanation",
      "url": "https://page-url",
      "imageUrl": "https://direct-image-cdn-url",
      "credit": "creator or publisher",
      "source": "publication name"
    }
  ]
}`,
    "",
    "Requirements:",
    hasSourceDoc
      ? "- CRITICAL: Do NOT switch topics. If the source is about cargo cults / AR glasses / style-as-moat / a named company, loot must stay on those themes."
      : "- Prefer sources from the last days/weeks.",
    "- Treat USER SOURCE MATERIALS as first-class evidence: quotes, stats, names, anecdotes, and figures from those files/pages must appear in the loot.",
    "- Pull 4-8 short excerpts directly from the source materials as type \"article\" or \"quote\" (url can be the source link if known).",
    "- Then add related LIVE web coverage ONLY for the same themes (recent news, stats, quotes, images).",
    "- Reject off-topic web finds even if they are trending.",
    "- Include 3-6 verified stats with numbers and sources when available for this theme.",
    "- Include 3-5 real quotes with attribution + url.",
    "- Include 2-4 meme concepts (type meme). Put the joke setup/punchline in text (use | to separate panels). Ground every concept in a concrete beat from the source story (names, products, arguments). Do not invent off-topic meme templates.",
    "- CRITICAL IMAGES: include 4-8 materials with type \"image\" that illustrate THIS story (e.g. product launches named in the source).",
    "- For every image, imageUrl MUST be a direct https link to a FULL rectangular news photograph or editorial image (jpg/png/webp).",
    "- Prefer wide/landscape press photos from news sites, company blogs, and wire services.",
    "- Do NOT use circular avatar art, Apple Music/Spotify artist discs, profile icons, or cropped round stickers.",
    "- Also set url to the article/page where that image appears.",
    "- Do NOT use Wikipedia/Wikimedia as the image source.",
    "- No fabricated URLs, numbers, or image links.",
  ].filter(Boolean).join("\n");

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: hasSourceDoc
        ? "Return only valid JSON. Stay strictly on the user's source themes. Use web search only to enrich that same story. Never invent a new topic from a Google Docs URL."
        : "Return only valid JSON. Use web search for the latest coverage. Prefer recent news imagery over stock/encyclopedia images. Never invent citations or image URLs.",
      input: prompt,
      tools: [{ type: "web_search", search_context_size: "high" }],
      include: ["web_search_call.action.sources"],
    }),
  });

  const response = await openAIResponse.json() as Record<string, unknown>;
  if (!openAIResponse.ok) {
    const error = response.error && typeof response.error === "object"
      ? String((response.error as { message?: unknown }).message || "Research failed.")
      : "Research failed.";
    return Response.json({ error }, { status: openAIResponse.status });
  }

  const rawText = getOutputText(response);
  const parsed = parseJsonObject(rawText) as { summary?: string; materials?: unknown } | null;
  const aiMaterials = normalizeMaterials(parsed?.materials);

  const pageUrls = [
    ...aiMaterials.map((item) => item.url).filter((url): url is string => !!url),
    ...collectSourceUrls(response),
  ];

  const webImages = await fetchLatestWebImages(pageUrls, researchQuery);
  const existingImageUrls = new Set(
    aiMaterials.map((item) => item.imageUrl).filter((url): url is string => !!url),
  );

  const freshImages = webImages.filter((item) => item.imageUrl && !existingImageUrls.has(item.imageUrl));

  // Source-grounded AI materials first; web images supplement, they do not lead the story.
  const materials = [...aiMaterials, ...freshImages].slice(0, 40);
  if (!materials.length) {
    return Response.json({ error: "No research materials found. Try a more specific topic." }, { status: 502 });
  }

  return Response.json({
    topic: topic || researchQuery,
    summary: typeof parsed?.summary === "string" ? parsed.summary : "",
    materials,
    imageStrategy: "latest-web-og-and-search",
    model,
    researchedAt: new Date().toISOString(),
  });
}
