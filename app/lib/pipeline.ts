export type PipelinePhaseId = "idle" | "brief-read" | "research" | "generate" | "revise" | "done" | "error";

export type PipelinePhase = {
  id: Exclude<PipelinePhaseId, "idle" | "done" | "error">;
  label: string;
  detail?: string;
  status: "pending" | "active" | "done" | "skipped" | "error";
};

export type PipelineState = {
  phase: PipelinePhaseId;
  phases: PipelinePhase[];
  startedAt: number | null;
  message: string;
};

export function idlePipeline(scrapeWeb: boolean): PipelineState {
  return {
    phase: "idle",
    startedAt: null,
    message: "Ready.",
    phases: [
      { id: "brief-read", label: "Read brief", status: "pending" },
      { id: "research", label: scrapeWeb ? "Scout the web" : "Manuscript loot", status: scrapeWeb ? "pending" : "pending" },
      { id: "generate", label: "Forge issue", status: "pending" },
      { id: "revise", label: "Revise segment", status: "pending" },
    ],
  };
}

export function markPhase(
  state: PipelineState,
  id: PipelinePhase["id"],
  status: PipelinePhase["status"],
  detail?: string,
  message?: string,
): PipelineState {
  return {
    ...state,
    phase: status === "active" ? id : state.phase,
    startedAt: status === "active" && !state.startedAt ? Date.now() : state.startedAt,
    message: message ?? state.message,
    phases: state.phases.map((phase) => (
      phase.id === id ? { ...phase, status, detail: detail ?? phase.detail } : phase
    )),
  };
}

export function formatElapsed(startedAt: number | null) {
  if (!startedAt) return "0s";
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
