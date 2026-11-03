"use client";

import { useMemo, useState, type FormEvent } from "react";

import type { IssueCitation, PublishedIssue, DraftSection } from "../templates/types";

type Answer = {
  role: "user" | "assistant";
  content: string;
  sectionIds?: string[];
  citations?: IssueCitation[];
};

type Props = {
  issue: PublishedIssue;
  sections: DraftSection[];
  language: "EN" | "JA";
};

function sectionContent(section: DraftSection) {
  const blockText = (section.blocks || []).flatMap((block) => {
    if (block.type === "prose") return block.paragraphs;
    if (block.type === "quote") return [block.text, block.attribution || ""];
    if (block.type === "callout") return [block.kicker, block.title, block.body, ...(block.points || [])];
    if (block.type === "image") return [block.title || "", block.caption || ""];
    return [];
  });
  return [section.eyebrow, section.title, section.subtitle || "", ...section.paragraphs, ...blockText]
    .filter(Boolean)
    .join("\n")
    .slice(0, 5_000);
}

export default function AskIssue({ issue, sections, language }: Props) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Answer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sectionById = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections]);
  const japanese = language === "JA";
  const suggestions = japanese
    ? ["この記事の要点は？", "この数字は何を示していますか？", "次に読むべき章は？"]
    : ["What is the main takeaway?", "What does this number mean?", "Which chapter should I read next?"];

  async function ask(nextQuestion: string) {
    const clean = nextQuestion.trim();
    if (!clean || busy) return;
    const previousMessages = messages;
    setMessages((current) => [...current, { role: "user", content: clean }]);
    setQuestion("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/ask-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: clean,
          language,
          newsletter: {
            title: japanese ? issue.title.ja : issue.title.en,
            sections: sections.map((section) => ({ id: section.id, title: section.title, text: sectionContent(section) })),
            citations: issue.research?.citations || [],
          },
          history: previousMessages.slice(-6).map((message) => ({ role: message.role, content: message.content })),
        }),
      });
      const result = await response.json() as {
        answer?: string;
        sectionIds?: string[];
        citations?: IssueCitation[];
        error?: string;
      };
      if (!response.ok || !result.answer) throw new Error(result.error || "Could not get an answer.");
      setMessages((current) => [...current, {
        role: "assistant",
        content: result.answer as string,
        sectionIds: result.sectionIds || [],
        citations: result.citations || [],
      }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not get an answer.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className="ask-issue-root">
      <button className="ask-issue-launcher" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span aria-hidden="true">✳</span>{japanese ? "この記事に質問" : "Ask this issue"}
      </button>
      {open && (
        <aside className="ask-issue-panel" aria-label={japanese ? "記事への質問" : "Ask the newsletter"}>
          <header>
            <div>
              <span>{japanese ? "読者ガイド" : "READER GUIDE"}</span>
              <strong>{japanese ? "この記事について聞く" : "Ask anything about this issue"}</strong>
              <p>{japanese ? "回答はこの記事の内容に基づきます。" : "Answers are grounded in this issue and link back to the source."}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={japanese ? "閉じる" : "Close guide"}>×</button>
          </header>
          <div className="ask-issue-messages" aria-live="polite">
            {!messages.length && (
              <div className="ask-issue-welcome">
                <p>{japanese ? "どこから読み始めるか迷っていますか？記事の内容について質問してください。" : "Want to unpack a claim or find where a point comes from? Ask a question about the issue."}</p>
                <div>{suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" disabled={busy} onClick={() => void ask(suggestion)}>{suggestion}</button>
                ))}</div>
              </div>
            )}
            {messages.map((message, index) => (
              <article className={`ask-issue-message ${message.role}`} key={`${message.role}-${index}`}>
                <p>{message.content}</p>
                {message.role === "assistant" && !!message.sectionIds?.length && (
                  <div className="ask-issue-citations">
                    {message.sectionIds.map((id) => {
                      const section = sectionById.get(id);
                      return section ? <a href={`#issue-section-${id}`} onClick={() => setOpen(false)} key={id}>{section.eyebrow || section.title}</a> : null;
                    })}
                    {message.citations?.map((citation) => (
                      <a href={citation.url} target="_blank" rel="noreferrer" key={citation.url}>{citation.title}</a>
                    ))}
                  </div>
                )}
                {message.role === "assistant" && !message.sectionIds?.length && !!message.citations?.length && (
                  <div className="ask-issue-citations">
                    {message.citations.map((citation) => <a href={citation.url} target="_blank" rel="noreferrer" key={citation.url}>{citation.title}</a>)}
                  </div>
                )}
              </article>
            ))}
            {busy && <p className="ask-issue-thinking">{japanese ? "記事を確認中…" : "Checking the issue…"}</p>}
            {error && <p className="ask-issue-error" role="alert">{error}</p>}
          </div>
          <form onSubmit={submit}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={700}
              placeholder={japanese ? "この記事について質問する…" : "Ask a question about this issue…"}
              aria-label={japanese ? "質問" : "Question"}
            />
            <button type="submit" disabled={busy || !question.trim()}>{japanese ? "送信" : "Ask"}</button>
          </form>
          <small>{japanese ? "記事にない情報は、わからないとお伝えします。" : "If the issue doesn’t contain the answer, the guide will say so."}</small>
        </aside>
      )}
    </div>
  );
}
