"use client";

import type { ComponentType } from "react";

import NewsletterTemplate from "../NewsletterTemplate";
import InteractiveNewsletter from "./InteractiveNewsletter";
import type { NewsletterTemplateProps, TemplateId } from "./types";

export type { TemplateId, NewsletterTemplateProps, PublishedIssue, DraftSection, MemeAttachment, IssueCitation } from "./types";

export type TemplateDefinition = {
  id: TemplateId;
  name: string;
  tagline: string;
  mood: "print" | "interactive";
  Component: ComponentType<NewsletterTemplateProps>;
};

/** Add future templates here — Studio reads this list for the picker. */
export const NEWSLETTER_TEMPLATES: TemplateDefinition[] = [
  {
    id: "classic",
    name: "Print folio",
    tagline: "Quiet archival reading — feels like a designed PDF.",
    mood: "print",
    Component: NewsletterTemplate,
  },
  {
    id: "living",
    name: "Living field guide",
    tagline: "Cover open, scroll motion, pulse labs, full-bleed images.",
    mood: "interactive",
    Component: InteractiveNewsletter,
  },
];

export function getTemplate(id: TemplateId | string | undefined): TemplateDefinition {
  return NEWSLETTER_TEMPLATES.find((template) => template.id === id) || NEWSLETTER_TEMPLATES[0];
}
