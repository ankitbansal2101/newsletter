"use client";

import FlourishCard from "./FlourishCard";
import InteractivePlayer from "./InteractivePlayers";
import MemeCard from "./MemeCard";
import type { Flourish } from "../lib/flourishes";
import type { DraftSection, MemeAttachment, SectionBlock } from "../templates/types";

type Variant = "classic" | "living";

type Props = {
  section: DraftSection;
  flourishes: Flourish[];
  memes: MemeAttachment[];
  mode: "studio" | "public";
  variant?: Variant;
  /** Skip these meme ids (e.g. already shown as Living hero). */
  skipMemeIds?: string[];
  dropcapFirst?: boolean;
};

function proseFromSection(section: DraftSection): string[] {
  if (section.paragraphs.length) return section.paragraphs;
  return (section.blocks || [])
    .filter((block): block is Extract<SectionBlock, { type: "prose" }> => block.type === "prose")
    .flatMap((block) => block.paragraphs);
}

/** Build a legacy flat layout when the section has no ordered blocks. */
export function fallbackBlocksForSection(
  section: DraftSection,
  flourishes: Flourish[],
  memes: MemeAttachment[],
): SectionBlock[] {
  if (section.blocks?.length) return section.blocks;

  const blocks: SectionBlock[] = [];
  if (section.quote) {
    blocks.push({ type: "quote", text: section.quote });
  }
  const paragraphs = proseFromSection(section);
  if (paragraphs.length) {
    const mid = Math.max(1, Math.ceil(paragraphs.length / 2));
    blocks.push({ type: "prose", paragraphs: paragraphs.slice(0, mid) });
    const sectionMemes = memes.filter((m) => m.sectionId === section.id && m.format !== "image");
    const sectionImages = memes.filter((m) => m.sectionId === section.id && m.format === "image" && m.src);
    const sectionFlourishes = flourishes.filter((f) => f.sectionId === section.id);
    if (sectionMemes[0]?.id) blocks.push({ type: "meme", memeId: sectionMemes[0].id });
    const stats = sectionFlourishes.find((f) => f.type === "stat-cluster");
    if (stats) blocks.push({ type: "flourish", flourishId: stats.id });
    if (paragraphs.length > mid) {
      blocks.push({ type: "prose", paragraphs: paragraphs.slice(mid) });
    }
    for (const flourish of sectionFlourishes.filter((f) => f.id !== stats?.id)) {
      blocks.push({ type: "flourish", flourishId: flourish.id });
    }
    for (const meme of sectionMemes.slice(1)) {
      if (meme.id) blocks.push({ type: "meme", memeId: meme.id });
    }
    for (const image of sectionImages) {
      if (image.src) {
        blocks.push({
          type: "image",
          src: image.src,
          title: image.title,
          credit: image.credit,
          caption: image.bottomText || image.alt,
        });
      }
    }
  }
  return blocks;
}

export default function SectionBlocks({
  section,
  flourishes,
  memes,
  mode,
  variant = "classic",
  skipMemeIds = [],
  dropcapFirst = false,
}: Props) {
  const blocks = fallbackBlocksForSection(section, flourishes, memes);
  const flourishById = new Map(flourishes.map((f) => [f.id, f]));
  const memeById = new Map(memes.filter((m) => m.id).map((m) => [m.id as string, m]));
  const skip = new Set(skipMemeIds);
  let proseSeen = 0;

  return (
    <div className={`section-blocks section-blocks-${variant} ${section.locked ? "is-section-locked" : ""}`}>
      {blocks.map((block, index) => {
        const key = `${section.id}-block-${index}-${block.type}`;

        if (block.type === "prose") {
          const start = proseSeen;
          proseSeen += block.paragraphs.length;
          return (
            <div className="block-prose" key={key} data-reveal={variant === "living" ? true : undefined}>
              {block.paragraphs.map((paragraph, pIndex) => (
                <p
                  className={dropcapFirst && start === 0 && pIndex === 0 ? "dropcap" : ""}
                  key={`${key}-p-${pIndex}`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote className={variant === "living" ? "living-quote" : "human-quote"} key={key} data-reveal={variant === "living" ? true : undefined}>
              {block.text}
              {block.attribution && <cite>{block.attribution}</cite>}
            </blockquote>
          );
        }

        if (block.type === "callout") {
          return (
            <aside className="block-callout" key={key} data-reveal={variant === "living" ? true : undefined}>
              <p className="block-callout-kicker">{block.kicker}</p>
              <h3>{block.title}</h3>
              <p>{block.body}</p>
              {!!block.points?.length && (
                <ol>
                  {block.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ol>
              )}
            </aside>
          );
        }

        if (block.type === "image") {
          return (
            <figure className="block-image" key={key} data-reveal={variant === "living" ? true : undefined}>
              <img src={block.src} alt={block.title || block.caption || "Issue figure"} />
              <figcaption>
                {block.title && <strong>{block.title}</strong>}
                {block.caption && <span>{block.caption}</span>}
                {block.credit && <em>{block.credit}</em>}
              </figcaption>
            </figure>
          );
        }

        if (block.type === "meme") {
          if (skip.has(block.memeId)) return null;
          const meme = memeById.get(block.memeId);
          if (!meme) return null;
          return (
            <div className="block-meme" key={key} data-reveal={variant === "living" ? true : undefined}>
              <MemeCard meme={meme} variant={variant === "living" ? "living" : "classic"} mode={mode} />
            </div>
          );
        }

        if (block.type === "flourish") {
          const flourish = flourishById.get(block.flourishId);
          if (!flourish) return null;
          if (flourish.type === "stat-cluster" && flourish.stats?.length && variant === "living") {
            return (
              <div className="living-stat-rail block-flourish" key={key} data-reveal>
                {flourish.stats.slice(0, 4).map((stat) => (
                  <div key={`${stat.label}-${stat.value}`}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                    {stat.source && <small>{stat.source}</small>}
                  </div>
                ))}
              </div>
            );
          }
          return (
            <div className={`block-flourish ${variant === "living" ? "living-lab-card" : ""}`} key={key} data-reveal={variant === "living" ? true : undefined}>
              <FlourishCard flourish={flourish} mode={mode} />
            </div>
          );
        }

        if (block.type === "interactive") {
          return (
            <div className="block-interactive" key={key} data-reveal={variant === "living" ? true : undefined}>
              <InteractivePlayer payload={block.payload} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
