"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import MemeCard from "../components/MemeCard";
import NarrationControls from "../components/NarrationControls";
import SectionBlocks from "../components/SectionBlocks";
import { FlourishChart, formatChartValue } from "../components/charts";
import type { Flourish } from "../lib/flourishes";
import type { NarrationCue } from "../lib/narration";
import type { NewsletterTemplateProps, PublishedIssue } from "./types";

function useReveal(enabled: boolean, rootRef: RefObject<HTMLElement | null>, deps: unknown[]) {
  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, rootRef, ...deps]);
}

function PulseLab({ flourishes }: { flourishes: Flourish[] }) {
  const options = useMemo(() => {
    const stats = flourishes
      .filter((f) => f.type === "stat-cluster" && f.stats?.length)
      .flatMap((f) => f.stats!.map((s) => ({ value: s.value, label: s.label, source: s.source || f.title })));
    const quotes = flourishes
      .filter((f) => f.type === "quote" && f.quote?.text)
      .map((f) => ({ value: "quote", label: f.quote!.text.slice(0, 90), source: f.quote!.attribution }));
    return [...stats.slice(0, 3), ...quotes.slice(0, 1)].slice(0, 3);
  }, [flourishes]);

  const [picked, setPicked] = useState<number | null>(null);
  if (options.length < 2) return null;

  return (
    <aside className="living-pulse" data-reveal>
      <header>
        <span>Field pulse</span>
        <strong>Which signal feels most load-bearing?</strong>
      </header>
      <div className="living-pulse-options">
        {options.map((option, index) => {
          const active = picked === index;
          return (
            <button
              key={`${option.label}-${index}`}
              type="button"
              className={active ? "picked" : ""}
              onClick={() => setPicked(index)}
            >
              <b>{option.value === "quote" ? "❝" : option.value}</b>
              <span>{option.label}</span>
              {active && <em>{option.source}</em>}
            </button>
          );
        })}
      </div>
      {picked !== null && <p className="living-pulse-note">Pinned for your read. Evidence still needs human judgment.</p>}
    </aside>
  );
}

