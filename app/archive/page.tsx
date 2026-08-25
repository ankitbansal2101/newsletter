import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive — Sunday Data",
  description: "Past issues of the Sunday Data newsletter by Pende.AI.",
};

const issues = [
  {
    slug: "c6w7",
    cycle: 6,
    week: 7,
    title: "The Intelligence That Learns to Understand You",
    subtitle: "Being heard is a language event. Being understood changes what happens next.",
    date: "August 2026",
    live: true,
  },
  {
    slug: "c6w6",
    cycle: 6,
    week: 6,
    title: "Reality Is the Curriculum",
    subtitle: "",
    date: "August 2026",
  },
  {
    slug: "c6w5",
    cycle: 6,
    week: 5,
    title: "Motivation Is Not Inspiration",
    subtitle: "Survival becomes culture through trust, repetition, and reality.",
    date: "July 2026",
  },
  {
    slug: "c6w4",
    cycle: 6,
    week: 4,
    title: "Timeless Inventions",
    subtitle: "",
    date: "July 2026",
  },
  {
    slug: "c6w3",
    cycle: 6,
    week: 3,
    title: "The Cargo Is Not the Ritual",
    subtitle: "A strategy essay on why impressive technology fails, why aspiration changes adoption, and how enduring companies mutate instead of reenacting old success.",
    date: "July 2026",
  },
];

export default function ArchivePage() {
  return (
    <main className="archive-shell">
      <header className="archive-header">
        <a href="/" className="archive-home">← Sunday Data</a>
        <div>
          <p className="archive-kicker">Newsletter archive</p>
          <h1>Past Issues</h1>
          <p className="archive-intro">Every issue of Sunday Data, preserved as originally published.</p>
        </div>
      </header>
      <section className="archive-grid">
        {issues.map((issue) => (
          <a key={issue.slug} href={`/archive/${issue.slug}`} className="archive-card">
            <span className="archive-cycle">Cycle {issue.cycle} · Week {issue.week}{issue.live ? <em className="archive-live"> · Live now</em> : null}</span>
            <h2>{issue.title}</h2>
            {issue.subtitle ? <p>{issue.subtitle}</p> : null}
            <span className="archive-date">{issue.date}</span>
          </a>
        ))}
      </section>
    </main>
  );
}
