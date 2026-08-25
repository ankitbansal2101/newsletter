"use client";

import { useState } from "react";

import SectionBlocks from "./SectionBlocks";
import type { NewsletterTemplateProps, PublishedIssue } from "../templates/types";

export type { DraftSection, MemeAttachment, IssueCitation, PublishedIssue } from "../templates/types";

export default function NewsletterTemplate({ issue, mode, initialLanguage = "EN", initialSize = "desktop" }: NewsletterTemplateProps) {
  const [language, setLanguage] = useState<"EN" | "JA">(initialLanguage);
  const [size, setSize] = useState<"desktop" | "mobile">(initialSize);

  const sections = language === "EN" ? issue.sectionsEn : issue.sectionsJa;
  const title = language === "EN" ? issue.title.en : issue.title.ja;
  const dek = language === "EN" ? issue.dek.en : issue.dek.ja;
  const flourishes = issue.flourishes || [];
  const dateLabel = mode === "studio"
    ? "Draft preview"
    : new Date(issue.meta.publishedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <section className={`issue-preview-shell ${mode === "public" ? "newsletter-public" : ""}`}>
      <div className="preview-toolbar preview-toolbar-minimal">
        <div className="preview-toggles" aria-label="Reading controls">
          <div>
            <button className={size === "desktop" ? "active" : ""} type="button" onClick={() => setSize("desktop")}>Desktop</button>
            <button className={size === "mobile" ? "active" : ""} type="button" onClick={() => setSize("mobile")}>Mobile</button>
          </div>
        </div>
        {mode === "studio" && (
          <button className="quiet-button pdf-download" type="button" onClick={() => window.print()}>Download PDF</button>
        )}
      </div>

      <div className={`reader-stage ${size}`}>
        <article className="newsletter-preview">
          <header className="newsletter-cover">
            <div className="newsletter-brand"><span>Sunday Data</span><small>Pendle.AI</small></div>
            <p>Cycle {issue.meta.cycle} · Week {issue.meta.week} · {dateLabel}</p>
            {mode === "studio" && <span className="working-title">Working title</span>}
            <h1>{title}</h1>
            <p className="newsletter-dek">{dek}</p>
            <div className="preview-signals">
              <div><strong>{issue.stats.records}</strong><span>robotics records</span></div>
              <div><strong>{issue.stats.sources}</strong><span>active sources</span></div>
              <div><strong>{issue.stats.topics}</strong><span>selected topics</span></div>
              <div><strong>{issue.stats.ingredients}</strong><span>issue ingredients</span></div>
            </div>
            {mode === "studio" && issue.sourceDoc?.url && (
              <p className="source-doc-line">
                Source manuscript: <a href={issue.sourceDoc.url} target="_blank" rel="noreferrer">Google Doc</a>
                <span> · forked {new Date(issue.sourceDoc.importedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · read-only</span>
              </p>
            )}
          </header>

          <div className="newsletter-body">
            {sections.map((section) => (
              <div className="preview-chapter-group" key={`${language}-${section.id}`}>
                <section className="preview-chapter">
                  <p className="chapter-kicker">
                    {section.eyebrow}
                    {mode === "studio" && ` · ${language === "EN" ? "Human original" : "Source translation"}`}
                  </p>
                  {section.id !== "opening" && <h2>{section.title}</h2>}
                  {section.subtitle && <p className="chapter-subtitle">{section.subtitle}</p>}
                  <SectionBlocks
                    section={section}
                    flourishes={flourishes}
                    memes={issue.memes}
                    mode={mode}
                    variant="classic"
                    dropcapFirst={section.id === "opening"}
                  />
                </section>
              </div>
            ))}

            {issue.research && (
              <details className="generated-research-preview research-appendix">
                <summary>
                  <p className="chapter-kicker">Research appendix</p>
                  <strong>Editor&apos;s ledger</strong>
                  <span>{issue.research.citations.length ? `${issue.research.citations.length} sources · ` : ""}review notes · tap to open</span>
                </summary>
                <div className="ledger-body">
                  <p className="research-copy-plain">{issue.research.text}</p>
                  {!!issue.research.citations.length && (
                    <div className="citation-ledger">
                      <strong>Source ledger</strong>
                      {issue.research.citations.map((citation) => (
                        <a href={citation.url} target="_blank" rel="noreferrer" key={citation.url}>{citation.title}</a>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            )}

            <footer className="preview-footer">
              <strong>Sunday Data</strong>
              <p>{mode === "studio"
                ? "Draft preview. Human-authored wording remains canonical. Generated additions, evidence, and visuals require review."
                : "Published by Pendle.AI. Human-authored. Research-supported."}</p>
            </footer>
          </div>
        </article>
      </div>
    </section>
  );
}
