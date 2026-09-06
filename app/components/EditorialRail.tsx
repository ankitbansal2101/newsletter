"use client";

import { useState } from "react";

import type { Flourish } from "../lib/flourishes";
import type { DraftSection, EditorialHandlers, PublishedIssue, SectionBlock } from "../templates/types";
import { fallbackBlocksForSection } from "./SectionBlocks";

type Props = {
  issue: PublishedIssue;
  editorial: EditorialHandlers;
  language?: "EN" | "JA";
  focusedSectionId?: string | null;
  onFocusSection?: (sectionId: string | null) => void;
};

function blockLabel(block: SectionBlock): string {
  switch (block.type) {
    case "prose":
      return "Story text";
    case "quote":
      return "Quote";
    case "callout":
      return "Callout";
    case "flourish":
      return "Chart / viz";
    case "meme":
      return "Meme";
    case "image":
      return "Image";
    case "interactive":
      return "Mini game";
    default:
      return "Beat";
  }
}

function blockPreview(block: SectionBlock): string {
  if (block.type === "prose") return block.paragraphs[0]?.slice(0, 90) || "Empty prose";
  if (block.type === "quote") return block.text.slice(0, 90);
  if (block.type === "callout") return block.title;
  if (block.type === "flourish") return block.flourishId;
  if (block.type === "meme") return block.memeId;
  if (block.type === "image") return block.title || block.caption || "Image";
  if (block.type === "interactive") return block.payload.title;
  return "";
}

