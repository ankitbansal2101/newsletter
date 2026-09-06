"use client";

import { useState, type ReactNode } from "react";

import type { Flourish } from "../lib/flourishes";
import type { DraftSection, EditorialHandlers, PublishedIssue, SectionBlock } from "../templates/types";
import { fallbackBlocksForSection } from "./SectionBlocks";

type Props = {
  issue: PublishedIssue;
  editorial: EditorialHandlers;
  language?: "EN" | "JA";
  focusedSectionId?: string | null;
  onFocusSection?: (sectionId: string | null) => void;
  children: ReactNode;
};

type DetailState =
  | { kind: "copy"; sectionId: string; blockIndex: number; text: string }
  | { kind: "ai"; sectionId: string; blockIndex: number; commentary: string }
  | {
      kind: "viz";
      sectionId: string;
      flourishId: string;
      title: string;
      caption: string;
      chartKind: NonNullable<Flourish["chart"]>["kind"];
      seriesText: string;
      commentary: string;
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

function editableText(block: SectionBlock): string | null {
  if (block.type === "prose") return block.paragraphs.join("\n\n");
  if (block.type === "quote") return block.text;
  if (block.type === "callout") return [block.kicker, block.title, block.body, ...(block.points || [])].join("\n");
  return null;
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

export default function EditorialRail({
  issue,
  editorial,
  language = "EN",
  focusedSectionId = null,
  onFocusSection,
  children,
}: Props) {
  const sections = language === "EN" ? issue.sectionsEn : issue.sectionsJa;
  const flourishes = issue.flourishes || [];
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState | null>(null);

  const openSection = sections.find((section) => section.id === openSectionId) || null;
  const openBlocks = openSection ? fallbackBlocksForSection(openSection, flourishes, issue.memes) : [];
  const openSectionFlourishes = openSection
    ? flourishes.filter((item) => item.sectionId === openSection.id)
    : [];

  function focusSection(sectionId: string) {
    onFocusSection?.(sectionId);
    requestAnimationFrame(() => scrollNewsletterToSection(sectionId));
  }

  function openSectionEditor(sectionId: string) {
    focusSection(sectionId);
    setOpenSectionId(sectionId);
    setDetail(null);
  }

  function closeSectionEditor() {
    setOpenSectionId(null);
    setDetail(null);
  }

  function openCopyEdit(section: DraftSection, blockIndex: number, block: SectionBlock) {
    const text = editableText(block);
    if (text === null) return;
    focusSection(section.id);
    setDetail({ kind: "copy", sectionId: section.id, blockIndex, text });
  }

  function openAiEdit(section: DraftSection, blockIndex: number, block: SectionBlock) {
    if (editableText(block) === null) return;
    focusSection(section.id);
    setDetail({ kind: "ai", sectionId: section.id, blockIndex, commentary: "" });
  }

  function openVizEdit(sectionId: string, flourish: Flourish) {
    focusSection(sectionId);
    setDetail({
      kind: "viz",
      sectionId,
      flourishId: flourish.id,
      title: flourish.title,
      caption: flourish.caption || "",
      chartKind: flourish.chart?.kind || "column",
      seriesText: (flourish.chart?.series || []).map((point) => `${point.label},${point.value}`).join("\n"),
      commentary: "",
    });
  }

  function saveCopyEdit() {
    if (!detail || detail.kind !== "copy") return;
    const section = sections.find((item) => item.id === detail.sectionId);
    if (!section) return;
    const blocks = fallbackBlocksForSection(section, flourishes, issue.memes);
    const block = blocks[detail.blockIndex];
    if (!block) return;

    if (block.type === "prose") {
      editorial.onPatchBlock?.(section.id, detail.blockIndex, {
        ...block,
        paragraphs: detail.text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean),
      }, language);
    } else if (block.type === "quote") {
      editorial.onPatchBlock?.(section.id, detail.blockIndex, { ...block, text: detail.text.trim() }, language);
    } else if (block.type === "callout") {
      const [kicker, title, body, ...points] = detail.text.split("\n").map((line) => line.trim());
      editorial.onPatchBlock?.(section.id, detail.blockIndex, {
        ...block,
        kicker: kicker || block.kicker,
        title: title || block.title,
        body: body || block.body,
        points: points.filter(Boolean),
      }, language);
    }
    setDetail(null);
  }

  function saveVizEdit() {
    if (!detail || detail.kind !== "viz") return;
    const current = flourishes.find((item) => item.id === detail.flourishId);
    if (!current) return;
    const series = detail.seriesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, valueRaw] = line.split(",").map((part) => part.trim());
        return { label: label || "item", value: Number(valueRaw) || 0 };
      });
    editorial.onPatchFlourish?.({
      ...current,
      title: detail.title.trim() || current.title,
      caption: detail.caption.trim() || undefined,
      unresolved: false,
      chart: current.chart
        ? { ...current.chart, kind: detail.chartKind, series: series.length ? series : current.chart.series }
        : current.chart,
    });
    setDetail(null);
  }

  const deskClass = [
    "quest-preview-desk",
    openSectionId ? "has-section-panel" : "",
    detail ? "has-detail-panel" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const activeBeatIndex = detail && (detail.kind === "copy" || detail.kind === "ai") ? detail.blockIndex : null;
  const activeFlourishId = detail?.kind === "viz" ? detail.flourishId : null;

  return (
    <div className={deskClass}>
      <aside className="editorial-rail" aria-label="Issue outline">
        <header className="editorial-rail-head">
          <p>Issue outline</p>
          <strong>Edit opens on the right</strong>
        </header>

        <div className="editorial-section-list">
          {sections.map((section, index) => {
            const isOpen = openSectionId === section.id;
            const isFocused = focusedSectionId === section.id;
            return (
              <div
                key={section.id}
                className={`editorial-tile ${isFocused ? "is-focused" : ""} ${isOpen ? "is-active" : ""} ${section.locked ? "is-locked" : ""}`}
              >
                <button type="button" className="editorial-tile-main" onClick={() => focusSection(section.id)}>
                  <span className="editorial-tile-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="editorial-tile-copy">
                    <em>{section.eyebrow || "Chapter"}</em>
                    <strong>{section.title}</strong>
                    <small>
                      {(section.blocks || []).length || section.paragraphs.length} beats
                      {section.locked ? " · locked" : ""}
                      {isOpen ? " · open" : ""}
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
                    className={`editorial-pencil ${isOpen ? "is-open" : ""}`}
                    title={isOpen ? "Close chapter editor" : "Edit chapter"}
                    aria-expanded={isOpen}
                    onClick={() => (isOpen ? closeSectionEditor() : openSectionEditor(section.id))}
                  >
                    {isOpen ? "×" : "✎"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <div className="quest-preview-frame">{children}</div>

      {openSection && (
        <aside className="editorial-panel editorial-section-panel" aria-label="Chapter editor">
          <header className="editorial-panel-head">
            <div>
              <p>Chapter</p>
              <strong>{openSection.title}</strong>
            </div>
            <button type="button" className="quiet-button" onClick={closeSectionEditor}>Close</button>
          </header>

          {openSection.locked ? (
            <p className="editorial-help">Unlock this chapter to edit beats.</p>
          ) : (
            <p className="editorial-help">Pick a beat, then edit opens in the next panel to the right.</p>
          )}

          <ul className="editorial-beat-list">
            {openBlocks.map((block, blockIndex) => {
              const revising = editorial.revisingKey === `${openSection.id}:${blockIndex}`;
              const canEditCopy = editableText(block) !== null;
              const isActive = activeBeatIndex === blockIndex;
              const isVizActive = block.type === "flourish" && activeFlourishId === block.flourishId;
              return (
                <li
                  key={`${openSection.id}-beat-${blockIndex}`}
                  className={isActive || isVizActive ? "is-open is-selected" : ""}
                >
                  <div className="editorial-beat-row">
                    <div>
                      <em>{blockLabel(block)}</em>
                      <span>{blockPreview(block)}</span>
                      {revising && <small className="editorial-beat-status">Regenerating…</small>}
                    </div>
                    <div className="editorial-beat-actions">
                      <button type="button" disabled={openSection.locked || blockIndex === 0} onClick={() => editorial.onMoveBlock?.(openSection.id, blockIndex, blockIndex - 1, language)}>↑</button>
                      <button type="button" disabled={openSection.locked || blockIndex >= openBlocks.length - 1} onClick={() => editorial.onMoveBlock?.(openSection.id, blockIndex, blockIndex + 1, language)}>↓</button>
                      {canEditCopy && (
                        <button
                          type="button"
                          className={`editorial-pencil ${detail?.kind === "copy" && detail.blockIndex === blockIndex ? "is-open" : ""}`}
                          disabled={openSection.locked}
                          title="Edit copy"
                          onClick={() => openCopyEdit(openSection, blockIndex, block)}
                        >
                          ✎
                        </button>
                      )}
                      {canEditCopy && (
                        <button
                          type="button"
                          className={`editorial-ai ${detail?.kind === "ai" && detail.blockIndex === blockIndex ? "is-open" : ""}`}
                          disabled={openSection.locked}
                          title="Regenerate with AI"
                          onClick={() => openAiEdit(openSection, blockIndex, block)}
                        >
                          AI
                        </button>
                      )}
                      {block.type === "flourish" && (
                        <button
                          type="button"
                          className={isVizActive ? "is-lock" : ""}
                          disabled={openSection.locked}
                          onClick={() => {
                            const flourish = flourishes.find((item) => item.id === block.flourishId);
                            if (flourish) openVizEdit(openSection.id, flourish);
                          }}
                        >
                          Viz
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {!!openSectionFlourishes.length && (
            <div className="editorial-viz-list">
              <p>Visualizations</p>
              {openSectionFlourishes.map((flourish) => (
                <button
                  key={flourish.id}
                  type="button"
                  className={activeFlourishId === flourish.id ? "is-selected" : ""}
                  disabled={openSection.locked}
                  onClick={() => openVizEdit(openSection.id, flourish)}
                >
                  <em>{flourish.type}</em>
                  <strong>{flourish.title}</strong>
                </button>
              ))}
            </div>
          )}
        </aside>
      )}

      {detail && (
        <aside className="editorial-panel editorial-detail-panel" aria-label="Beat editor">
          <header className="editorial-panel-head">
            <div>
              <p>{detail.kind === "viz" ? "Visualization" : detail.kind === "ai" ? "AI rewrite" : "Copy edit"}</p>
              <strong>
                {detail.kind === "viz"
                  ? detail.title || "Chart"
                  : `Beat ${(detail.blockIndex + 1).toString().padStart(2, "0")}`}
              </strong>
            </div>
            <button type="button" className="quiet-button" onClick={() => setDetail(null)}>Close</button>
          </header>

          {detail.kind === "copy" && (
            <div className="editorial-edit-panel is-drawer">
              <label>
                <span>Copy</span>
                <textarea
                  rows={12}
                  value={detail.text}
                  onChange={(event) => setDetail({ ...detail, text: event.target.value })}
                />
              </label>
              <div className="editorial-edit-actions">
                <button type="button" className="quest-cta" onClick={saveCopyEdit}>Save</button>
                <button type="button" className="quiet-button" onClick={() => setDetail(null)}>Cancel</button>
              </div>
            </div>
          )}

          {detail.kind === "ai" && (
            <div className="editorial-edit-panel is-drawer">
              <label>
                <span>What should change?</span>
                <textarea
                  rows={5}
                  autoFocus
                  placeholder="e.g. Make this sharper and keep the Snap Specs angle"
                  value={detail.commentary}
                  onChange={(event) => setDetail({ ...detail, commentary: event.target.value })}
                />
              </label>
              <div className="editorial-edit-actions">
                <button
                  type="button"
                  className="quest-cta"
                  disabled={editorial.revisingKey === `${detail.sectionId}:${detail.blockIndex}` || !detail.commentary.trim()}
                  onClick={async () => {
                    await editorial.onReviseBlock?.(detail.sectionId, detail.blockIndex, detail.commentary.trim(), language);
                    setDetail(null);
                  }}
                >
                  {editorial.revisingKey === `${detail.sectionId}:${detail.blockIndex}` ? "Regenerating…" : "Regenerate"}
                </button>
                <button type="button" className="quiet-button" onClick={() => setDetail(null)}>Cancel</button>
              </div>
            </div>
          )}

          {detail.kind === "viz" && (
            <div className="editorial-edit-panel is-drawer flourish-panel">
              <label>
                <span>Title</span>
                <input value={detail.title} onChange={(event) => setDetail({ ...detail, title: event.target.value })} />
              </label>
              <label>
                <span>Caption</span>
                <textarea rows={2} value={detail.caption} onChange={(event) => setDetail({ ...detail, caption: event.target.value })} />
              </label>
              <label>
                <span>Chart kind</span>
                <select
                  value={detail.chartKind}
                  onChange={(event) => setDetail({ ...detail, chartKind: event.target.value as NonNullable<Flourish["chart"]>["kind"] })}
                >
                  {["bar", "line", "column", "donut", "gauge", "area"].map((kind) => (
                    <option key={kind} value={kind}>{kind}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Series (label,value)</span>
                <textarea rows={5} value={detail.seriesText} onChange={(event) => setDetail({ ...detail, seriesText: event.target.value })} />
              </label>
              <div className="editorial-edit-actions">
                <button type="button" className="quest-cta" onClick={saveVizEdit}>Save viz</button>
              </div>
              <label>
                <span>Or regenerate with a note</span>
                <textarea
                  rows={3}
                  value={detail.commentary}
                  onChange={(event) => setDetail({ ...detail, commentary: event.target.value })}
                  placeholder="e.g. Use only the Napa acreage numbers"
                />
              </label>
              <button
                type="button"
                className="quiet-button"
                disabled={editorial.revisingKey === `flourish:${detail.flourishId}` || !detail.commentary.trim()}
                onClick={async () => {
                  await editorial.onReviseFlourish?.(detail.flourishId, detail.commentary.trim());
                  setDetail(null);
                }}
              >
                {editorial.revisingKey === `flourish:${detail.flourishId}` ? "Regenerating…" : "Regenerate viz with AI"}
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
