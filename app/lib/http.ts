/** Parse a fetch Response as JSON. Vercel crashes often return HTML/text like "An error occurred…". */
export async function parseApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`Empty response from server (${response.status}).`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 220);
    if (response.status === 504 || /^An error/i.test(snippet) || /FUNCTION_INVOCATION/i.test(snippet)) {
      throw new Error(
        "Vercel timed out forging the issue. Redeploy the latest code (Forge no longer web-searches). If it still times out, use a faster OPENAI_MODEL or a plan with a longer function limit.",
      );
    }
    throw new Error(`Server returned non-JSON (${response.status}): ${snippet}`);
  }
}

export async function parseOpenAIJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`OpenAI returned non-JSON (${response.status}): ${text.slice(0, 240)}`);
  }
}
