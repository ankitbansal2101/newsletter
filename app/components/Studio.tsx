"use client";

import { useEffect, useMemo, useState } from "react";

import { NEWSLETTER_TEMPLATES, getTemplate, type TemplateId } from "../templates/registry";
import type { PublishedIssue } from "../templates/types";
import type { Flourish } from "../lib/flourishes";
import { isGenericTopicLabel, resolveStoryTopic } from "../lib/topic";
import { materialsFromManuscript } from "../lib/manuscript";
import type { ResearchMaterial } from "../lib/research";

const FLOW_STEPS = [
  { id: 1 as const, label: "Brief", verb: "Set the mission" },
  { id: 2 as const, label: "Loot", verb: "Collect evidence" },
  { id: 3 as const, label: "Forge", verb: "Pick template & build" },
];

const COMPONENT_OPTIONS = [
  { id: "text", label: "Stories", description: "Narrative passages" },
  { id: "images", label: "Images", description: "Photos & figures" },
  { id: "stats", label: "Stats", description: "Numbers & charts" },
  { id: "quotes", label: "Quotes", description: "Attributed lines" },
  { id: "memes", label: "Memes", description: "Topic-grounded jokes" },
] as const;

type GeneratedIssue = {
  title: PublishedIssue["title"];
  dek: PublishedIssue["dek"];
  sectionsEn: PublishedIssue["sectionsEn"];
  sectionsJa: PublishedIssue["sectionsJa"];
  flourishes: Flourish[];
  memes: PublishedIssue["memes"];
};

type GeneratedPayload = {
  issue?: GeneratedIssue;
  flourishes?: Flourish[];
  research?: string;
  citations?: Array<{ title: string; url: string }>;
  model?: string;
  generatedAt?: string;
  error?: string;
};

type BriefLink = {
  id: string;
  url: string;
  kind: "google-doc" | "website";
};

type BriefFile = {
  id: string;
  name: string;
  kind: "pdf" | "word" | "excel" | "image" | "file";
  size: number;
  file: File;
  preview?: string;
};

function classifyLink(url: string): BriefLink["kind"] {
  return /docs\.google\.com|drive\.google\.com/i.test(url) ? "google-doc" : "website";
}

