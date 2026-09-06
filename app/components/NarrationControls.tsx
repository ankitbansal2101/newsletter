"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildNarrationScript,
  pickNarrationVoice,
  speechLocale,
  type NarrationCue,
  type NarrationLanguage,
} from "../lib/narration";
import type { PublishedIssue } from "../templates/types";

type Props = {
  issue: PublishedIssue;
  language: NarrationLanguage;
  onCueChange?: (cue: NarrationCue | null) => void;
};

export default function NarrationControls({ issue, language, onCueChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(true);
  const cancelRef = useRef(false);
  const indexRef = useRef(0);
  const playingRef = useRef(false);
  const languageRef = useRef(language);
  const onCueChangeRef = useRef(onCueChange);
  const cues = useMemo(() => buildNarrationScript(issue, language), [issue, language]);

  useEffect(() => {
    onCueChangeRef.current = onCueChange;
  }, [onCueChange]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    // Warm voice list (Chrome loads async).
    window.speechSynthesis.getVoices();
    const onVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      cancelRef.current = true;
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    cancelRef.current = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    cancelRef.current = false;
    indexRef.current = 0;
    playingRef.current = false;
    setPlaying(false);
    onCueChangeRef.current?.(null);
  }, [language, cues]);

  function stop() {
    cancelRef.current = true;
    window.speechSynthesis.cancel();
    cancelRef.current = false;
    indexRef.current = 0;
    playingRef.current = false;
    setPlaying(false);
    onCueChangeRef.current?.(null);
  }

  function speakFrom(startIndex: number) {
    if (!cues.length) return;

    cancelRef.current = false;
    indexRef.current = startIndex;
    playingRef.current = true;
    setPlaying(true);

    const speakNext = () => {
      if (cancelRef.current || !playingRef.current) return;
      const index = indexRef.current;
      if (index >= cues.length) {
        stop();
        return;
      }

      const cue = cues[index];
      onCueChangeRef.current?.(cue);

      const utterance = new SpeechSynthesisUtterance(cue.text);
      utterance.lang = speechLocale(languageRef.current);
      utterance.rate = 1;
      const voices = window.speechSynthesis.getVoices();
      const voice = pickNarrationVoice(voices, languageRef.current);
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        if (cancelRef.current || !playingRef.current) return;
        indexRef.current = index + 1;
        speakNext();
      };
      utterance.onerror = () => {
        if (cancelRef.current) return;
        stop();
      };

      window.speechSynthesis.speak(utterance);
    };

    window.speechSynthesis.cancel();
    window.setTimeout(speakNext, 40);
  }

  function toggle() {
    if (!supported || !cues.length) return;
    if (playing) stop();
    else speakFrom(0);
  }

  if (!supported) return null;

  const label = playing
    ? language === "JA"
      ? "停止"
      : "Stop"
    : language === "JA"
      ? "聴く"
      : "Listen";

  return (
    <button
      type="button"
      className={`quiet-button narration-toggle ${playing ? "is-playing" : ""}`}
      onClick={toggle}
      disabled={!cues.length}
      aria-pressed={playing}
      title={playing ? "Stop narration" : "Listen to this edition"}
    >
      {label}
    </button>
  );
}
