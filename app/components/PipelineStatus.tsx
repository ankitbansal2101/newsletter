"use client";

import { useEffect, useState } from "react";

import { formatElapsed, type PipelineState } from "../lib/pipeline";

type Props = {
  pipeline: PipelineState;
  busy: boolean;
};

export default function PipelineStatus({ pipeline, busy }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!busy || !pipeline.startedAt) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [busy, pipeline.startedAt]);

  const visible = pipeline.phases.filter((phase) => phase.id !== "revise" || phase.status !== "pending" || busy);
  if (!busy && pipeline.phase === "idle") return null;

  return (
    <aside className={`pipeline-status ${busy ? "is-busy" : ""}`} aria-live="polite">
      <header>
        <strong>{busy ? "Working…" : pipeline.phase === "error" ? "Stopped" : "Pipeline"}</strong>
        <span>{busy ? formatElapsed(pipeline.startedAt) : pipeline.message}</span>
      </header>
      <ol>
        {visible.map((phase) => (
          <li key={phase.id} className={`pipeline-step status-${phase.status}`}>
            <i aria-hidden="true" />
            <div>
              <em>{phase.label}</em>
              {(phase.detail || phase.status === "active") && (
                <small>{phase.detail || (phase.status === "active" ? pipeline.message : "")}</small>
              )}
            </div>
          </li>
        ))}
      </ol>
      {busy && <p className="pipeline-message">{pipeline.message}</p>}
    </aside>
  );
}
