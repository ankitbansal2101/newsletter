import type { ResearchMaterial } from "./research";

/** Build loot from a manuscript only — no web scrape. */
export function materialsFromManuscript(args: {
  document: string;
  topic: string;
  sourceUrl?: string;
  sourceTitle?: string;
}): ResearchMaterial[] {
  const { document, topic, sourceUrl, sourceTitle } = args;
  const source = sourceTitle || "Source manuscript";
  const cleaned = document.replace(/\r/g, "").trim();
  if (!cleaned) return [];

  const materials: ResearchMaterial[] = [];
  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part.length > 60);

  paragraphs.slice(0, 8).forEach((text, index) => {
    materials.push({
      id: `ms-article-${index + 1}`,
      type: "article",
      title: index === 0 ? (topic || "Manuscript opening") : `Manuscript excerpt ${index + 1}`,
      text: text.slice(0, 900),
      url: sourceUrl,
      source,
    });
  });

  const quoteHits = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /[“"]/.test(line) || /\u2014|\s—\s| — /.test(line))
    .filter((line) => line.length > 40 && line.length < 320)
    .slice(0, 5);
  quoteHits.forEach((text, index) => {
    materials.push({
      id: `ms-quote-${index + 1}`,
      type: "quote",
      title: `Manuscript quote ${index + 1}`,
      text: text.replace(/^["“]|["”]$/g, "").slice(0, 400),
      url: sourceUrl,
      source,
    });
  });

  const statPattern = /(?:^|[^\w])((?:\$)?\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(%|percent|k|m|b|bn|million|billion)?/gi;
  const seen = new Set<string>();
  let statIndex = 0;
  for (const paragraph of paragraphs) {
    for (const match of paragraph.matchAll(statPattern)) {
      if (statIndex >= 6) break;
      const token = `${match[1]}${match[2] || ""}`;
      if (seen.has(token)) continue;
      seen.add(token);
      const around = paragraph.slice(Math.max(0, (match.index || 0) - 36), (match.index || 0) + 72).replace(/\s+/g, " ").trim();
      materials.push({
        id: `ms-stat-${statIndex + 1}`,
        type: "stat",
        title: around.slice(0, 48) || `Manuscript figure ${statIndex + 1}`,
        text: around.slice(0, 220) || token,
        url: sourceUrl,
        source,
      });
      statIndex += 1;
    }
    if (statIndex >= 6) break;
  }

  const memeSeeds = [
    paragraphs[0]?.slice(0, 90),
    paragraphs[Math.min(2, paragraphs.length - 1)]?.slice(0, 90),
    paragraphs[Math.min(4, paragraphs.length - 1)]?.slice(0, 90),
  ].filter(Boolean) as string[];
  memeSeeds.slice(0, 3).forEach((seed, index) => {
    const halves = seed.includes(".") ? seed.split(".").map((part) => part.trim()).filter(Boolean) : [seed];
    materials.push({
      id: `ms-meme-${index + 1}`,
      type: "meme",
      title: `Manuscript meme ${index + 1}`,
      text: `${halves[0]?.slice(0, 70) || topic} | ${halves[1]?.slice(0, 70) || "The ritual looked right. The cargo never arrived."}`,
      source: "Manuscript beat",
    });
  });

  return materials;
}
