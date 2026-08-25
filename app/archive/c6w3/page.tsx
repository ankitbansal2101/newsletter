import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Cargo Is Not the Ritual — Sunday Data",
  description: "Cycle 6, Week 3: A strategy essay on cargo cults, AR hardware, aspiration, timing, and mutation.",
};

export default function C6W3Page() {
  return (
    <main className="archive-embed-shell">
      <nav className="archive-embed-nav">
        <a href="/archive">← All issues</a>
        <span>Cycle 6 · Week 3 · July 2026</span>
      </nav>
      <iframe
        src="/archive/c6w3/index.html"
        title="Sunday Data — The Cargo Is Not the Ritual"
        className="archive-iframe"
      />
    </main>
  );
}
