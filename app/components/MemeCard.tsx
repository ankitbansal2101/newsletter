"use client";

import type { MemeAttachment } from "../templates/types";

type Props = {
  meme: MemeAttachment;
  variant?: "classic" | "living" | "hero";
  mode?: "studio" | "public";
};

function panelList(meme: MemeAttachment) {
  if (Array.isArray(meme.panels) && meme.panels.length) return meme.panels.map(String).filter(Boolean);
  return [meme.topText, meme.bottomText].filter(Boolean) as string[];
}

export default function MemeCard({ meme, variant = "classic", mode = "public" }: Props) {
  const format = meme.format || (meme.src ? "image" : "impact");
  const panels = panelList(meme);

  if (format === "image" && meme.src) {
    return (
      <figure className={`meme-card meme-card-image meme-${variant}`}>
        <figcaption>
          <span>{meme.topText || meme.bottomText ? "Captioned meme" : "Research figure"}</span>
          <strong>{meme.title}</strong>
        </figcaption>
        <div className="meme-image-frame">
          <img src={meme.src} alt={meme.alt || meme.title} />
          {(meme.topText || meme.bottomText) && (
            <div className="meme-image-overlay" aria-hidden="true">
              {meme.topText && <strong className="top">{meme.topText}</strong>}
              {meme.bottomText && <strong className="bottom">{meme.bottomText}</strong>}
            </div>
          )}
        </div>
        <p className="meme-credit">{meme.credit}</p>
        {mode === "studio" && (
          <small>Grounded in {meme.signalLabel} · Human approval recommended</small>
        )}
      </figure>
    );
  }

  return (
    <figure className={`meme-card meme-card-built meme-format-${format} meme-${variant}`} data-format={format}>
      <figcaption>
        <span>Auto meme · {format.replace("-", " ")}</span>
        <strong>{meme.title}</strong>
      </figcaption>

      {format === "two-panel" && (
        <div className="meme-stage meme-two-panel" aria-label={meme.alt || meme.title}>
          <div>
            <em>Expectation</em>
            <strong>{panels[0] || meme.topText || "…"}</strong>
          </div>
          <div>
            <em>Reality</em>
            <strong>{panels[1] || meme.bottomText || "…"}</strong>
          </div>
        </div>
      )}

      {format === "drake" && (
        <div className="meme-stage meme-drake" aria-label={meme.alt || meme.title}>
          <div className="no">
            <span aria-hidden="true">✕</span>
            <strong>{panels[0] || meme.topText || "…"}</strong>
          </div>
          <div className="yes">
            <span aria-hidden="true">✓</span>
            <strong>{panels[1] || meme.bottomText || "…"}</strong>
          </div>
        </div>
      )}

      {format === "expanding-brain" && (
        <div className="meme-stage meme-brain" aria-label={meme.alt || meme.title}>
          {(panels.length ? panels : [meme.topText, meme.bottomText].filter(Boolean)).slice(0, 4).map((line, index) => (
            <div key={`${line}-${index}`} data-level={index + 1}>
              <em>Level {index + 1}</em>
              <strong>{line}</strong>
            </div>
          ))}
        </div>
      )}

      {(format === "impact" || format === "caption-card" || !["two-panel", "drake", "expanding-brain"].includes(format)) && (
        <div className={`meme-stage meme-impact ${format === "caption-card" ? "is-caption" : ""}`} aria-label={meme.alt || meme.title}>
          {meme.topText && <strong className="top">{meme.topText}</strong>}
          <div className="meme-void" aria-hidden="true" />
          {meme.bottomText && <strong className="bottom">{meme.bottomText}</strong>}
          {!meme.topText && !meme.bottomText && meme.alt && (
            <strong className="bottom">{meme.alt}</strong>
          )}
        </div>
      )}

      <p className="meme-credit">{meme.credit}</p>
      {mode === "studio" && (
        <small>Grounded in {meme.signalLabel} · Human approval recommended</small>
      )}
    </figure>
  );
}
