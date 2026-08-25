import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import * as XLSX from "xlsx";

import { isGenericTopicLabel } from "./topic";

export { isGenericTopicLabel, resolveStoryTopic, headingFromDocument } from "./topic";

const USER_AGENT = "SundayDataStudio/1.0 (brief reader; newsletter research)";
const MAX_CHUNK = 24_000;

export type ExtractedSource = {
  title: string;
  kind: string;
  ok: boolean;
  characters: number;
  text: string;
  error?: string;
};

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function googleDocId(url: string) {
  return url.match(/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/)?.[1] || null;
}

function googleSheetId(url: string) {
  return url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1] || null;
}

export async function extractLink(url: string): Promise<ExtractedSource> {
  const title = url;
  try {
    const docId = googleDocId(url);
    if (docId) {
      const response = await fetch(`https://docs.google.com/document/d/${docId}/export?format=txt`, { redirect: "follow" });
      const text = (await response.text()).trim();
      if (!response.ok || !text || (text.toLowerCase().includes("sign in") && text.length < 500)) {
        return { title, kind: "google-doc", ok: false, characters: 0, text: "", error: "Google Doc is not publicly readable." };
      }
      const clipped = text.replace(/^\uFEFF/, "").slice(0, MAX_CHUNK);
      const heading = clipped.split(/\n+/).map((line) => line.trim()).find((line) => line.length > 3) || `Google Doc ${docId.slice(0, 8)}`;
      return { title: heading.slice(0, 120), kind: "google-doc", ok: true, characters: clipped.length, text: clipped };
    }

    const sheetId = googleSheetId(url);
    if (sheetId) {
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`, { redirect: "follow" });
      const text = (await response.text()).trim();
      if (!response.ok || !text) {
        return { title, kind: "google-sheet", ok: false, characters: 0, text: "", error: "Google Sheet is not publicly readable." };
      }
      const clipped = text.slice(0, MAX_CHUNK);
      return { title: `Google Sheet ${sheetId.slice(0, 8)}`, kind: "google-sheet", ok: true, characters: clipped.length, text: clipped };
    }

    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,text/plain,application/json" },
    });
    if (!response.ok) {
      return { title, kind: "website", ok: false, characters: 0, text: "", error: `Could not fetch (${response.status}).` };
    }
    const raw = await response.text();
    const type = response.headers.get("content-type") || "";
    const text = type.includes("html") ? htmlToText(raw) : raw.replace(/\s+/g, " ").trim();
    const clipped = text.slice(0, MAX_CHUNK);
    if (!clipped) return { title, kind: "website", ok: false, characters: 0, text: "", error: "Page had no readable text." };
    return { title, kind: "website", ok: true, characters: clipped.length, text: clipped };
  } catch (error) {
    return { title, kind: "website", ok: false, characters: 0, text: "", error: error instanceof Error ? error.message : "Fetch failed." };
  }
}

export async function extractFile(file: File): Promise<ExtractedSource> {
  const title = file.name;
  const name = file.name.toLowerCase();
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif|svg)$/.test(name)) {
      return {
        title,
        kind: "image",
        ok: true,
        characters: 0,
        text: `User attached image: ${file.name}. Use this as a visual in the newsletter.`,
      };
    }

    if (name.endsWith(".pdf") || file.type.includes("pdf")) {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const extracted = await extractText(pdf, { mergePages: true });
      const text = (Array.isArray(extracted.text) ? extracted.text.join("\n") : String(extracted.text || "")).trim().slice(0, MAX_CHUNK);
      if (!text) return { title, kind: "pdf", ok: false, characters: 0, text: "", error: "PDF had no extractable text." };
      return { title, kind: "pdf", ok: true, characters: text.length, text };
    }

    if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) {
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value || "").trim().slice(0, MAX_CHUNK);
      if (!text) return { title, kind: "word", ok: false, characters: 0, text: "", error: "Word file had no extractable text." };
      return { title, kind: "word", ok: true, characters: text.length, text };
    }

    if (/\.(xlsx?|csv)$/.test(name) || /spreadsheet|excel|csv/.test(file.type)) {
      if (name.endsWith(".csv") || file.type.includes("csv")) {
        const text = buffer.toString("utf8").slice(0, MAX_CHUNK);
        return { title, kind: "excel", ok: true, characters: text.length, text };
      }
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const text = workbook.SheetNames
        .map((sheet) => `Sheet: ${sheet}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[sheet] || {})}`)
        .join("\n\n")
        .slice(0, MAX_CHUNK);
      if (!text.trim()) return { title, kind: "excel", ok: false, characters: 0, text: "", error: "Spreadsheet was empty." };
      return { title, kind: "excel", ok: true, characters: text.length, text };
    }

    if (/\.(txt|md|rtf)$/.test(name) || file.type.startsWith("text/")) {
      const text = buffer.toString("utf8").replace(/\0/g, "").slice(0, MAX_CHUNK);
      return { title, kind: "text", ok: true, characters: text.length, text };
    }

    return { title, kind: "file", ok: false, characters: 0, text: "", error: "This file type cannot be read yet." };
  } catch (error) {
    return { title, kind: "file", ok: false, characters: 0, text: "", error: error instanceof Error ? error.message : "Could not read file." };
  }
}

export function combineExtracted(notes: string, sources: ExtractedSource[]) {
  const blocks = [];
  if (notes.trim()) blocks.push(`USER NOTES:\n${notes.trim().slice(0, 40_000)}`);
  for (const source of sources) {
    if (!source.ok || !source.text) continue;
    blocks.push(`SOURCE (${source.kind}) ${source.title}:\n${source.text}`);
  }
  return blocks.join("\n\n---\n\n").slice(0, 80_000);
}

/** Infer a human topic from notes + extracted sources. Never returns a bare URL. */
export function inferTopic(notes: string, sources: ExtractedSource[], fallback = ""): string {
  const clean = (value: string) => value.replace(/^https?:\/\/\S+/i, "").replace(/^\uFEFF/, "").trim();
  const sourceTitles = sources
    .filter((item) => item.ok)
    .map((item) => clean(item.title))
    .filter((title) => title && !isGenericTopicLabel(title) && !/^https?:\/\//i.test(title));
  const noteLines = notes
    .split(/\n+/)
    .map((line) => clean(line))
    .filter((line) => line.length > 8 && !/^https?:\/\//i.test(line) && !isGenericTopicLabel(line));
  const fallbackClean = clean(fallback);

  const candidates = [
    ...sourceTitles,
    ...noteLines,
    ...(!isGenericTopicLabel(fallbackClean) ? [fallbackClean] : []),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.length < 4) continue;
    return candidate.slice(0, 140);
  }

  const body = sources.find((item) => item.ok && item.text)?.text || notes;
  const line = body
    .split(/\n+/)
    .map((part) => part.replace(/^\uFEFF/, "").trim())
    .find((part) => part.length > 12 && !/^https?:\/\//i.test(part) && !isGenericTopicLabel(part));
  return (line || (!isGenericTopicLabel(fallbackClean) ? fallbackClean : "") || "Untitled research mission").slice(0, 140);
}
