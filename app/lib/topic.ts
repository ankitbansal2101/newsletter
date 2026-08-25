/** Shared topic helpers — safe for client + server (no Node extractors). */

export function isGenericTopicLabel(value: string): boolean {
  const normalized = value.replace(/^\uFEFF/, "").trim();
  if (!normalized) return true;
  if (/^https?:\/\//i.test(normalized)) return true;
  if (normalized.length < 4) return true;
  return /^(sunday(\s*data)?(\s*newsletter)?|the\s+sunday\s*data|newsletter|untitled( research mission)?|from( user)? source materials|mission brief|new issue|test|topic|draft|issue|week(\s*\d+)?)$/i.test(normalized);
}

/**
 * Pick the story topic for research/generate.
 * When a real manuscript exists, generic labels like "sunday newsletter" must not become the story.
 */
export function resolveStoryTopic(args: {
  userTopic?: string;
  inferredTopic?: string;
  document?: string;
}): string {
  const user = (args.userTopic || "").replace(/^\uFEFF/, "").trim();
  const inferred = (args.inferredTopic || "").replace(/^\uFEFF/, "").trim();
  const document = (args.document || "").trim();
  const hasManuscript = document.length > 200;

  const cleanInferred = inferred && !isGenericTopicLabel(inferred) && !/^https?:\/\//i.test(inferred)
    ? inferred.slice(0, 140)
    : "";
  const cleanUser = user && !isGenericTopicLabel(user) && !/^https?:\/\//i.test(user)
    ? user.slice(0, 140)
    : "";

  if (hasManuscript) {
    // Specific user angle wins; generic labels are already stripped from cleanUser.
    return cleanUser || cleanInferred || "From user source materials";
  }
  return cleanUser || cleanInferred || "From user source materials";
}

export function headingFromDocument(document: string): string {
  return document
    .split(/\n+/)
    .map((line) => line.replace(/^\uFEFF/, "").trim())
    .find((line) => line.length > 8 && !/^https?:\/\//i.test(line) && !isGenericTopicLabel(line)) || "";
}
