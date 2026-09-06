import { parseJsonObject } from "../../lib/json";
import { parseOpenAIJson } from "../../lib/http";
import { parseFlourishPayload, type Flourish } from "../../lib/flourishes";
import type { SectionBlock } from "../../templates/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_MODEL = "gpt-5.6-terra";

type ReviseRequest = {
  target?: "block" | "flourish";
  commentary?: string;
  topic?: string;
  section?: { id: string; title: string; eyebrow?: string; locked?: boolean };
  block?: SectionBlock;
  blockIndex?: number;
  flourish?: Flourish;
  lockedSectionIds?: string[];
};

function getOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return "";
  return response.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) return [];
      return content
        .filter((part) => part && typeof part === "object" && (part as { type?: string }).type === "output_text")
        .map((part) => String((part as { text?: unknown }).text || ""));
    })
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(request: Request) {
  try {
    return await revise(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Revise failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function revise(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Add OPENAI_API_KEY in Vercel → Settings → Environment Variables." },
      { status: 503 },
    );
  }

  let body: ReviseRequest;
  try {
    body = await request.json() as ReviseRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const commentary = body.commentary?.trim() || "";
  if (!commentary) {
    return Response.json({ error: "Add commentary describing the change you want." }, { status: 400 });
  }
  if (body.section?.locked) {
    return Response.json({ error: "This section is locked. Unlock it before revising." }, { status: 409 });
  }
  if (body.section?.id && body.lockedSectionIds?.includes(body.section.id)) {
    return Response.json({ error: "This section is locked. Unlock it before revising." }, { status: 409 });
  }

  const target = body.target === "flourish" ? "flourish" : "block";
  if (target === "block" && !body.block) {
    return Response.json({ error: "A block is required." }, { status: 400 });
  }
  if (target === "flourish" && !body.flourish) {
    return Response.json({ error: "A flourish is required." }, { status: 400 });
  }

  const model = process.env.OPENAI_GENERATE_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const prompt = target === "flourish"
    ? [
      "You are revising ONE Sunday Data flourish (chart/stat/quote/table) for an editorial newsletter.",
      `TOPIC: ${body.topic || "Sunday Data issue"}`,
      `EDITOR COMMENTARY: ${commentary}`,
      "CURRENT FLOURISH JSON:",
      JSON.stringify(body.flourish, null, 2),
      "Return ONLY JSON: { \"flourish\": { ...same shape, keep the same id and sectionId... }, \"note\": \"short editor note\" }",
      "Keep id identical. Improve evidence, chart series, caption, or clarity per the commentary. Do not invent unverifiable URLs.",
    ].join("\n")
    : [
      "You are revising ONE ordered block inside a Sunday Data chapter.",
      `TOPIC: ${body.topic || "Sunday Data issue"}`,
      `SECTION: ${body.section?.eyebrow || ""} — ${body.section?.title || ""}`,
      `EDITOR COMMENTARY: ${commentary}`,
      "CURRENT BLOCK JSON:",
      JSON.stringify(body.block, null, 2),
      "Return ONLY JSON: { \"block\": { ...replacement block of same type when possible... }, \"note\": \"short editor note\" }",
      "Stay on the same story. Do not invent a new chapter. Keep memeId / flourishId references unless commentary asks otherwise.",
    ].join("\n");

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: "Return only valid JSON for a single revised newsletter segment.",
      input: prompt,
    }),
  });

  const response = await parseOpenAIJson(openAIResponse);
  if (!openAIResponse.ok) {
    const error = response.error && typeof response.error === "object"
      ? String((response.error as { message?: unknown }).message || "Revise failed.")
      : "Revise failed.";
    return Response.json({ error }, { status: openAIResponse.status });
  }

  const rawText = getOutputText(response);
  const parsed = parseJsonObject(rawText);
  if (!parsed) {
    return Response.json({ error: "Could not parse revise JSON." }, { status: 502 });
  }

  if (target === "flourish") {
    const flourishParsed = parseFlourishPayload(JSON.stringify({ flourishes: [parsed.flourish || parsed] }));
    const next = flourishParsed?.flourishes[0];
    if (!next) {
      return Response.json({ error: "Could not parse revised flourish." }, { status: 502 });
    }
    if (body.flourish?.id) next.id = body.flourish.id;
    if (body.flourish?.sectionId) next.sectionId = body.flourish.sectionId;
    return Response.json({
      flourish: next,
      note: typeof parsed.note === "string" ? parsed.note : flourishParsed?.reviewNotes || "",
      model,
      revisedAt: new Date().toISOString(),
    });
  }

  const block = parsed.block && typeof parsed.block === "object"
    ? parsed.block as SectionBlock
    : parsed as unknown as SectionBlock;
  if (!block || typeof block !== "object" || !("type" in block)) {
    return Response.json({ error: "Could not parse revised block." }, { status: 502 });
  }

  return Response.json({
    block,
    blockIndex: body.blockIndex,
    note: typeof parsed.note === "string" ? parsed.note : "",
    model,
    revisedAt: new Date().toISOString(),
  });
}