function DataObservatory({ flourishes }: { flourishes: Flourish[] }) {
  const charts = flourishes.filter((item) => item.type === "viz" && item.chart);
  const stats = flourishes
    .filter((item) => item.type === "stat-cluster" && item.stats?.length)
    .flatMap((item) => item.stats!.map((stat) => ({ ...stat, title: item.title })));
  const ranking = charts.find((item) => item.chart && (item.chart.kind === "bar" || item.chart.kind === "column"));
  const [activeRank, setActiveRank] = useState(0);

  if (!charts.length && stats.length < 2) return null;

  const series = ranking?.chart?.series || [];
  const max = Math.max(...series.map((point) => point.value), 1);
  const lead = series[activeRank] || series[0];

  return (
    <section className="living-observatory" data-reveal>
      <header>
        <p className="living-eyebrow">Data observatory</p>
        <h2>Read the field as a game of signals</h2>
        <p>Charts and meters assembled from the document, selected loot, and scraped sources.</p>
      </header>

      {!!stats.length && (
        <div className="living-gauges">
          {stats.slice(0, 4).map((stat) => {
            const numeric = Number(String(stat.value).replace(/[^\d.]/g, ""));
            const width = Number.isFinite(numeric) ? Math.max(8, Math.min(100, numeric > 100 ? 72 : numeric)) : 42;
            return (
              <div key={`${stat.label}-${stat.value}`} className="living-gauge">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <i><b style={{ width: `${width}%` }} /></i>
                {stat.source && <small>{stat.source}</small>}
              </div>
            );
          })}
        </div>
      )}

      {series.length >= 2 && ranking && (
        <div className="living-arena">
          <div className="living-arena-copy">
            <span>Signal arena</span>
            <h3>{ranking.title}</h3>
            <p>Tap a row to pin the lead. {lead ? `${lead.label} is at ${formatChartValue(lead.value)}${ranking.chart?.unit ? ` ${ranking.chart.unit}` : ""}.` : ""}</p>
          </div>
          <ol>
            {series.slice(0, 6).map((point, index) => (
              <li key={`${point.label}-${index}`}>
                <button type="button" className={activeRank === index ? "on" : ""} onClick={() => setActiveRank(index)}>
                  <em>{String(index + 1).padStart(2, "0")}</em>
                  <span>{point.label}</span>
                  <b>{formatChartValue(point.value)}</b>
                  <i><u style={{ width: `${Math.max(8, (point.value / max) * 100)}%` }} /></i>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {charts.length > 0 && (
        <div className="living-chart-grid">
          {charts.slice(0, 4).map((flourish) => (
            <article key={flourish.id} className="living-chart-card">
              <span>{flourish.chart?.kind} analysis</span>
              <h3>{flourish.title}</h3>
              {flourish.chart && <FlourishChart chart={flourish.chart} title={flourish.title} />}
              {flourish.caption && <p>{flourish.caption}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function InteractiveNewsletter({
  issue,
  mode,
  initialLanguage = "EN",
  initialSize = "desktop",
  focusedSectionId = null,
}: NewsletterTemplateProps) {
  const [opened, setOpened] = useState(true);
  const [language, setLanguage] = useState<"EN" | "JA">(initialLanguage);
  const [size, setSize] = useState<"desktop" | "mobile">(initialSize);
  const [progress, setProgress] = useState(0);
  const [jaOpen, setJaOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [narratingSectionId, setNarratingSectionId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  const sections = language === "EN" ? issue.sectionsEn : issue.sectionsJa;
  const title = language === "EN" ? issue.title.en : issue.title.ja;
  const dek = language === "EN" ? issue.dek.en : issue.dek.ja;
  const flourishes = issue.flourishes || [];
  const hero = issue.memes.find((meme) => meme.format !== "image" || !!meme.src) || issue.memes[0];
  const dateLabel = mode === "studio"
    ? "Draft preview"
    : new Date(issue.meta.publishedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  useReveal(opened, articleRef, [language, sections.length]);
  useEffect(() => {
    const openForPrint = () => setOpened(true);
    window.addEventListener("beforeprint", openForPrint);
    return () => window.removeEventListener("beforeprint", openForPrint);
  }, []);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !opened) return;
    const onScroll = () => {
      const max = stage.scrollHeight - stage.clientHeight;
      setProgress(max > 0 ? Math.min(100, (stage.scrollTop / max) * 100) : 0);
      const chapters = stage.querySelectorAll<HTMLElement>("[data-chapter]");
      let current = 0;
      chapters.forEach((node, index) => {
        if (node.offsetTop - stage.scrollTop < stage.clientHeight * 0.35) current = index;
      });
      setActiveChapter(current);
    };
    stage.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => stage.removeEventListener("scroll", onScroll);
  }, [opened, language, sections.length]);

  function jumpTo(index: number) {
    const stage = stageRef.current;
    const target = stage?.querySelectorAll<HTMLElement>("[data-chapter]")[index];
    if (!stage || !target) return;
    stage.scrollTo({ top: target.offsetTop - 24, behavior: "smooth" });
  }

  function handleNarrationCue(cue: NarrationCue | null) {
    setNarratingSectionId(cue?.sectionId || null);
    if (!cue?.sectionId) return;
    setOpened(true);
    const stage = stageRef.current;
    const target = stage?.querySelector<HTMLElement>(`[data-section-id="${cue.sectionId}"]`);
    if (!stage || !target) return;
    stage.scrollTo({ top: Math.max(0, target.offsetTop - 28), behavior: "smooth" });
  }

  return (
    <section className={`issue-preview-shell living-shell ${mode === "public" ? "newsletter-public" : ""}`}>
      <div className="preview-toolbar preview-toolbar-minimal">
        <div className="preview-toggles" aria-label="Reading controls">
          <div>
            <button className={size === "desktop" ? "active" : ""} type="button" onClick={() => setSize("desktop")}>Desktop</button>
            <button className={size === "mobile" ? "active" : ""} type="button" onClick={() => setSize("mobile")}>Mobile</button>
          </div>
          <div>
            <button className={language === "EN" ? "active" : ""} type="button" onClick={() => setLanguage("EN")}>EN</button>
            <button className={language === "JA" ? "active" : ""} type="button" onClick={() => { setLanguage("JA"); setJaOpen(false); }}>JA</button>
          </div>
        </div>
        <NarrationControls issue={issue} language={language} onCueChange={handleNarrationCue} />
        {mode === "studio" && (
          <button className="quiet-button pdf-download" type="button" onClick={() => { setOpened(true); window.setTimeout(() => window.print(), 80); }}>Download PDF</button>
        )}
      </div>

      <div className={`reader-stage living-stage ${size}`} ref={stageRef}>
        {!opened && (
          <div className="living-cover" role="dialog" aria-modal="true" aria-label="Open interactive issue">
            <div className="living-cover-book">
              <div className="living-cover-copy">
                <p className="living-eyebrow">Living field guide · Cycle {issue.meta.cycle} · Week {issue.meta.week}</p>
                <h2>{issue.title.en}</h2>
                <p>{issue.dek.en}</p>
              </div>
              <div className="living-cover-field" aria-hidden="true">
                <span className="living-ring outer" />
                <span className="living-ring inner" />
                <span className="living-node heard">heard</span>
                <span className="living-node known">held</span>
                <span className="living-node changed">changed</span>
                <strong>you</strong>
              </div>
            </div>
            <button className="living-open" type="button" onClick={() => setOpened(true)}>
              Open the record
            </button>
          </div>
        )}

        {opened && (
          <article className="living-issue" ref={articleRef}>
            <div className="living-progress" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>

            <nav className="living-chapters" aria-label="Chapters">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  className={activeChapter === index ? "active" : ""}
                  onClick={() => jumpTo(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <em>{section.eyebrow || section.title}</em>
                </button>
              ))}
              <button type="button" className="living-replay" onClick={() => { setOpened(false); setProgress(0); }}>
                Cover
              </button>
            </nav>

            <header className="living-hero" data-reveal>
              {hero && (
                <div className="living-hero-media living-hero-meme">
                  <MemeCard meme={hero} variant="hero" mode={mode} />
                </div>
              )}
              <div className="living-hero-copy">
                <p className="living-eyebrow">Sunday Data · {dateLabel}</p>
                <h1>{title}</h1>
                <p className="living-dek">{dek}</p>
                <div className="living-meters">
                  <div><strong>{issue.stats.records}</strong><span>materials</span></div>
                  <div><strong>{issue.stats.sources}</strong><span>sources</span></div>
                  <div><strong>{issue.stats.topics}</strong><span>topics</span></div>
                  <div><strong>{issue.stats.ingredients}</strong><span>components</span></div>
                </div>
                {language === "EN" && issue.sectionsJa.length > 0 && (
                  <button className="living-ja-pill" type="button" onClick={() => setJaOpen(true)}>
                    日本語版 · Japanese edition
                  </button>
                )}
              </div>
            </header>

            <PulseLab flourishes={flourishes} />
            <DataObservatory flourishes={flourishes} />

            {sections.map((section, index) => {
              const heroMemeId = index === 0 && hero?.id ? hero.id : undefined;
              const focused = focusedSectionId === section.id;
              return (
                <section
                  className={`living-chapter ${section.locked ? "passage-locked" : ""} ${focused ? "is-section-focused" : ""} ${narratingSectionId === section.id ? "is-narrating" : ""}`}
                  data-chapter
                  data-section-id={section.id}
                  id={`issue-section-${section.id}`}
                  data-reveal
                  key={`${language}-${section.id}`}
                >
                  {focused && <div className="section-focus-badge" aria-hidden="true">Editing this chapter</div>}
                  <p className="living-kicker">{section.eyebrow}{section.locked ? " · locked" : ""}</p>
                  <h2>{section.title}</h2>
                  {section.subtitle && <p className="living-sub">{section.subtitle}</p>}
                  <SectionBlocks
                    section={section}
                    flourishes={flourishes}
                    memes={issue.memes}
                    mode={mode}
                    variant="living"
                    skipMemeIds={heroMemeId ? [heroMemeId] : []}
                  />
                </section>
              );
            })}

            {issue.research && (
              <details className="living-ledger" data-reveal>
                <summary>
                  <span>Editor&apos;s ledger</span>
                  <strong>{issue.research.citations.length || "—"} sources</strong>
                </summary>
                <p>{issue.research.text}</p>
                {!!issue.research.citations.length && (
                  <ul>
                    {issue.research.citations.map((citation) => (
                      <li key={citation.url}>
                        <a href={citation.url} target="_blank" rel="noreferrer">{citation.title}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            )}

            <footer className="living-footer">
              <strong>Sunday Data</strong>
              <p>
                {mode === "studio"
                  ? "Interactive draft. Motion and labs are template chrome — wording still needs human review."
                  : "Published by Pendle.AI. Human-authored. Research-supported."}
              </p>
            </footer>
          </article>
        )}
      </div>

      {jaOpen && (
        <aside className="living-ja-drawer" role="dialog" aria-modal="true" aria-label="Japanese edition">
          <div className="living-ja-inner">
            <header>
              <div>
                <p className="living-eyebrow">日本語完全版</p>
                <h2>{issue.title.ja}</h2>
                <p>{issue.dek.ja}</p>
              </div>
              <button type="button" onClick={() => setJaOpen(false)} aria-label="Close Japanese edition">閉じる</button>
            </header>
            <div className="living-ja-body">
              {issue.sectionsJa.map((section) => (
                <section key={section.id}>
                  <h3>{section.title}</h3>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </aside>
      )}
    </section>
  );
}

export type { PublishedIssue }; // re-export for convenience