function scrollNewsletterToSection(sectionId: string) {
  const target = document.querySelector<HTMLElement>(`[data-section-id="${CSS.escape(sectionId)}"]`);
  if (!target) return;
  const stage = target.closest(".reader-stage") as HTMLElement | null;
  if (stage) {
    const top = target.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 20;
    stage.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function editableText(block: SectionBlock): string | null {
  if (block.type === "prose") return block.paragraphs.join("\n\n");
  if (block.type === "quote") return block.text;
  if (block.type === "callout") return [block.kicker, block.title, block.body, ...(block.points || [])].join("\n");
  return null;
}

export default function EditorialRail({
  issue,
  editorial,
  language = "EN",
  focusedSectionId = null,
  onFocusSection,
}: Props) {
  const sections = language === "EN" ? issue.sectionsEn : issue.sectionsJa;
  const flourishes = issue.flourishes || [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<"copy" | "ai">("copy");
  const [draftText, setDraftText] = useState("");
  const [commentary, setCommentary] = useState("");
  const [flourishDraft, setFlourishDraft] = useState<{
    id: string;
    title: string;
    caption: string;
    kind: NonNullable<Flourish["chart"]>["kind"];
    seriesText: string;
    commentary: string;
  } | null>(null);

  function selectSection(sectionId: string, expand: boolean) {
    onFocusSection?.(sectionId);
    if (expand) {
      setExpandedId((current) => (current === sectionId ? null : sectionId));
    }
    setEditingBlock(null);
    setEditMode("copy");
    setFlourishDraft(null);
    setCommentary("");
    requestAnimationFrame(() => scrollNewsletterToSection(sectionId));
  }

  function openEdit(index: number, block: SectionBlock, mode: "copy" | "ai" = "copy") {
    const text = editableText(block);
    if (text === null) return;
    setEditingBlock(index);
    setEditMode(mode);
    setDraftText(text);
    setCommentary("");
    setFlourishDraft(null);
  }

  function saveEdit(section: DraftSection, index: number, block: SectionBlock) {
    if (block.type === "prose") {
      editorial.onPatchBlock?.(section.id, index, {
        ...block,
        paragraphs: draftText.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean),
      }, language);
    } else if (block.type === "quote") {
      editorial.onPatchBlock?.(section.id, index, { ...block, text: draftText.trim() }, language);
    } else if (block.type === "callout") {
      const [kicker, title, body, ...points] = draftText.split("\n").map((line) => line.trim());
      editorial.onPatchBlock?.(section.id, index, {
        ...block,
        kicker: kicker || block.kicker,
        title: title || block.title,
        body: body || block.body,
        points: points.filter(Boolean),
      }, language);
    }
    setEditingBlock(null);
  }

  function openFlourish(flourish: Flourish) {
    setEditingBlock(null);
    setFlourishDraft({
      id: flourish.id,
      title: flourish.title,
      caption: flourish.caption || "",
      kind: flourish.chart?.kind || "column",
      seriesText: (flourish.chart?.series || []).map((point) => `${point.label},${point.value}`).join("\n"),
      commentary: "",
    });
  }

  function saveFlourish() {
    if (!flourishDraft) return;
    const current = flourishes.find((item) => item.id === flourishDraft.id);
    if (!current) return;
    const series = flourishDraft.seriesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, valueRaw] = line.split(",").map((part) => part.trim());
        return { label: label || "item", value: Number(valueRaw) || 0 };
      });
    editorial.onPatchFlourish?.({
      ...current,
      title: flourishDraft.title.trim() || current.title,
      caption: flourishDraft.caption.trim() || undefined,
      unresolved: false,
      chart: current.chart
        ? { ...current.chart, kind: flourishDraft.kind, series: series.length ? series : current.chart.series }
        : current.chart,
    });
    setFlourishDraft(null);
  }

  return (
    <aside className="editorial-rail" aria-label="Issue editor">
      <header className="editorial-rail-head">
        <p>Issue outline</p>
        <strong>Tap ✎ on a chapter to edit it here</strong>
      </header>

      <div className="editorial-section-list">
        {sections.map((section, index) => {
          const expanded = expandedId === section.id;
          const blocks = expanded ? fallbackBlocksForSection(section, flourishes, issue.memes) : [];
          const sectionFlourishes = expanded
            ? flourishes.filter((item) => item.sectionId === section.id)
            : [];

          return (
            <div
              key={section.id}
              className={`editorial-tile ${focusedSectionId === section.id ? "is-focused" : ""} ${expanded ? "is-active is-expanded" : ""} ${section.locked ? "is-locked" : ""}`}
            >
              <button
                type="button"
                className="editorial-tile-main"
                onClick={() => selectSection(section.id, false)}
              >
                <span className="editorial-tile-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="editorial-tile-copy">
                  <em>{section.eyebrow || "Chapter"}</em>
                  <strong>{section.title}</strong>
                  <small>
                    {(section.blocks || []).length || section.paragraphs.length} beats
                    {section.locked ? " · locked" : ""}
                    {expanded ? " · editing" : ""}
                  </small>
                </span>
              </button>

              <div className="editorial-tile-actions">
                <button type="button" title="Move up" disabled={section.locked || index === 0} onClick={() => editorial.onMoveSection?.(index, index - 1, language)}>↑</button>
                <button type="button" title="Move down" disabled={section.locked || index >= sections.length - 1} onClick={() => editorial.onMoveSection?.(index, index + 1, language)}>↓</button>
                <button
                  type="button"
                  title={section.locked ? "Unlock" : "Lock"}
                  className={section.locked ? "is-lock" : ""}
                  onClick={() => editorial.onToggleSectionLock?.(section.id, language)}
                >
                  {section.locked ? "Locked" : "Lock"}
                </button>
                <button
                  type="button"
                  className={`editorial-pencil ${expanded ? "is-open" : ""}`}
                  title={expanded ? "Close editor" : "Edit chapter"}
                  aria-expanded={expanded}
                  onClick={() => selectSection(section.id, true)}
                >
                  {expanded ? "×" : "✎"}
                </button>
              </div>

              {expanded && (
                <div className="editorial-tile-panel">
                  {section.locked ? (
                    <p className="editorial-help">Unlock this chapter to edit or rearrange beats.</p>
                  ) : (
                    <p className="editorial-help">✎ edits copy. <b>AI</b> regenerates that beat with your note.</p>
                  )}

                  <ul className="editorial-beat-list">
                    {blocks.map((block, blockIndex) => {
                      const revising = editorial.revisingKey === `${section.id}:${blockIndex}`;
                      const isEditing = editingBlock === blockIndex;
                      const canEditCopy = editableText(block) !== null;
                      return (
                        <li key={`${section.id}-beat-${blockIndex}`} className={isEditing ? "is-open" : ""}>
                          <div className="editorial-beat-row">
                            <div>
                              <em>{blockLabel(block)}</em>
                              <span>{blockPreview(block)}</span>
                            </div>
                            <div className="editorial-beat-actions">
                              <button type="button" disabled={section.locked || blockIndex === 0} onClick={() => editorial.onMoveBlock?.(section.id, blockIndex, blockIndex - 1, language)}>↑</button>
                              <button type="button" disabled={section.locked || blockIndex >= blocks.length - 1} onClick={() => editorial.onMoveBlock?.(section.id, blockIndex, blockIndex + 1, language)}>↓</button>
                              {canEditCopy && (
                                <button
                                  type="button"
                                  className={`editorial-pencil ${isEditing && editMode === "copy" ? "is-open" : ""}`}
                                  disabled={section.locked}
                                  title="Edit copy"
                                  onClick={() => (isEditing && editMode === "copy" ? setEditingBlock(null) : openEdit(blockIndex, block, "copy"))}
                                >
                                  {isEditing && editMode === "copy" ? "×" : "✎"}
                                </button>
                              )}
                              {canEditCopy && (
                                <button
                                  type="button"
                                  className={`editorial-ai ${isEditing && editMode === "ai" ? "is-open" : ""}`}
                                  disabled={section.locked}
                                  title="Regenerate with AI"
                                  onClick={() => (isEditing && editMode === "ai" ? setEditingBlock(null) : openEdit(blockIndex, block, "ai"))}
                                >
                                  AI
                                </button>
                              )}
                              {block.type === "flourish" && (
                                <button
                                  type="button"
                                  disabled={section.locked}
                                  onClick={() => {
                                    const flourish = flourishes.find((item) => item.id === block.flourishId);
                                    if (flourish) openFlourish(flourish);
                                  }}
                                >
                                  Viz
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditing && editMode === "copy" && (
                            <div className="editorial-edit-panel">
                              <label>
                                <span>Copy</span>
                                <textarea rows={6} value={draftText} onChange={(event) => setDraftText(event.target.value)} />
                              </label>
                              <div className="editorial-edit-actions">
                                <button type="button" className="quest-cta" onClick={() => saveEdit(section, blockIndex, block)}>Save</button>
                                <button type="button" className="quiet-button" onClick={() => setEditingBlock(null)}>Cancel</button>
                              </div>
                            </div>
                          )}

                          {isEditing && editMode === "ai" && (
                            <div className="editorial-edit-panel">
                              <label>
                                <span>AI regeneration note</span>
                                <textarea
                                  rows={3}
                                  autoFocus
                                  placeholder="e.g. Make this sharper and keep the Snap Specs angle"
                                  value={commentary}
                                  onChange={(event) => setCommentary(event.target.value)}
                                />
                              </label>
                              <button
                                type="button"
                                className="quest-cta"
                                disabled={revising || !commentary.trim() || section.locked}
                                onClick={async () => {
                                  await editorial.onReviseBlock?.(section.id, blockIndex, commentary.trim(), language);
                                  setCommentary("");
                                  setEditingBlock(null);
                                }}
                              >
                                {revising ? "Regenerating…" : "Regenerate with AI"}
                              </button>
                              <button type="button" className="quiet-button" onClick={() => setEditingBlock(null)}>Cancel</button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {!!sectionFlourishes.length && (
                    <div className="editorial-viz-list">
                      <p>Visualizations</p>
                      {sectionFlourishes.map((flourish) => (
                        <button key={flourish.id} type="button" disabled={section.locked} onClick={() => openFlourish(flourish)}>
                          <em>{flourish.type}</em>
                          <strong>{flourish.title}</strong>
                        </button>
                      ))}
                    </div>
                  )}

                  {flourishDraft && (
                    <div className="editorial-edit-panel flourish-panel">
                      <header>
                        <strong>Rework visualization</strong>
                        <button type="button" className="quiet-button" onClick={() => setFlourishDraft(null)}>Close</button>
                      </header>
                      <label>
                        <span>Title</span>
                        <input value={flourishDraft.title} onChange={(event) => setFlourishDraft({ ...flourishDraft, title: event.target.value })} />
                      </label>
                      <label>
                        <span>Caption</span>
                        <textarea rows={2} value={flourishDraft.caption} onChange={(event) => setFlourishDraft({ ...flourishDraft, caption: event.target.value })} />
                      </label>
                      <label>
                        <span>Chart kind</span>
                        <select
                          value={flourishDraft.kind}
                          onChange={(event) => setFlourishDraft({ ...flourishDraft, kind: event.target.value as NonNullable<Flourish["chart"]>["kind"] })}
                        >
                          {["bar", "line", "column", "donut", "gauge", "area"].map((kind) => (
                            <option key={kind} value={kind}>{kind}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Series (label,value)</span>
                        <textarea rows={4} value={flourishDraft.seriesText} onChange={(event) => setFlourishDraft({ ...flourishDraft, seriesText: event.target.value })} />
                      </label>
                      <div className="editorial-edit-actions">
                        <button type="button" className="quest-cta" onClick={saveFlourish}>Save viz</button>
                      </div>
                      <label>
                        <span>Or regenerate with a note</span>
                        <textarea
                          rows={2}
                          value={flourishDraft.commentary}
                          onChange={(event) => setFlourishDraft({ ...flourishDraft, commentary: event.target.value })}
                          placeholder="e.g. Use only the Napa acreage numbers"
                        />
                      </label>
                      <button
                        type="button"
                        className="quiet-button"
                        disabled={editorial.revisingKey === `flourish:${flourishDraft.id}` || !flourishDraft.commentary.trim()}
                        onClick={async () => {
                          await editorial.onReviseFlourish?.(flourishDraft.id, flourishDraft.commentary.trim());
                          setFlourishDraft(null);
                        }}
                      >
                        {editorial.revisingKey === `flourish:${flourishDraft.id}` ? "Regenerating…" : "Regenerate viz with AI"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
