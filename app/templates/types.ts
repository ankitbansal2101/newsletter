import type { Flourish } from "../lib/flourishes";
import type { InteractionHint, InteractivePayload } from "../lib/interaction";

export type { InteractionHint, InteractivePayload };
export type TemplateId = "classic" | "living";

/** Ordered reading beats inside a chapter — archive rhythm, not prose-then-dump. */
export type SectionBlock =
  | { type: "prose"; paragraphs: string[]; locked?: boolean }
  | { type: "quote"; text: string; attribution?: string; locked?: boolean }
  | { type: "meme"; memeId: string; locked?: boolean }
  | { type: "flourish"; flourishId: string; locked?: boolean }
  | { type: "image"; src: string; title?: string; credit?: string; caption?: string; locked?: boolean }
  | { type: "callout"; kicker: string; title: string; body: string; points?: string[]; locked?: boolean }
  | { type: "interactive"; id: string; payload: InteractivePayload; locked?: boolean };

export type DraftSection = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  quote?: string;
  /** Flat paragraphs kept for JA drawer / legacy; prefer `blocks` when present. */
  paragraphs: string[];
  blocks?: SectionBlock[];
  locked?: boolean;
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
  /** Studio editorial workbench callbacks */
  editorial?: EditorialHandlers;
  /** Chapter currently selected in the left rail — highlighted in the preview */
  focusedSectionId?: string | null;
};

export type EditorialHandlers = {
  onPatchSection?: (sectionId: string, patch: Partial<DraftSection>, language?: "EN" | "JA") => void;
  onPatchBlock?: (sectionId: string, blockIndex: number, block: SectionBlock, language?: "EN" | "JA") => void;
  onMoveBlock?: (sectionId: string, from: number, to: number, language?: "EN" | "JA") => void;
  onMoveSection?: (from: number, to: number, language?: "EN" | "JA") => void;
  onToggleSectionLock?: (sectionId: string, language?: "EN" | "JA") => void;
  onReviseBlock?: (sectionId: string, blockIndex: number, commentary: string, language?: "EN" | "JA") => Promise<void>;
  onPatchFlourish?: (flourish: Flourish) => void;
  onReviseFlourish?: (flourishId: string, commentary: string) => Promise<void>;
  revisingKey?: string | null;
};
