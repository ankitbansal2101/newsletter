import type { Flourish } from "./flourishes";
import { buildInteractiveFromFlourish, detectInteractionHint } from "./interaction";
import type { DraftSection, MemeAttachment, SectionBlock } from "../templates/types";

const LOCAL_MEME_BASES = [
  {
    id: "risitas",
    src: "/memes/meme_risitas.png",
    title: "El Risitas",
    credit: "El Risitas — Canal Sur TV (2007)",
  },
  {
    id: "clown",
    src: "/memes/meme_clown.png",
    title: "Clown Applying Makeup",
    credit: "Clown Applying Makeup — Know Your Meme",
  },
  {
    id: "boardroom",
    src: "/memes/meme_boardroom.png",
    title: "Boardroom Meeting Suggestion",
    credit: "Boardroom Meeting Suggestion — Hejibits (2013)",
  },
] as const;

export function paragraphsFromBlocks(blocks: SectionBlock[] | undefined, fallback: string[]): string[] {
  if (!blocks?.length) return fallback;
  const fromProse = blocks
    .filter((block): block is Extract<SectionBlock, { type: "prose" }> => block.type === "prose")
    .flatMap((block) => block.paragraphs.filter(Boolean));
  return fromProse.length ? fromProse : fallback;
}

export function normalizeSectionBlocks(raw: unknown): SectionBlock[] {
  if (!Array.isArray(raw)) return [];
  const blocks: SectionBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const block = item as Record<string, unknown>;
    const type = String(block.type || "");
    if (type === "prose") {
      const paragraphs = Array.isArray(block.paragraphs)
        ? block.paragraphs.map((p) => String(p).trim()).filter(Boolean)
        : [];
      if (paragraphs.length) blocks.push({ type: "prose", paragraphs });
      continue;
    }
    if (type === "quote") {
      const text = String(block.text || "").trim();
      if (!text) continue;
      blocks.push({
        type: "quote",
        text,
        attribution: typeof block.attribution === "string" ? block.attribution : undefined,
      });
      continue;
    }
    if (type === "meme") {
      const memeId = String(block.memeId || "").trim();
      if (memeId) blocks.push({ type: "meme", memeId });
      continue;
    }
    if (type === "flourish") {
      const flourishId = String(block.flourishId || "").trim();
      if (flourishId) blocks.push({ type: "flourish", flourishId });
      continue;
    }
    if (type === "image") {
      const src = String(block.src || "").trim();
      if (!src) continue;
      blocks.push({
        type: "image",
        src,
        title: typeof block.title === "string" ? block.title : undefined,
        credit: typeof block.credit === "string" ? block.credit : undefined,
        caption: typeof block.caption === "string" ? block.caption : undefined,
      });
      continue;
    }
    if (type === "callout") {
      const title = String(block.title || "").trim();
      const body = String(block.body || "").trim();
      if (!title && !body) continue;
      blocks.push({
        type: "callout",
        kicker: String(block.kicker || "Core idea"),
        title: title || "Argument card",
        body: body || title,
        points: Array.isArray(block.points)
          ? block.points.map((point) => String(point).trim()).filter(Boolean).slice(0, 6)
          : undefined,
      });
      continue;
    }
    if (type === "interactive") {
      const payload = block.payload;
      if (!payload || typeof payload !== "object") continue;
      const kind = String((payload as { kind?: unknown }).kind || "");
      if (!["timeline", "network", "conditional", "garden"].includes(kind)) continue;
      blocks.push({
        type: "interactive",
        id: String(block.id || `interactive-${blocks.length + 1}`),
        payload: payload as import("../templates/types").InteractivePayload,
        locked: block.locked === true,
      });
    }
  }
  return blocks;
}

