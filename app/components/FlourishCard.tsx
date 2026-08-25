"use client";

import { FlourishChart } from "./charts";
import type { Flourish } from "../lib/flourishes";
import { flourishTypeLabels, trendGlyphs } from "../lib/flourishes";

type Props = {
  flourish: Flourish;
  mode: "studio" | "public";
};

export default function FlourishCard({ flourish, mode }: Props) {
  return (
    <aside className={`flourish-card kind-${flourish.type} ${flourish.unresolved ? "flourish-unresolved" : ""}`}>
      <header className="flourish-head">
        <span className="flourish-kind">✿ {flourishTypeLabels[flourish.type]}</span>
        {mode === "studio" && flourish.signalLabel && <span className="flourish-signal">{flourish.signalLabel}</span>}
        {flourish.unresolved && <span className="flourish-flag">needs human resolution</span>}
      </header>
      <h4>{flourish.title}</h4>

      {flourish.type === "viz" && flourish.chart && (
        <>
          {flourish.chart.unit && <p className="chart-unit-note">{flourish.chart.unit}</p>}
          <FlourishChart chart={flourish.chart} title={flourish.title} />
        </>
      )}

      {flourish.type === "stat-cluster" && flourish.stats && (
        <div className="flourish-stats">
          {flourish.stats.slice(0, 4).map((stat) => (
            <div key={`${stat.label}-${stat.value}`}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              {stat.source && <small>{stat.source}</small>}
            </div>
          ))}
        </div>
      )}

      {flourish.type === "trend" && flourish.trend && (
        <div className={`flourish-trend trend-${flourish.trend.direction}`}>
          <span className="trend-glyph" aria-hidden="true">{trendGlyphs[flourish.trend.direction]}</span>
          <div>
            <strong>{flourish.trend.direction}</strong>
            <span> · {flourish.trend.horizon || "near-term"} · {flourish.trend.confidence || "medium"} confidence</span>
            <p>{flourish.trend.basis}</p>
          </div>
        </div>
      )}

      {flourish.type === "quote" && flourish.quote && (
        <blockquote className="flourish-quote">
          <p>“{flourish.quote.text}”</p>
          <cite>
            — {flourish.quote.url
              ? <a href={flourish.quote.url} target="_blank" rel="noreferrer">{flourish.quote.attribution}</a>
              : flourish.quote.attribution}
          </cite>
        </blockquote>
      )}

      {flourish.type === "table" && flourish.table && (
        <div className="flourish-table-wrap">
          <table>
            <thead><tr>{flourish.table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {flourish.table.rows.slice(0, 8).map((row, rowIndex) => (
                <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(flourish.type === "story" || flourish.body) && flourish.body && (
        <p className="flourish-body">{flourish.body}</p>
      )}

      {flourish.caption && <p className="flourish-caption">{flourish.caption}</p>}

      {!!flourish.sources.length && (
        <footer className="flourish-sources">
          {flourish.sources.slice(0, 4).map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
          ))}
        </footer>
      )}
    </aside>
  );
}
