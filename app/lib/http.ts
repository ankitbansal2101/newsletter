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
    if (/^An error/i.test(snippet) || /FUNCTION_INVOCATION/i.test(snippet)) {
      throw new Error(
        "Vercel killed this request before it could return JSON. Typical causes: missing OPENAI_API_KEY / OPENAI_MODEL in the Vercel project, a timeout, or a body over ~4.5MB. Check Vercel → Logs.",
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
