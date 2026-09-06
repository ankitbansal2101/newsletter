import type { DraftSection, PublishedIssue, SectionBlock } from "../templates/types";
import type { Flourish } from "./flourishes";

export type NarrationLanguage = "EN" | "JA";

export type NarrationCue = {
  id: string;
  sectionId?: string;
  label: string;
  text: string;
};

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function blocksForSection(section: DraftSection): SectionBlock[] {
  if (section.blocks?.length) return section.blocks;
  const blocks: SectionBlock[] = [];
  if (section.quote) blocks.push({ type: "quote", text: section.quote });
  if (section.paragraphs.length) blocks.push({ type: "prose", paragraphs: section.paragraphs });
  return blocks;
}

function textFromBlock(block: SectionBlock, flourishes: Flourish[]): string[] {
  if (block.type === "prose") return block.paragraphs.map(clean).filter(Boolean);
  if (block.type === "quote") {
    const attribution = block.attribution ? ` — ${block.attribution}` : "";
    return [clean(`"${block.text}"${attribution}`)].filter(Boolean);
  }
  if (block.type === "callout") {
    const points = (block.points || []).map((point) => clean(point)).filter(Boolean);
    return [clean(`${block.kicker}. ${block.title}. ${block.body}`), ...points].filter(Boolean);
  }
  if (block.type === "flourish") {
    const flourish = flourishes.find((item) => item.id === block.flourishId);
    if (!flourish) return [];
    const parts = [flourish.title, flourish.caption, flourish.quote?.text].filter(Boolean).map((part) => clean(String(part)));
    return parts;
  }
  if (block.type === "interactive") {
    return [clean(block.payload.prompt || block.payload.title || "")].filter(Boolean);
  }
  return [];
}

function sectionCues(
  section: DraftSection,
  language: NarrationLanguage,
  flourishes: Flourish[],
  index: number,
): NarrationCue[] {
  const cues: NarrationCue[] = [];
  const chapterLabel = language === "JA" ? `第${index + 1}章` : `Chapter ${index + 1}`;
  const heading = [section.eyebrow, section.title, section.subtitle]
    .filter((part): part is string => Boolean(part))
    .map(clean)
    .join(". ");
  if (heading) {
    cues.push({
      id: `${section.id}-heading`,
      sectionId: section.id,
      label: `${chapterLabel}: ${section.title || section.eyebrow}`,
      text: heading,
    });
  }

  const blocks = blocksForSection(section);
  blocks.forEach((block, blockIndex) => {
    textFromBlock(block, flourishes).forEach((text, partIndex) => {
      cues.push({
        id: `${section.id}-b${blockIndex}-p${partIndex}`,
        sectionId: section.id,
        label: section.title || section.eyebrow || chapterLabel,
        text,
      });
    });
  });

  return cues;
}

/** Build a spoken script for the current language edition. */
export function buildNarrationScript(issue: PublishedIssue, language: NarrationLanguage): NarrationCue[] {
  const title = language === "EN" ? issue.title.en : issue.title.ja;
  const dek = language === "EN" ? issue.dek.en : issue.dek.ja;
  const sections = language === "EN" ? issue.sectionsEn : issue.sectionsJa;
  const flourishes = issue.flourishes || [];
  const cues: NarrationCue[] = [];

  const introLabel = language === "JA" ? "導入" : "Opening";
  const introParts = [
    language === "JA" ? "サンデーデータ" : "Sunday Data",
    clean(title),
    clean(dek),
  ].filter(Boolean);

  if (introParts.length) {
    cues.push({
      id: "intro",
      label: introLabel,
      text: introParts.join(". "),
    });
  }

  sections.forEach((section, index) => {
    cues.push(...sectionCues(section, language, flourishes, index));
  });

  return cues.filter((cue) => cue.text.length > 0);
}

export function speechLocale(language: NarrationLanguage): string {
  return language === "JA" ? "ja-JP" : "en-US";
}

/** Prefer a matching system voice; fall back gracefully. */
export function pickNarrationVoice(voices: SpeechSynthesisVoice[], language: NarrationLanguage): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const locale = speechLocale(language);
  const prefix = language === "JA" ? "ja" : "en";

  const exact = voices.find((voice) => voice.lang === locale || voice.lang.replace("_", "-") === locale);
  if (exact) return exact;

  const byPrefix = voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix));
  if (byPrefix) return byPrefix;

  return voices[0] || null;
}
