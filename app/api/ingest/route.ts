import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

function googleDocId(value: string) {
  const match = value.match(/^https:\/\/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
}

type ForkedDraft = {
  url: string;
  documentId: string;
  importedAt: string;
  characters: number;
  text: string;
};

const forkPath = () => path.join(process.cwd(), "data", "source-draft.json");

/** Return the stored forked draft (metadata + text) so the studio can restore
 *  provenance after a reload. The original Google Doc is never written to. */
export async function GET() {
  try {
    const raw = await readFile(forkPath(), "utf-8");
    const fork = JSON.parse(raw) as ForkedDraft;
    return Response.json(fork);
  } catch {
    return Response.json({ error: "No forked draft yet." }, { status: 404 });
  }
}

export async function POST(request: Request) {
  let url = "";
  try {
    const body = await request.json() as { url?: string };
    url = body.url?.trim() || "";
  } catch {
    return Response.json({ error: "The document request was not valid JSON." }, { status: 400 });
  }

  const documentId = googleDocId(url);
  if (!documentId) {
    return Response.json({ error: "Use a Google Docs document URL." }, { status: 400 });
  }

  const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`;
  const documentResponse = await fetch(exportUrl, { redirect: "follow" });
  if (!documentResponse.ok) {
    return Response.json(
      { error: "The document could not be read. Make sure anyone with the link can view it." },
      { status: 422 },
    );
  }

  const text = (await documentResponse.text()).trim();
  if (!text || text.toLowerCase().includes("sign in") && text.length < 500) {
    return Response.json(
      { error: "The document did not return readable text. Make sure anyone with the link can view it." },
      { status: 422 },
    );
  }

  const fork: ForkedDraft = {
    url,
    documentId,
    importedAt: new Date().toISOString(),
    characters: Math.min(text.length, 100_000),
    text: text.slice(0, 100_000),
  };

  // Fork the manuscript locally. Read-only with respect to the Google Doc:
  // we only ever export a copy, never write back.
  try {
    const dataDir = path.join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });
    await writeFile(forkPath(), JSON.stringify(fork, null, 2), "utf-8");
  } catch {
    // The fork is a convenience copy; failing to persist it should not block import.
  }

  return Response.json({
    documentId,
    title: `Google Doc ${documentId.slice(0, 8)}`,
    url,
    importedAt: fork.importedAt,
    text: fork.text,
    characters: fork.characters,
  });
}
