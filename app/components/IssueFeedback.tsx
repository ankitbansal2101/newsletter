"use client";

import { useEffect, useState, type FormEvent } from "react";

import type { PublishedIssue } from "../templates/types";

type Rating = "useful" | "needs-work";

export default function IssueFeedback({ issue, language }: { issue: PublishedIssue; language: "EN" | "JA" }) {
  const japanese = language === "JA";
  const storageKey = `sunday-data:feedback:${issue.meta.cycle}-${issue.meta.week}:${encodeURIComponent(issue.title.en)}`;
  const [rating, setRating] = useState<Rating | "">("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { rating?: Rating; comment?: string };
      if (parsed.rating === "useful" || parsed.rating === "needs-work") {
        setRating(parsed.rating);
        setComment(typeof parsed.comment === "string" ? parsed.comment : "");
        setSubmitted(true);
      }
    } catch {
      // Ignore unavailable or malformed local demo feedback.
    }
  }, [storageKey]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ rating, comment: comment.trim().slice(0, 500), savedAt: new Date().toISOString() }));
      setSubmitted(true);
    } catch {
      setSubmitted(false);
    }
  }

  return (
    <section className="issue-feedback" aria-label={japanese ? "記事へのフィードバック" : "Issue feedback"}>
      <div>
        <span>{japanese ? "フィードバック" : "READER FEEDBACK"}</span>
        <h2>{japanese ? "この記事は役に立ちましたか？" : "Was this issue useful?"}</h2>
        <p>{japanese ? "回答はこのデモを開いているブラウザーに保存されます。" : "Your response is saved in this browser for the demo."}</p>
      </div>
      {submitted ? (
        <div className="issue-feedback-thanks" role="status">
          <strong>{japanese ? "ありがとうございます" : "Thanks for sharing."}</strong>
          <button type="button" onClick={() => setSubmitted(false)}>{japanese ? "回答を変更" : "Edit response"}</button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="issue-feedback-choices">
            <button type="button" className={rating === "useful" ? "selected" : ""} aria-pressed={rating === "useful"} onClick={() => setRating("useful")}>
              <span aria-hidden="true">{rating === "useful" ? "●" : "○"}</span>{japanese ? "役に立った" : "Useful"}
            </button>
            <button type="button" className={rating === "needs-work" ? "selected" : ""} aria-pressed={rating === "needs-work"} onClick={() => setRating("needs-work")}>
              <span aria-hidden="true">{rating === "needs-work" ? "●" : "○"}</span>{japanese ? "改善が必要" : "Needs work"}
            </button>
          </div>
          {rating && (
            <>
              <label>
                <span>{japanese ? "任意のコメント" : "Optional comment"}</span>
                <textarea value={comment} maxLength={500} onChange={(event) => setComment(event.target.value)} placeholder={japanese ? "どこが役に立ったか、改善できる点は？" : "What worked, or what could be clearer?"} />
              </label>
              <button className="issue-feedback-submit" type="submit">{japanese ? "保存" : "Save feedback"}</button>
            </>
          )}
        </form>
      )}
    </section>
  );
}