/** Archive-style reading order when the model only returned flat paragraphs. */
export function synthesizeSectionBlocks(args: {
  section: DraftSection;
  flourishes: Flourish[];
  memes: MemeAttachment[];
  images?: Array<{ src: string; title?: string; credit?: string; caption?: string }>;
  sectionIndex: number;
  totalSections: number;
}): SectionBlock[] {
  const { section, flourishes, memes, images = [], sectionIndex } = args;
  if (section.blocks && section.blocks.length >= 3) return section.blocks;

  const paragraphs = section.paragraphs.filter(Boolean);
  const sectionFlourishes = flourishes.filter((f) => f.sectionId === section.id);
  const sectionMemes = memes.filter((m) => m.sectionId === section.id && m.format !== "image");
  const stats = sectionFlourishes.find((f) => f.type === "stat-cluster");
  const viz = sectionFlourishes.filter((f) => f.type === "viz" || f.type === "table" || f.type === "trend");
  const quotes = sectionFlourishes.filter((f) => f.type === "quote");
  const other = sectionFlourishes.filter(
    (f) => f.id !== stats?.id && !viz.includes(f) && !quotes.includes(f),
  );

  const blocks: SectionBlock[] = [];
  if (section.quote) blocks.push({ type: "quote", text: section.quote });

  if (!paragraphs.length) {
    for (const meme of sectionMemes) if (meme.id) blocks.push({ type: "meme", memeId: meme.id });
    for (const flourish of sectionFlourishes) blocks.push({ type: "flourish", flourishId: flourish.id });
    for (const image of images) blocks.push({ type: "image", ...image });
    return blocks;
  }

  const chunkSize = Math.max(1, Math.ceil(paragraphs.length / 3));
  const chunks: string[][] = [];
  for (let i = 0; i < paragraphs.length; i += chunkSize) {
    chunks.push(paragraphs.slice(i, i + chunkSize));
  }

  // Rhythm: prose → early meme/stats → prose → viz/callout → prose → remaining
  if (chunks[0]) blocks.push({ type: "prose", paragraphs: chunks[0] });

  if (sectionMemes[0]?.id) blocks.push({ type: "meme", memeId: sectionMemes[0].id });
  else if (stats) blocks.push({ type: "flourish", flourishId: stats.id });

  if (chunks[1]) blocks.push({ type: "prose", paragraphs: chunks[1] });

  if (viz[0]) blocks.push({ type: "flourish", flourishId: viz[0].id });
  if (quotes[0]) blocks.push({ type: "flourish", flourishId: quotes[0].id });

  blocks.push({
    type: "callout",
    kicker: sectionIndex === 0 ? "Opening claim" : "Core idea",
    title: section.title.slice(0, 72),
    body: paragraphs[paragraphs.length - 1]?.slice(0, 220) || section.subtitle || section.title,
    points: sectionIndex === args.totalSections - 1
      ? ["What behavior must change?", "What timing signal says the market is ready?"]
      : undefined,
  });

  if (chunks[2]) blocks.push({ type: "prose", paragraphs: chunks[2] });
  for (const chunk of chunks.slice(3)) blocks.push({ type: "prose", paragraphs: chunk });

  if (stats && !blocks.some((b) => b.type === "flourish" && b.flourishId === stats.id)) {
    blocks.push({ type: "flourish", flourishId: stats.id });
  }
  for (const flourish of [...viz.slice(1), ...other, ...quotes.slice(1)]) {
    if (!blocks.some((b) => b.type === "flourish" && b.flourishId === flourish.id)) {
      blocks.push({ type: "flourish", flourishId: flourish.id });
    }
  }
  for (const meme of sectionMemes.slice(1)) {
    if (meme.id && !blocks.some((b) => b.type === "meme" && b.memeId === meme.id)) {
      blocks.push({ type: "meme", memeId: meme.id });
    }
  }
  for (const image of images) {
    if (!blocks.some((b) => b.type === "image" && b.src === image.src)) {
      blocks.push({ type: "image", ...image });
    }
  }

  return blocks;
}

/** Prefer manuscript/loot images; else editorial text memes; else local templates as caption bases. */
export function applyMemeAssetPriority(memes: MemeAttachment[]): MemeAttachment[] {
  let baseIndex = 0;
  return memes.map((meme) => {
    if (meme.src) return { ...meme, format: meme.format || "image" };
    if (meme.format === "image") return meme;
    // Keep intentional built formats (drake / two-panel / etc.) as rendered cards
    if (meme.format && meme.format !== "caption-card" && meme.format !== "impact") {
      return meme;
    }
    // Caption-card / impact / unspecified → stamp onto classic archive templates
    const base = LOCAL_MEME_BASES[baseIndex % LOCAL_MEME_BASES.length];
    baseIndex += 1;
    return {
      ...meme,
      src: base.src,
      format: "image",
      credit: meme.credit || base.credit,
      title: meme.title || base.title,
      alt: meme.alt || `${base.title}: ${meme.topText || ""} ${meme.bottomText || ""}`.trim(),
    };
  });
}

export function attachBlocksToSections(args: {
  sections: DraftSection[];
  flourishes: Flourish[];
  memes: MemeAttachment[];
  imageMaterials?: Array<{ src: string; title?: string; credit?: string; caption?: string; sectionId?: string }>;
}): DraftSection[] {
  const { sections, flourishes, memes, imageMaterials = [] } = args;
  return sections.map((section, index) => {
    const images = imageMaterials
      .filter((image) => !image.sectionId || image.sectionId === section.id)
      .filter((_, imageIndex) => {
        // Spread images across sections when no sectionId
        if (imageMaterials.every((item) => !item.sectionId)) {
          return imageIndex % Math.max(sections.length, 1) === index;
        }
        return true;
      })
      .map(({ src, title, credit, caption }) => ({ src, title, credit, caption }));

    const blocks = synthesizeSectionBlocks({
      section,
      flourishes,
      memes,
      images,
      sectionIndex: index,
      totalSections: sections.length,
    });

    const interactiveBlocks: Extract<SectionBlock, { type: "interactive" }>[] = [];
    const usedHints = new Set<string>();
    for (const flourish of flourishes.filter((item) => item.sectionId === section.id)) {
      const text = [flourish.title, flourish.body, flourish.caption, flourish.signalLabel].filter(Boolean).join("\n");
      const hint = flourish.interactionHint || detectInteractionHint(text);
      if (!hint || usedHints.has(hint)) continue;
      const payload = buildInteractiveFromFlourish({ ...flourish, interactionHint: hint });
      if (!payload) continue;
      usedHints.add(hint);
      interactiveBlocks.push({
        type: "interactive",
        id: `play-${flourish.id}`,
        payload: hint === "garden" ? { ...payload, kind: "garden" } : payload,
      });
    }

    const mergedBlocks = [...blocks];
    for (const play of interactiveBlocks) {
      const already = mergedBlocks.some((block) => block.type === "interactive" && block.id === play.id);
      if (!already) {
        const insertAt = Math.min(mergedBlocks.length, Math.max(2, Math.floor(mergedBlocks.length * 0.6)));
        mergedBlocks.splice(insertAt, 0, play);
      }
    }

    return {
      ...section,
      blocks: mergedBlocks,
      paragraphs: paragraphsFromBlocks(mergedBlocks, section.paragraphs),
    };
  });
}
