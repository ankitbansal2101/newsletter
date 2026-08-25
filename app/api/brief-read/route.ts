import { combineExtracted, extractFile, extractLink, inferTopic } from "../../lib/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    return await readBrief(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not read the brief.";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function readBrief(request: Request) {
  const form = await request.formData();
  const notes = String(form.get("notes") || "");
  const topicHint = String(form.get("topic") || "").trim();
  const rawLinks = String(form.get("links") || "[]");
  let links: string[] = [];
  try {
    const parsed = JSON.parse(rawLinks) as unknown;
    links = Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean).slice(0, 12) : [];
  } catch {
    links = [];
  }

  const files = form.getAll("files").filter((item): item is File => item instanceof File).slice(0, 8);
  const sources = [
    ...(await Promise.all(links.map((url) => extractLink(url)))),
    ...(await Promise.all(files.map((file) => extractFile(file)))),
  ];

  const document = combineExtracted(notes, sources);
  const topic = inferTopic(notes, sources, topicHint);
  const read = sources.filter((item) => item.ok).length;

  return Response.json({
    document,
    topic,
    sources: sources.map(({ title, kind, ok, characters, error }) => ({ title, kind, ok, characters, error })),
    read,
    total: sources.length,
  });
}