function classifyFile(file: File): BriefFile["kind"] {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif|svg)$/.test(name)) return "image";
  if (file.type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (/spreadsheet|excel/.test(file.type) || /\.(xlsx?|csv)$/.test(name)) return "excel";
  if (/word|msword|officedocument\.word/.test(file.type) || /\.(docx?|rtf)$/.test(name)) return "word";
  return "file";
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKindLabel(kind: BriefFile["kind"]) {
  return { pdf: "PDF", word: "Word", excel: "Excel", image: "Image", file: "File" }[kind];
}

export default function Studio() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [viewMode, setViewMode] = useState<"studio" | "preview">("studio");
  const [topic, setTopic] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [links, setLinks] = useState<BriefLink[]>([]);
  const [attachments, setAttachments] = useState<BriefFile[]>([]);
  const [extractedDocument, setExtractedDocument] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState("");
  const [materials, setMaterials] = useState<ResearchMaterial[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [components, setComponents] = useState<string[]>(["text", "images", "stats", "quotes", "memes"]);
  const [notice, setNotice] = useState("Mission brief open. Name a topic to begin the hunt.");
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<GeneratedPayload | null>(null);
  const [materialFilter, setMaterialFilter] = useState<"all" | ResearchMaterial["type"]>("all");
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [pendingPdf, setPendingPdf] = useState(false);
  /** When false, skip web scrape and convert the manuscript into a visual issue. */
  const [scrapeWeb, setScrapeWeb] = useState(true);
  const activeTemplate = getTemplate(templateId);
  const Template = activeTemplate.Component;

  const selectedMaterials = useMemo(
    () => materials.filter((item) => selectedIds.includes(item.id)),
    [materials, selectedIds],
  );

  const counts = useMemo(() => ({
    article: materials.filter((m) => m.type === "article").length,
    quote: materials.filter((m) => m.type === "quote").length,
    stat: materials.filter((m) => m.type === "stat").length,
    image: materials.filter((m) => m.type === "image").length,
    meme: materials.filter((m) => m.type === "meme").length,
  }), [materials]);

  const visibleMaterials = useMemo(
    () => (materialFilter === "all" ? materials : materials.filter((m) => m.type === materialFilter)),
    [materialFilter, materials],
  );

  const pendingLink = (() => {
    const raw = linkDraft.trim();
    if (!raw) return "";
    try {
      const parsed = new URL(raw);
      return /^https?:$/.test(parsed.protocol) ? parsed.toString() : "";
    } catch {
      return "";
    }
  })();
  const topicAsLink = (() => {
    const raw = topic.trim();
    if (!/^https?:\/\//i.test(raw)) return "";
    try {
      return new URL(raw).toString();
    } catch {
      return "";
    }
  })();
  const briefReady = Boolean(
    (topic.trim() && !topicAsLink)
    || documentText.trim()
    || links.length
    || attachments.length
    || pendingLink
    || topicAsLink,
  );
  const briefContext = useMemo(() => {
    const parts = [documentText.trim()];
    if (links.length) parts.push(`Reference links:\n${links.map((item) => item.url).join("\n")}`);
    if (attachments.length) parts.push(`Attached files: ${attachments.map((item) => item.name).join(", ")}`);
    return parts.filter(Boolean).join("\n\n");
  }, [documentText, links, attachments]);

  const sourceDocument = extractedDocument.trim() || briefContext;
  const xp = Math.min(100, (topic.trim() ? 20 : 0) + (documentText.trim() ? 10 : 0) + links.length * 4 + attachments.length * 4 + selectedIds.length * 4 + (generated?.issue ? 30 : 0));

  function addLink() {
    const url = linkDraft.trim();
    if (!url) return;
    try {
      const parsed = new URL(url.includes("://") ? url : `https://${url}`);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error("Use an http(s) link.");
      const href = parsed.toString();
      if (links.some((item) => item.url === href)) {
        setLinkDraft("");
        return;
      }
      setLinks((current) => [...current, { id: `link-${Date.now()}`, url: href, kind: classifyLink(href) }]);
      setLinkDraft("");
      setError("");
    } catch {
      setError("Add a full link, like https://example.com or a Google Doc URL.");
    }
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next: BriefFile[] = [];
    for (const file of Array.from(fileList)) {
      next.push({
        id: `file-${file.name}-${file.size}-${Date.now()}-${next.length}`,
        name: file.name,
        kind: classifyFile(file),
        size: file.size,
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      });
    }
    setAttachments((current) => [...current, ...next]);
    setError("");
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return current.filter((item) => item.id !== id);
    });
  }

  function commitLinksFromDrafts(): BriefLink[] {
    const next = [...links];
    const push = (href: string) => {
      if (!href || next.some((item) => item.url === href)) return;
      next.push({ id: `link-${Date.now()}-${next.length}`, url: href, kind: classifyLink(href) });
    };
    if (pendingLink) push(pendingLink);
    if (topicAsLink) push(topicAsLink);
    if (next.length !== links.length) setLinks(next);
    if (pendingLink) setLinkDraft("");
    if (topicAsLink) setTopic("");
    return next;
  }

  async function runResearch() {
    const effectiveLinks = commitLinksFromDrafts();
    const hasBrief = Boolean(
      (topic.trim() && !topicAsLink)
      || documentText.trim()
      || effectiveLinks.length
      || attachments.length,
    );
    if (!hasBrief) {
      setError("Add a Google Doc / link, some text, an attachment, or a specific working title first.");
      return;
    }
    setIsResearching(true);
    setError("");
    setNotice(scrapeWeb ? "Reading your brief, then scouting the web…" : "Reading your manuscript — no web scrape…");
    setGenerated(null);
    try {
      const form = new FormData();
      form.set("notes", documentText.trim());
      form.set("topic", topicAsLink ? "" : topic.trim());
      form.set("links", JSON.stringify(effectiveLinks.map((item) => item.url)));
      for (const item of attachments) form.append("files", item.file, item.name);
      const extracted = await fetch("/api/brief-read", { method: "POST", body: form }).then((response) => response.json()) as {
        document?: string;
        topic?: string;
        read?: number;
        total?: number;
        sources?: Array<{ title: string; ok: boolean; kind?: string; error?: string }>;
        error?: string;
      };
      const document = extracted.document?.trim() || briefContext;
      if (!document.trim()) {
        throw new Error("Could not read any manuscript text from the brief.");
      }
      const inferredTopic = (extracted.topic || "").trim();
      const storyTopic = resolveStoryTopic({
        userTopic: topicAsLink ? "" : topic.trim(),
        inferredTopic,
        document,
      });
      if (storyTopic && storyTopic !== "From user source materials" && (topicAsLink || isGenericTopicLabel(topic) || !topic.trim())) {
        setTopic(storyTopic);
      }
      setExtractedDocument(document);
      const failed = (extracted.sources || []).filter((item) => !item.ok);
      if (failed.length) {
        setNotice(`Read ${extracted.read || 0} of ${extracted.total || 0} sources. Some files/links could not be opened.`);
      }

      const sourceTitle = extracted.sources?.find((item) => item.ok)?.title || "User brief";
      const manuscriptLoot = materialsFromManuscript({
        document,
        topic: storyTopic,
        sourceUrl: effectiveLinks[0]?.url,
        sourceTitle,
      });
      const attachedImages: ResearchMaterial[] = attachments
        .filter((item) => item.kind === "image" && item.preview)
        .map((item) => ({
          id: `attach-${item.id}`,
          type: "image" as const,
          title: item.name,
          imageUrl: item.preview,
          credit: "User attachment",
          source: "Brief attachment",
        }));

      let webMaterials: ResearchMaterial[] = [];
      let researchSummary = scrapeWeb
        ? ""
        : `Manuscript-only conversion of “${storyTopic}”. Visuals, memes, and charts are derived from the document — no live web scrape.`;

      if (scrapeWeb) {
        const response = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: storyTopic, document }),
        });
        const result = await response.json() as {
          materials?: ResearchMaterial[];
          summary?: string;
          topic?: string;
          error?: string;
        };
        if (response.ok && result.materials?.length) {
          webMaterials = result.materials;
          researchSummary = result.summary || "";
          if (result.topic && !isGenericTopicLabel(result.topic) && (topicAsLink || isGenericTopicLabel(topic) || !topic.trim())) {
            setTopic(result.topic);
          }
        } else {
          researchSummary = result.summary || "Web research was thin — using your manuscript as the primary source.";
        }
      }

      const merged = scrapeWeb
        ? [...manuscriptLoot, ...attachedImages, ...webMaterials]
        : [...manuscriptLoot, ...attachedImages];
      if (!merged.length) {
        throw new Error("No usable manuscript material found. Check the Doc is shareable or paste more text.");
      }

      setSummary(researchSummary);
      setMaterials(merged);
      const auto = scrapeWeb
        ? [
          ...manuscriptLoot.map((item) => item.id),
          ...attachedImages.map((item) => item.id),
          ...webMaterials.filter((m) => m.type === "article").slice(0, 4).map((m) => m.id),
          ...webMaterials.filter((m) => m.type === "stat").slice(0, 3).map((m) => m.id),
          ...webMaterials.filter((m) => m.type === "quote").slice(0, 2).map((m) => m.id),
          ...webMaterials.filter((m) => m.type === "image").slice(0, 2).map((m) => m.id),
          ...webMaterials.filter((m) => m.type === "meme").slice(0, 2).map((m) => m.id),
        ]
        : merged.map((item) => item.id);
      setSelectedIds([...new Set(auto)]);
      setMaterialFilter("all");
      setComponents((current) => {
        const next = new Set(current);
        ["text", "images", "stats", "quotes", "memes"].forEach((id) => next.add(id));
        return [...next];
      });
      if (!scrapeWeb) setTemplateId("living");
      setStep(2);
      setNotice(
        scrapeWeb
          ? `Grounded in your brief · ${merged.length} finds ready in loot`
          : `Manuscript mode · ${merged.length} beats ready — forge a visual Living issue`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed.");
      setNotice("Scout run failed.");
    } finally {
      setIsResearching(false);
    }
  }

  function toggleMaterial(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setGenerated(null);
  }

  function toggleComponent(id: string) {
    setComponents((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setGenerated(null);
  }

  async function generateNewsletter() {
    if (!selectedMaterials.length) {
      setError("Collect at least one material.");
      return;
    }
    if (!components.length) {
      setError("Equip at least one component.");
      return;
    }
    setIsGenerating(true);
    setError("");
    setNotice("Forging the issue from your loot…");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: resolveStoryTopic({
            userTopic: topic.trim(),
            document: sourceDocument,
          }),
          document: sourceDocument,
          components,
          materials: selectedMaterials,
          scrapeWeb,
        }),
      });
      const result = await response.json() as GeneratedPayload;
      if (!response.ok || !result.issue) {
        throw new Error(result.error || "Generation failed.");
      }
      setGenerated(result);
      setStep(3);
      setNotice(
        components.includes("memes")
          ? `Issue forged with ${(result.issue.memes || []).filter((m) => m.format !== "image").length || (result.issue.memes || []).length} auto memes. Open the record.`
          : "Issue forged. Open the record.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setNotice("Forge failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  const previewIssue: PublishedIssue | null = generated?.issue
    ? {
        meta: {
          cycle: 6,
          week: Number(new Date().toISOString().slice(8, 10)) || 1,
          publishedAt: generated.generatedAt || new Date().toISOString(),
          templateId,
        },
        title: generated.issue.title,
        dek: generated.issue.dek,
        sectionsEn: generated.issue.sectionsEn,
        sectionsJa: generated.issue.sectionsJa,
        stats: {
          records: selectedMaterials.length,
          sources: selectedMaterials.filter((m) => m.url).length,
          topics: 1,
          ingredients: components.length,
        },
        memes: generated.issue.memes || [],
        flourishes: generated.issue.flourishes || generated.flourishes || [],
        research: generated.research
          ? { text: generated.research, citations: generated.citations || [] }
          : null,
      }
    : null;

  async function publishIssue() {
    if (!previewIssue) return;
    setNotice("Publishing…");
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(previewIssue),
      });
      setNotice(response.ok ? "Published" : "Publish failed");
    } catch {
      setNotice("Publish failed");
    }
  }

  function printEdition() {
    if (!previewIssue) return;
    const previous = document.title;
    const slug = previewIssue.title.en.replace(/[^\w\s-]+/g, "").trim().slice(0, 72) || "Sunday-Data-edition";
    document.title = slug;
    document.body.classList.add("is-printing");
    const restore = () => {
      document.title = previous;
      document.body.classList.remove("is-printing");
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.setTimeout(() => window.print(), 50);
  }

  function downloadPdf() {
    if (!previewIssue) return;
    if (viewMode !== "preview") {
      setViewMode("preview");
      setPendingPdf(true);
      setNotice("Preparing PDF…");
      return;
    }
    printEdition();
  }

  useEffect(() => {
    if (!pendingPdf || viewMode !== "preview" || !previewIssue) return;
    const timer = window.setTimeout(() => {
      printEdition();
      setPendingPdf(false);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [pendingPdf, viewMode, previewIssue]);

  return (
    <main className={`quest-shell ${viewMode === "preview" ? "is-previewing" : ""}`}>
      <header className="quest-topbar">
        <div className="brand-lockup">
          <span className="ostrich-mark" aria-hidden="true">S</span>
          <div><strong>Sunday Data</strong><span>Issue forge</span></div>
        </div>

        <div className="quest-xp" aria-label="Progress">
          <span>Run power</span>
          <div className="quest-xp-track"><i style={{ width: `${xp}%` }} /></div>
          <b>{xp}</b>
        </div>

        <div className="issue-meta">
          {viewMode === "preview" ? (
            <>
              <button className="quiet-button" type="button" onClick={() => setViewMode("studio")}>Back to forge</button>
              <button className="quiet-button" type="button" onClick={downloadPdf}>Download PDF</button>
              <button className="quest-cta" type="button" onClick={publishIssue}>Publish</button>
            </>
          ) : (
            <>
              {previewIssue && (
                <>
                  <button className="quiet-button" type="button" onClick={downloadPdf}>Download PDF</button>
                  <button className="quest-cta" type="button" onClick={() => setViewMode("preview")}>
                    Open record
                  </button>
                </>
              )}
              <button className="quiet-button" type="button" onClick={() => { fetch("/api/auth", { method: "DELETE", credentials: "same-origin" }).then(() => { window.location.href = "/"; }); }}>
                Sign out
              </button>
            </>
          )}
        </div>
      </header>

      {viewMode !== "preview" && (
        <nav className="quest-path" aria-label="Mission path">
          {FLOW_STEPS.map((item, index) => {
            const state = step > item.id ? "cleared" : step === item.id ? "active" : "locked";
            return (
              <button
                key={item.id}
                type="button"
                className={`quest-node ${state}`}
                onClick={() => {
                  if (item.id === 1 || (item.id === 2 && materials.length) || (item.id === 3 && selectedIds.length)) {
                    setViewMode("studio");
                    setStep(item.id);
                  }
                }}
              >
                <span className="quest-node-index">{item.id}</span>
                <span className="quest-node-copy">
                  <strong>{item.label}</strong>
                  <small>{item.verb}</small>
                </span>
                {index < FLOW_STEPS.length - 1 && <i className="quest-bridge" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>
      )}

      {viewMode !== "preview" && (
        <div className="quest-ticker" role="status" onClick={() => setNotice("")}>{notice}</div>
      )}
      {viewMode !== "preview" && error && <div className="quest-alert" role="alert">{error}</div>}

      {viewMode === "preview" && previewIssue && (
        <div className="quest-preview-frame">
          <Template key={templateId} issue={previewIssue} mode="studio" />
        </div>
      )}

      {viewMode === "studio" && (
        <section className={`quest-stage stage-${step}`}>
          {step === 1 && (
            <div className="quest-board stage-brief">
              <div className="quest-hero">
                <p className="quest-chip">Step 1 · Brief</p>
                <h1>What should we build?</h1>
                <p>
                  Add a Doc, notes, or files. Choose whether to enrich with live web research, or convert the manuscript straight into a visual newsletter.
                </p>
              </div>

              <div className="brief-stack">
                <section className="brief-card">
                  <p className="brief-card-kicker">1 · Topic</p>
                  <h2>Name the subject</h2>
                  <label className="mission-input">
                    <span>Working title (optional)</span>
                    <input
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      placeholder="Optional — a Google Doc alone is enough"
                      autoFocus
                    />
                    <small>Optional. Paste your Doc under Links below. Labels like “sunday newsletter” are ignored when a manuscript is attached.</small>
                  </label>
                </section>

                <section className="brief-card">
                  <p className="brief-card-kicker">2 · Text</p>
                  <h2>Add notes or a draft</h2>
                  <label className="mission-input">
                    <span>Your text</span>
                    <textarea
                      rows={7}
                      value={documentText}
                      onChange={(event) => setDocumentText(event.target.value)}
                      placeholder="Paste a brief, outline, quotes, or anything you want in the issue…"
                    />
                  </label>
                </section>

                <section className="brief-card">
                  <p className="brief-card-kicker">3 · Links</p>
                  <h2>Google Doc, website, or any URL</h2>
                  <p className="brief-help">Google Docs and websites are fetched when you continue. Docs must be viewable by anyone with the link.</p>
                  <div className="brief-add-row">
                    <input
                      value={linkDraft}
                      onChange={(event) => setLinkDraft(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLink(); } }}
                      placeholder="https://docs.google.com/… or https://example.com"
                    />
                    <button type="button" className="quiet-button" onClick={addLink}>Add link</button>
                  </div>
                  {!!links.length && (
                    <ul className="brief-chip-list">
                      {links.map((item) => (
                        <li key={item.id}>
                          <em>{item.kind === "google-doc" ? "Google Doc" : "Website"}</em>
                          <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
                          <button type="button" onClick={() => setLinks((current) => current.filter((link) => link.id !== item.id))} aria-label="Remove link">×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="brief-card">
                  <p className="brief-card-kicker">4 · Attachments</p>
                  <h2>Excel, PDF, Word, or images</h2>
                  <p className="brief-help">PDF, Word (.docx), Excel, CSV, and images are read when you continue.</p>
                  <label className="brief-drop">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.png,.jpg,.jpeg,.gif,.webp,.avif"
                      onChange={(event) => {
                        addFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                    <strong>Choose files</strong>
                    <span>PDF, Word, Excel, CSV, or images</span>
                  </label>
                  {!!attachments.length && (
                    <ul className="brief-file-list">
                      {attachments.map((item) => (
                        <li key={item.id}>
                          {item.preview ? <img src={item.preview} alt="" /> : <b>{fileKindLabel(item.kind)}</b>}
                          <div>
                            <strong>{item.name}</strong>
                            <span>{fileKindLabel(item.kind)} · {formatBytes(item.size)}</span>
                          </div>
                          <button type="button" onClick={() => removeAttachment(item.id)} aria-label={`Remove ${item.name}`}>×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="brief-card">
                  <p className="brief-card-kicker">5 · Research mode</p>
                  <h2>How should we build this issue?</h2>
                  <p className="brief-help">Pick one. You can change this before continuing.</p>
                  <div className="research-mode-grid" role="radiogroup" aria-label="Research mode">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={scrapeWeb}
                      className={`research-mode-option ${scrapeWeb ? "chosen" : ""}`}
                      onClick={() => setScrapeWeb(true)}
                    >
                      <em>Recommended</em>
                      <strong>Scrape the web</strong>
                      <span>Read your brief, then pull live articles, stats, quotes, and images that match the same story.</span>
                      <ul>
                        <li>Google Doc + current web coverage</li>
                        <li>Richer source ledger</li>
                        <li>Best when the topic is still moving</li>
                      </ul>
                      {scrapeWeb && <b className="research-mode-mark">Selected</b>}
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!scrapeWeb}
                      className={`research-mode-option ${!scrapeWeb ? "chosen" : ""}`}
                      onClick={() => setScrapeWeb(false)}
                    >
                      <em>Offline convert</em>
                      <strong>Manuscript only</strong>
                      <span>Do not scrape the internet. Turn the Doc into a visual Living newsletter with memes, charts, and callouts from the text alone.</span>
                      <ul>
                        <li>No live web search</li>
                        <li>Faster, stays on your draft</li>
                        <li>Defaults to Living field guide</li>
                      </ul>
                      {!scrapeWeb && <b className="research-mode-mark">Selected</b>}
                    </button>
                  </div>
                </section>
              </div>

              <aside className="brief-summary">
                <p className="quest-chip">Ready check</p>
                <ul className="brief-summary-list">
                  <li className={(topic.trim() && !topicAsLink) ? "on" : ""}>
                    Topic {(topic.trim() && !topicAsLink) ? "added" : "optional"}
                  </li>
                  <li className={documentText.trim() ? "on" : ""}>Text {documentText.trim() ? "added" : "empty"}</li>
                  <li className={(links.length || pendingLink || topicAsLink) ? "on" : ""}>
                    {(links.length || (pendingLink || topicAsLink ? 1 : 0))} link{(links.length + (pendingLink || topicAsLink ? 1 : 0)) === 1 ? "" : "s"}
                    {pendingLink || topicAsLink ? " ready" : ""}
                  </li>
                  <li className={attachments.length ? "on" : ""}>{attachments.length} attachment{attachments.length === 1 ? "" : "s"}</li>
                  <li className="on">
                    Mode · {scrapeWeb ? "Scrape the web" : "Manuscript only"}
                  </li>
                </ul>
                <p className="brief-summary-hint">
                  {briefReady
                    ? scrapeWeb
                      ? "Next: read your sources and collect web loot."
                      : "Next: convert the manuscript into a visual issue — no web scrape."
                    : "Add a Google Doc, notes, or a file before continuing."}
                </p>
                <button
                  className="quest-cta quest-cta-xl"
                  type="button"
                  disabled={isResearching || !briefReady}
                  onClick={runResearch}
                >
                  {isResearching
                    ? (scrapeWeb ? "Finding loot…" : "Reading manuscript…")
                    : (scrapeWeb ? "Continue to loot" : "Convert manuscript")}
                  <span>→</span>
                </button>
              </aside>
            </div>
          )}

          {step === 2 && (
            <div className="quest-board stage-loot">
              <div className="loot-head">
                <div>
                  <p className="quest-chip">Mission 02 · Loot</p>
                  <h1>{scrapeWeb ? "Collect your evidence." : "Review manuscript beats."}</h1>
                  {summary && <p className="loot-summary">{summary}</p>}
                  {!scrapeWeb && (
                    <p className="loot-summary">
                      Web scrape is off. These cards are carved from your Doc — forge next for memes, charts, and Living motion.
                    </p>
                  )}
                </div>
                <div className="loot-score">
                  <strong>{selectedIds.length}</strong>
                  <span>collected</span>
                  <em>of {materials.length}</em>
                </div>
              </div>

              {(links.length > 0 || attachments.length > 0 || documentText.trim()) && (
                <div className="brief-pack">
                  <span>Carried from brief</span>
                  {topic.trim() && <em>Topic</em>}
                  {documentText.trim() && <em>Text</em>}
                  {links.map((item) => (
                    <em key={item.id}>{item.kind === "google-doc" ? "Google Doc" : "Link"}</em>
                  ))}
                  {attachments.map((item) => (
                    <em key={item.id}>{item.name}</em>
                  ))}
                </div>
              )}

              <div className="loadout-row" aria-label="Equip components">
                {COMPONENT_OPTIONS.map((option) => {
                  const on = components.includes(option.id);
                  return (
                    <button key={option.id} type="button" className={`loadout-chip ${on ? "on" : ""}`} onClick={() => toggleComponent(option.id)}>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </button>
                  );
                })}
              </div>

              {components.includes("memes") && (
                <div className="meme-belt meme-belt-auto">
                  <p className="quest-chip">Memes</p>
                  <p className="meme-auto-note">
                    When you forge, the studio writes 2–4 memes from this issue&apos;s arguments (drake / two-panel / impact formats). Loot meme concepts are used as seeds. No static template images.
                  </p>
                </div>
              )}

              <div className="loot-filters">
                {([
                  ["all", `All ${materials.length}`],
                  ["article", `Text ${counts.article}`],
                  ["image", `Images ${counts.image}`],
                  ["stat", `Stats ${counts.stat}`],
                  ["quote", `Quotes ${counts.quote}`],
                  ["meme", `Memes ${counts.meme}`],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={materialFilter === id ? "on" : ""}
                    onClick={() => setMaterialFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="loot-grid">
                {visibleMaterials.map((material) => {
                  const on = selectedIds.includes(material.id);
                  return (
                    <button
                      key={material.id}
                      type="button"
                      className={`loot-card type-${material.type} ${on ? "chosen" : ""}`}
                      onClick={() => toggleMaterial(material.id)}
                    >
                      <div className="loot-card-top">
                        <em>{material.type}</em>
                        <b className="loot-check">{on ? "IN" : "+"}</b>
                      </div>
                      {material.imageUrl && <img src={material.imageUrl} alt={material.title} />}
                      <strong>{material.title}</strong>
                      {material.text && <p>{material.text.slice(0, 160)}{material.text.length > 160 ? "…" : ""}</p>}
                      <span className="loot-source">{material.source || material.credit || "web"}</span>
                    </button>
                  );
                })}
              </div>

              <footer className="quest-footer">
                <button className="quiet-button" type="button" onClick={() => setStep(1)}>Back</button>
                <button className="quiet-button" type="button" onClick={runResearch} disabled={isResearching}>
                  {isResearching ? "Rescanning…" : "Rescan web"}
                </button>
                <button
                  className="quest-cta"
                  type="button"
                  disabled={!selectedIds.length}
                  onClick={() => setStep(3)}
                >
                  Next
                  <span>→</span>
                </button>
              </footer>
            </div>
          )}

          {step === 3 && (
            <div className="quest-board stage-forge">
              <div className="forge-layout forge-layout-template">
                <div className="forge-main">
                  <p className="quest-chip">Mission 03 · Forge</p>
                  <h1>Choose a template.</h1>
                  <p className="lede">
                    Pick how the issue should feel, then forge. Loot stays the same — only the presentation changes.
                  </p>

                  <div className="forge-target">
                    <span>Target</span>
                    <strong>{topic || "From field notes"}</strong>
                  </div>

                  <div className="template-picker template-picker-hero" role="radiogroup" aria-label="Issue template">
                    <div className="template-picker-grid">
                      {NEWSLETTER_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          role="radio"
                          aria-checked={templateId === template.id}
                          className={`template-option mood-${template.mood} ${templateId === template.id ? "chosen" : ""}`}
                          onClick={() => setTemplateId(template.id)}
                        >
                          <em>{template.mood === "interactive" ? "Animated" : "Print"}</em>
                          <strong>{template.name}</strong>
                          <span>{template.tagline}</span>
                          {templateId === template.id && <b className="template-chosen-mark">Selected</b>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="forge-meters">
                    <div><b>{selectedMaterials.length}</b><span>materials</span></div>
                    <div><b>{components.length}</b><span>components</span></div>
                    <div><b>{components.includes("memes") ? "auto" : "off"}</b><span>memes</span></div>
                    <div><b>{activeTemplate.name.split(" ")[0]}</b><span>template</span></div>
                  </div>

                  <div className="forge-actions">
                    <button className="quiet-button" type="button" onClick={() => setStep(2)}>Back</button>
                    <button
                      className="quest-cta quest-cta-xl"
                      type="button"
                      disabled={isGenerating || !selectedMaterials.length}
                      onClick={generateNewsletter}
                    >
                      {isGenerating ? "Forging…" : generated?.issue ? "Forge again" : `Forge with ${activeTemplate.name}`}
                      <span>{isGenerating ? "…" : "→"}</span>
                    </button>
                    {generated?.issue && (
                      <>
                        <button className="quest-cta secondary" type="button" onClick={() => setViewMode("preview")}>
                          Open record
                        </button>
                        <button className="quiet-button" type="button" onClick={downloadPdf}>Download PDF</button>
                      </>
                    )}
                  </div>
                </div>

                <aside className="forge-inventory">
                  <p className="quest-chip">Inventory</p>
                  <h2>Selected loot</h2>
                  <ul>
                    {selectedMaterials.slice(0, 14).map((material) => (
                      <li key={material.id}>
                        <em>{material.type}</em>
                        <span>{material.title}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="forge-ready">
                    <strong>Template</strong>
                    <p>{activeTemplate.name}</p>
                    <small>{activeTemplate.tagline}</small>
                  </div>
                  {generated?.issue && (
                    <div className="forge-ready">
                      <strong>Record ready</strong>
                      <p>{generated.issue.title.en}</p>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
