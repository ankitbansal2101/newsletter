/**
 * Smoke: generic subject must not override Google Doc manuscript topic.
 * Run: node --experimental-strip-types app/lib/topic.smoke.ts
 * or: npx esbuild app/lib/topic.smoke.ts --bundle --platform=node --outfile=/tmp/topic-smoke.js && node /tmp/topic-smoke.js
 */
import { headingFromDocument, isGenericTopicLabel, resolveStoryTopic } from "../app/lib/topic";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(isGenericTopicLabel("sunday newsletter"), "sunday newsletter is generic");
assert(isGenericTopicLabel("Sunday Data"), "Sunday Data is generic");
assert(isGenericTopicLabel("newsletter"), "newsletter is generic");
assert(!isGenericTopicLabel("Pende.AI - Cycle 6, Week 3"), "doc title is not generic");
assert(!isGenericTopicLabel("Snap Specs cargo cult"), "specific angle is not generic");

const doc = `Pende.AI - Cycle 6, Week 3
“Depend on the rabbit’s foot if you will, but remember it didn’t work for the rabbit.“ — R.E. Shay
So much of business, like life, is arbitrary. Success is often such a confluence of shifting factors that it amounts to lightning in a bottle. Cargo cults copy runways. Snap Specs. Meta Ray-Ban. Style as moat.
`.repeat(3);

assert(headingFromDocument(doc).startsWith("Pende.AI"), "heading from doc");

const resolved = resolveStoryTopic({
  userTopic: "sunday newsletter",
  inferredTopic: "Pende.AI - Cycle 6, Week 3",
  document: doc,
});
assert(resolved === "Pende.AI - Cycle 6, Week 3", `expected doc topic, got ${resolved}`);

const serverSide = resolveStoryTopic({
  userTopic: "sunday newsletter",
  inferredTopic: headingFromDocument(doc),
  document: doc,
});
assert(serverSide.includes("Pende.AI"), `server resolve failed: ${serverSide}`);

const specific = resolveStoryTopic({
  userTopic: "Snap Specs cargo cult",
  inferredTopic: "Pende.AI - Cycle 6, Week 3",
  document: doc,
});
assert(specific === "Snap Specs cargo cult", `specific user angle should win, got ${specific}`);

console.log("topic.smoke OK", { resolved, serverSide, specific });
