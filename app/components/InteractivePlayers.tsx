"use client";

import { useMemo, useState } from "react";

import type { InteractivePayload } from "../lib/interaction";

type Props = {
  payload: InteractivePayload;
};

export default function InteractivePlayer({ payload }: Props) {
  if (payload.kind === "timeline" && payload.series?.length) {
    return <TimelinePlayer payload={payload} />;
  }
  if (payload.kind === "network" && payload.nodes?.length) {
    return <NetworkPlayer payload={payload} />;
  }
  if ((payload.kind === "conditional" || payload.kind === "garden") && payload.scenarios?.length) {
    return <ConditionalPlayer payload={payload} />;
  }
  if (payload.kind === "garden") {
    return (
      <aside className="interactive-player kind-garden">
        <header>
          <span>Playable beat</span>
          <strong>{payload.title}</strong>
        </header>
        <p>{payload.prompt || "Repeated actions change the visible expectation in this garden."}</p>
      </aside>
    );
  }
  return null;
}

function TimelinePlayer({ payload }: Props) {
  const series = payload.series || [];
  const [index, setIndex] = useState(Math.max(0, series.length - 1));
  const point = series[index] || series[0];
  const max = Math.max(...series.map((item) => item.value), 1);

  return (
    <aside className="interactive-player kind-timeline" data-reveal>
      <header>
        <span>Timeline scrubber</span>
        <strong>{payload.title}</strong>
      </header>
      {payload.prompt && <p className="interactive-prompt">{payload.prompt}</p>}
      <div className="timeline-meter">
        <strong>{point?.value}</strong>
        <span>{point?.label}</span>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, series.length - 1)}
        value={index}
        onChange={(event) => setIndex(Number(event.target.value))}
        aria-label="Scrub timeline"
      />
      <div className="timeline-bars" aria-hidden="true">
        {series.map((item, i) => (
          <i
            key={`${item.label}-${i}`}
            className={i === index ? "on" : ""}
            style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
          />
        ))}
      </div>
    </aside>
  );
}

function NetworkPlayer({ payload }: Props) {
  const nodes = payload.nodes || [];
  const links = payload.links || [];
  const [removed, setRemoved] = useState<string | null>(null);
  const alive = useMemo(() => new Set(nodes.filter((node) => node.id !== removed).map((node) => node.id)), [nodes, removed]);
  const liveLinks = links.filter((link) => alive.has(link.from) && alive.has(link.to));
  const collapsed = removed ? liveLinks.length < Math.max(1, links.length - 1) : false;

  return (
    <aside className="interactive-player kind-network" data-reveal>
      <header>
        <span>Network stress test</span>
        <strong>{payload.title}</strong>
      </header>
      {payload.prompt && <p className="interactive-prompt">{payload.prompt}</p>}
      <div className="network-nodes">
        {nodes.map((node) => {
          const off = removed === node.id;
          return (
            <button
              key={node.id}
              type="button"
              className={off ? "removed" : ""}
              onClick={() => setRemoved(off ? null : node.id)}
            >
              {node.label}
            </button>
          );
        })}
      </div>
      <p className="network-status">
        {removed
          ? collapsed
            ? `Removing “${nodes.find((n) => n.id === removed)?.label}” fractures the playable network (${liveLinks.length} roads left).`
            : `Removing “${nodes.find((n) => n.id === removed)?.label}” leaves ${liveLinks.length} roads — still holding.`
          : `${liveLinks.length} direct roads. Click a node to stress-test.`}
      </p>
    </aside>
  );
}

function ConditionalPlayer({ payload }: Props) {
  const scenarios = payload.scenarios || [];
  const [active, setActive] = useState(scenarios[0]?.id || "");
  const current = scenarios.find((item) => item.id === active) || scenarios[0];

  return (
    <aside className="interactive-player kind-conditional" data-reveal>
      <header>
        <span>{payload.kind === "garden" ? "Culture garden" : "Scenario switch"}</span>
        <strong>{payload.title}</strong>
      </header>
      {payload.prompt && <p className="interactive-prompt">{payload.prompt}</p>}
      <div className="scenario-tabs">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={scenario.id === current?.id ? "on" : ""}
            onClick={() => setActive(scenario.id)}
          >
            {scenario.label}
          </button>
        ))}
      </div>
      {current && <p className="scenario-outcome">{current.outcome}</p>}
    </aside>
  );
}
