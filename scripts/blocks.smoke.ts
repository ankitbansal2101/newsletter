/**
 * Smoke-test archive-style block synthesis (no OpenAI call).
 * Run: npx tsx app/lib/blocks.smoke.ts
 */
import {
  applyMemeAssetPriority,
  attachBlocksToSections,
  normalizeSectionBlocks,
  synthesizeSectionBlocks,
} from "../app/lib/blocks";
import type { Flourish } from "../app/lib/flourishes";
import type { DraftSection, MemeAttachment } from "../app/templates/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const section: DraftSection = {
  id: "ritual",
  eyebrow: "I · The Ritual",
  title: "The cargo is not the ritual",
  paragraphs: [
    "Snap debuted Specs at $2,195 and the market recoiled within two days.",
    "Memes arrived before the press releases. The look read as welding visor cosplay.",
    "Form over function. Ritual over rigor. Spectacles had already burned inventory once.",
    "Cargo cults copy the visible runway and miss the invisible logistics that moved the cargo.",
    "Style-as-moat is why Ray-Ban Meta found a path Specs missed.",
  ],
};

const flourishes: Flourish[] = [
  {
    id: "stats-specs",
    sectionId: "ritual",
    signalLabel: "Price shock",
    type: "stat-cluster",
    title: "AR wearability test",
    stats: [
      { value: "$2,195", label: "Specs price" },
      { value: "~17%", label: "Two-day slide" },
      { value: "$40M", label: "Spectacles charge" },
    ],
    sources: [],
  },
  {
    id: "viz-timing",
    sectionId: "ritual",
    signalLabel: "Timing gap",
    type: "viz",
    title: "Same idea, later win",
    chart: {
      kind: "bar",
      series: [
        { label: "Glass", value: 2013 },
        { label: "Meta Ray-Ban", value: 2023 },
      ],
    },
    caption: "Fashion-first timing beat feature-first launches.",
    sources: [],
  },
];

const memes: MemeAttachment[] = [
  {
    id: "meme-risitas",
    sectionId: "ritual",
    title: "Nobody asked for this",
    alt: "Laughing at $2k glasses",
    credit: "Editorial",
    signalLabel: "Specs",
    format: "impact",
    topText: "Fully self-contained AR glasses",
    bottomText: "Nobody asked for a welding visor at $2,195",
  },
  {
    id: "meme-drake",
    sectionId: "ritual",
    title: "Ritual vs cargo",
    alt: "Drake meme",
    credit: "Editorial",
    signalLabel: "Cargo cult",
    format: "drake",
    topText: "Copy the keynote turtleneck",
    bottomText: "Find the mechanism that creates adoption",
  },
];

const blocks = synthesizeSectionBlocks({
  section,
  flourishes,
  memes,
  sectionIndex: 0,
  totalSections: 4,
});

const types = blocks.map((b) => b.type);
assert(types.includes("prose"), "expected prose");
assert(types.includes("meme"), "expected meme interleaved");
assert(types.includes("flourish"), "expected flourish interleaved");
assert(types.includes("callout"), "expected argument callout");
assert(types.indexOf("meme") < types.lastIndexOf("prose") || types.indexOf("flourish") < types.lastIndexOf("prose"), "visuals should not only trail prose");

const prioritized = applyMemeAssetPriority(memes);
assert(prioritized[0].src?.includes("/memes/"), "impact/caption memes get local archive templates");
assert(prioritized[1].format === "drake" && !prioritized[1].src, "drake stays as built editorial format");

const withModelBlocks = {
  ...section,
  blocks: normalizeSectionBlocks([
    { type: "prose", paragraphs: ["A"] },
    { type: "meme", memeId: "meme-risitas" },
    { type: "callout", kicker: "Core", title: "Aspiration", body: "Adoption needs identity." },
    { type: "flourish", flourishId: "viz-timing" },
    { type: "prose", paragraphs: ["B"] },
  ]),
};
const kept = synthesizeSectionBlocks({
  section: withModelBlocks,
  flourishes,
  memes,
  sectionIndex: 1,
  totalSections: 4,
});
assert(kept.length >= 5, "model-provided blocks with 5+ beats are kept");

const attached = attachBlocksToSections({
  sections: [section, { id: "silo", eyebrow: "II", title: "The Silo", paragraphs: ["Founder gravity warps feedback.", "Insulation is the difference."] }],
  flourishes,
  memes: prioritized,
});
assert(attached.every((s) => (s.blocks?.length || 0) >= 3), "every section gets a block timeline");
assert(attached[0].blocks?.some((b) => b.type === "callout"), "opening section has callout");

console.log("blocks.smoke OK", {
  rhythm: types,
  memeAssets: prioritized.map((m) => ({ id: m.id, format: m.format, src: m.src || null })),
  sectionBlockCounts: attached.map((s) => s.blocks?.length),
});
