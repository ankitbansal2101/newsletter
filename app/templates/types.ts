import type { Flourish } from "../lib/flourishes";

export type TemplateId = "classic" | "living";

/** Ordered reading beats inside a chapter — archive rhythm, not prose-then-dump. */
export type SectionBlock =
  | { type: "prose"; paragraphs: string[] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "meme"; memeId: string }
  | { type: "flourish"; flourishId: string }
  | { type: "image"; src: string; title?: string; credit?: string; caption?: string }
  | { type: "callout"; kicker: string; title: string; body: string; points?: string[] };

export type DraftSection = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  quote?: string;
  /** Flat paragraphs kept for JA drawer / legacy; prefer `blocks` when present. */
  paragraphs: string[];
  blocks?: SectionBlock[];
};

export type MemeFormat = "impact" | "two-panel" | "drake" | "expanding-brain" | "caption-card" | "image";

export type MemeAttachment = {
  id?: string;
  sectionId: string;
  /** Optional photo URL. Caption-only editorial memes leave this empty and use format + text. */
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

export type IssueCitation = { title: string; url: string };

export type PublishedIssue = {
  meta: {
    cycle: number;
    week: number;
    publishedAt: string;
    templateId?: TemplateId;
  };
  title: { en: string; ja: string };
  dek: { en: string; ja: string };
  sectionsEn: DraftSection[];
  sectionsJa: DraftSection[];
  stats: { records: number; sources: number; topics: number; ingredients: number };
  memes: MemeAttachment[];
  flourishes?: Flourish[];
  sourceDoc?: { url: string; importedAt: string; characters: number } | null;
  research: { text: string; citations: IssueCitation[] } | null;
};

export type NewsletterTemplateProps = {
  issue: PublishedIssue;
  mode: "studio" | "public";
  initialLanguage?: "EN" | "JA";
  initialSize?: "desktop" | "mobile";
};
