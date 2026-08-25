import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Intelligence That Learns to Understand You — Sunday Data",
  description:
    "Cycle 6, Week 7: empathy, memory, correction, and the intelligence that lets another person change what happens next.",
};

export default function C6W7Page() {
  return (
    <main className="archive-embed-shell archive-embed-shell--full">
      <iframe
        src="/archive/c6w7/index.html"
        title="Sunday Data — The Intelligence That Learns to Understand You"
        className="archive-iframe"
      />
    </main>
  );
}
