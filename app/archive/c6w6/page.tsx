import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reality Is the Curriculum — Sunday Data Draft",
  description:
    "Unpublished Cycle 6, Week 6 storybook draft about embodied intelligence, contact, restraint, and compassionate orientation.",
};

export default function C6W6DraftPage() {
  return (
    <main className="archive-embed-shell">
      <nav className="archive-embed-nav">
        <a href="/studio/edition/c6w6">← Week 6 editor</a>
        <span>Cycle 6 · Week 6 · unpublished storybook draft</span>
      </nav>
      <iframe
        src="/drafts/c6w6/index.html"
        title="Sunday Data draft — Reality Is the Curriculum"
        className="archive-iframe"
      />
    </main>
  );
}
