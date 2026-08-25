const DEFAULT_MODEL = "gpt-5.6-terra";

type AnnotateRequest = {
  passage?: string;
  highlight?: string;
  note?: string;
  mode?: "comment" | "suggest";
  sectionTitle?: string;
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

/** Minimal, advisory-only AI: a comment or a suggestion for a highlighted span.
 *  This endpoint never returns a rewritten passage; the writer applies any
 *  wording by hand. Locked passages are never sent here by the client. */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OpenAI is not configured on this server." }, { status: 503 });
  }

  let body: AnnotateRequest;
  try {
    body = await request.json() as AnnotateRequest;
  } catch {
    return Response.json({ error: "The annotation request was not valid JSON." }, { status: 400 });
  }

  const passage = body.passage?.trim();
  if (!passage) {
    return Response.json({ error: "A passage is required." }, { status: 400 });
  }
  const mode = body.mode === "suggest" ? "suggest" : "comment";
  const highlight = body.highlight?.trim() || "";
  const note = body.note?.trim() || "";

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const instructions = mode === "comment"
    ? "You are a restrained editorial margin voice for a human-authored newsletter. Respond with ONE editorial comment of at most 80 words about the passage (or the highlighted span). You must NOT rewrite, rephrase, or produce replacement text of any kind. Observations, questions, and fact-flags only. No em dashes."
    : "You are a restrained editorial margin voice for a human-authored newsletter. The writer highlighted a span and asked for a suggestion. Respond with at most 40 words proposing alternative phrasing for ONLY the highlighted span, clearly framed as a suggestion the writer may ignore. Never touch text outside the span. Never output a rewritten passage. No em dashes.";

  const input = [
    body.sectionTitle ? `SECTION: ${body.sectionTitle}` : "",
    "PASSAGE (human-authored, canonical, do not rewrite):",
    passage.slice(0, 4_000),
    highlight ? `\nHIGHLIGHTED SPAN: "${highlight.slice(0, 500)}"` : "",
    note ? `\nWRITER'S NOTE: ${note.slice(0, 500)}` : "",
  ].filter(Boolean).join("\n");

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, instructions, input }),
  });

  const response = await openAIResponse.json() as Record<string, unknown>;
  if (!openAIResponse.ok) {
    const error = response.error && typeof response.error === "object"
      ? String((response.error as { message?: unknown }).message || "The annotation could not be generated.")
      : "The annotation could not be generated.";
    return Response.json({ error }, { status: openAIResponse.status });
  }

  const text = getOutputText(response).trim();
  if (!text) {
    return Response.json({ error: "The annotation came back empty." }, { status: 502 });
  }

  return Response.json({ mode, response: text, generatedAt: new Date().toISOString() });
}
