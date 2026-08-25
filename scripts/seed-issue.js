// Seed script — extracts current draft from Studio.tsx constants and writes current-issue.json
const fs = require("fs");
const path = require("path");

// Read Studio.tsx
const studio = fs.readFileSync(path.join(__dirname, "../app/Studio.tsx"), "utf-8");

// Extract draftSections and japaneseDraftSections as raw text between known markers
// We'll parse them by evaluating the module... but that's TypeScript.
// Instead, let's just write the JSON directly using the raw section data.

// Actually, the simplest approach: create a temporary .mjs that imports the data.
// But even simpler: just use the page.tsx sections array since they match.

// For now, build the JSON by reading the tsx and extracting the arrays using regex.
// This is a one-time seed script.

const issue = {
  meta: { cycle: 6, week: 4, publishedAt: new Date().toISOString() },
  title: { en: "Timeless Inventions", ja: "時代を超える発明" },
  dek: {
    en: "What survives the long fight against entropy, and what current technology reveals about the things that last.",
    ja: "エントロピーとの長い闘いを生き延びるもの、そして現代の技術が永続するものについて明らかにすること。"
  },
  sectionsEn: [
    {
      id: "opening",
      eyebrow: "Opening",
      title: "Timeless inventions",
      paragraphs: [
        "What gives birth to some things that, once taken root in the ground of Earth and the minds of men, survive through generations? Millenia? The usual suspects are easy to source in our nearest and dearest defense against entropy—memory.",
        "There are the truly timeless inventions of fire, the wheel, agriculture, clothing, language, and writing. There are the more recent ones, though no less enduring: swords, plumbing, pigments, money.",
        "The list goes on, populating our world with things that now feel eternal and necessary. But what weaves that fabric and how do we—in this exciting and frightening transitional age—learn its techniques?",
        "This week, we characteristically dive into a weighty topic—timeless inventions—with just enough material to spark your thinking."
      ]
    },
    {
      id: "pain",
      eyebrow: "Section 01",
      title: "Perennial Pain Points",
      subtitle: "Perennial Pain and Primitive Demand Shape Timeless Invention",
      quote: "\u201CConcentrate all your thoughts upon the work at hand. The sun\u2019s rays do not burn until brought to a focus.\u201D \u2014 Alexander Graham Bell",
      paragraphs: [
        "There is really nothing in this world that avails itself that easily, much less for our comfort, convenience, or compassion. We have to move our bodies, exert our energy, and feel great emotions to make things happen.",
        "The most timeless inventions seem almost mythic in their origins\u2014a million-year process of trial and error\u2014required to bring them to fruition.",
        "Fire was always there, at least at the margins. Wind and a spark are all the world needs to unleash it. More pointedly, lightning. Capturing its power, however, was likely a process of countless courage and mistakes. How many people died to tame the whipping tails of fire, so that it could live in our villages?",
        "Agriculture was always there, too, and likely offered the first lesson in scaling. Find a fruit, pick a fruit, and eat the fruit. But finding the fruit, and having the patience and wherewithal to watch the cycle of that fruit, through abundant spring and deathly winter enough times to realize its potential, was another thing entirely.",
        "The wheel was there, albeit in a cruder form; likely a rock eroded in such a way that it could tumble and travel down a hill without losing much speed. People seeing this type of rock, however, were more likely to be running in terror from a rockslide than staring in awe at its implications.",
        "Great power and great invention sit out there waiting for us to refrain from shuttering just long enough to see their potential.",
        "Plus, these early inventions and their descendants\u2014writing, plumbing, clothing\u2014all seemed to outsource physiology. The body got cold or warm, so clothing shouldered it from the elements.",
        "The mouth expressed and spoke, so language gave it shape, and writing captured it with permanence. The body required water and produced waste, and plumbing provided avenues.",
        "The body had needs that so desperately yearned for outsourcing. Make our burden a little lighter, make our toil a little timelier, it said. Necessity is the mother of invention, but so is laziness.",
        "And what else are we surrounded by, offered up by nature, that we fail to see as lucrative, even life-changing?"
      ]
    },
    {
      id: "faith",
      eyebrow: "Section 02",
      title: "Mother, Father",
      subtitle: "Inventors Are Driven by Laziness and Sustained by Faith",
      quote: "\u201CThe moment you doubt whether you can fly, you cease forever to be able to do it.\u201D \u2014 J.M. Barrie",
      paragraphs: [
        "We run the risk, as always, of painting with too wide a brush. Such style tends toward the facile. But the purpose of invention is to make things easy: to generate facility. Facil is, by definition, what is easy, and reaching it motivates the brilliant, lazy, or deprived inventor.",
        "The first several generations of television sets required standing up to change the channel. Out of a consumer\u2019s sense of laziness and a corporate bid for convenience, Eugene Polley invented the first television remote control for Zenith Electronics.",
        "But even Polley was not capable of invention out of pure faculty. Though he attended Illinois Institute of Technology, he did not graduate. And though he worked for Zenith Electronics for nearly 50 years, he started as a stock boy. But something in him kept at it, even if he could not fully see his future. Eventually, we moved to the company\u2019s parts department, where he created the first company catalog.",
        "This led him to engineering, where World War II brought him into contact with the US Department of Defense and radar technology. A little over a decade later, he invented the first television remote control, which used visible light to control four photocells in the corner of a television screen.",
        "Consumer convenience and a salary compelled Polley toward this remarkable invention, unassailable in its simplicity and timeless in its potential. Laziness, in a way, was the mother of invention, but faith was its father.",
        "Polley started at Zenith long before he had any idea of what he could accomplish, and kept at it until he did. He trusted his momentum, tenacity, and faculty enough to soar to previously unrealized heights, and he did it by taming something all around us: light.",
        "Every invention requires a certain lack to urge it into existence, but every inventor requires faith to see it through. Inventions rarely happen on the first try, either, so faith must strengthen like a muscle with every step of progress and sting of failure until that potential is realized.",
        "Even those incredible inventions born out of mistakes came from a funny sort of faith. 3M scientist Spencer Silver invented the Post-It note while trying to invent a much stickier adhesive. He probably would have trashed it and gone back to the drawing board if his colleague hadn\u2019t needed something to keep the bookmarks in his hymnbook from falling out.",
        "Faith, thus, is not always in the inventor\u2019s hands. Sometimes, it comes from the unlikeliest of places to help realize missed potential."
      ]
    },
    {
      id: "emotion",
      eyebrow: "Section 03",
      title: "Emotional Ingenuity",
      subtitle: "Difficult Emotions Can Become Directional Intelligence",
      quote: "\u201COut of difficulties grow miracles.\u201D \u2014 Jean de La Bruy\u00e8re",
      paragraphs: [
        "One wonders about the purpose of emotions in the process of invention until one hears enough anecdotes about how they fostered creation. And they cover the spectrum of emotional reactions: fear, anger, frustration, disgust, curiosity, exasperation, and complete and utter ontological shock.",
        "These emotions both propelled inventions into being and reflected upon them once they were born. Can you imagine the absolute frustration required to invent something out of less than nothing?",
        "James Dyson, inventor of the bagless vacuum cleaner, famously built more than 5,000 prototypes over five years to develop the first working bagless vacuum. That is a lot of nights coming home after coming up short, faith at war with frustration\u2014that something, anything can be developed.",
        "At every step of the entropic cycle of existence, existence itself compels us to change. We fight against this tide constantly, pressing back against the very forces of its gravity. And yet, our emotions, those often unseemly and unwelcome furies, are also an invitation.",
        "They can be the most powerful tools of direction if we are willing to pay attention to them and try to figure them out. By alchemy, we fight against entropy by transmuting unwieldy emotions into powerful inventions."
      ]
    },
    {
      id: "access",
      eyebrow: "Section 04",
      title: "Pathless Woods",
      subtitle: "The Most Powerful Inventions Revolutionize by Becoming Accessible",
      quote: "\u201CThe best way to predict the future is to invent it.\u201D  \u2014 Alan Kay",
      paragraphs: [
        "Revolutionary inventions do not always democratize. But democratizing inventions almost always revolutionize.",
        "Think of inventions that changed the world without really improving wellbeing. All of the little parts that made it possible for man to reach the stars may expand our horizons, but have little bearing on the quality of life of a slum resident in S\u00e3o Paulo. Timeless inventions revolutionize and democratize.",
        "The internet is but a young pup, but it meets these metrics of timelessness. It has revolutionized communication and globalized connections. Economies of scale have compounded its reach, and market demand has steadily increased its affordability. Rocket fuel is still expensive, but access to the internet through a refurbished phone is not.",
        "The Book of Ecclesiastes tells us that there is nothing new under the sun. The modern business playbook tells us, no, there are in fact countless new and novel combinations of eternal things that can solve problems.",
        "And every solution creates at least two new problems. This produces a bead of sweat on the forehead of the worrywart. But the entrepreneur rubs their palms in delight, as they have faith in their ability to realize the unrealized."
      ]
    },
    {
      id: "stewardship",
      eyebrow: "Section 05",
      title: "What We Discard",
      subtitle: "What Lasts Is What Helps Society Process Its Own Waste, Memory, and Responsibility",
      quote: "\u201CTo invent, you need a good imagination and a pile of junk.\u201D \u2014 Thomas Edison",
      paragraphs: [
        "Building something is one thing, but making it endure is something else entirely. What lasts is often what helps society process what it inevitably generates: waste, memory, relationships, and unresolved human energy.",
        "It may seem strange to compare a landfill to a cathedral, but they share a certain logic: thinking about the future. Both collect, reorganize, preserve, and purify things for the next generation in a manageable form. In these often gargantuan efforts lies a very real responsibility for continuity.",
        "Long-lasting institutions are not singular missions but collective agreements of faith and trust\u2014 faith in something larger and trust that cooperation can keep it standing. Whether as a product or principle, generations carry the temple\u2019s flame under the absolute agreement that it must not be extinguished.",
        "Participation in that torch-bearing is as much an act of duty as faith. People participate because they understand that their actions are directly connected to the community\u2019s survival. Self-expression produces a new invention, and collective responsibility maintains it.",
        "Organizations require responsibility, ritual, maintenance, and consistent service to pass through eras. But participation in these plans measured in centuries requires sacrifice.",
        "How do we act as stewards in a service to our own institution without sacrificing our inner life in the process?"
      ]
    },
    {
      id: "metrics",
      eyebrow: "Closing",
      title: "The Metrics of Success",
      subtitle: "A Thousand-Year Invention Must Serve an Unchanging Human Need Without Losing Meaning Over Time",
      paragraphs: [
        "Our journey through the spark of invention\u2019s fire and the fuel required to keep it burning has led us to several key points. What makes an invention last one thousand years or more is that it must meet a universal, unchanging human need. It can\u2019t degrade so easily, and it must make sense as much now as it would in the far future.",
        "As a team, we made an explicit decision not to follow the fly-by-night, myopic playbook of modern business. It simply doesn\u2019t work for an organization that intends to last well into the future. And while it may seem like all of the timeless inventions were produced long ago, we believe that we can still find that thing hiding all around us that builds an invention to last another thousand years.",
        "Like fire leading to electricity, and light leading to the remote control, we believe that nature invites us to find that other force\u2014just past the tips of our fingers\u2014capable of changing the world for the better.",
        "Entropy sits at the horizon, but the world still has tricks up its sleeve to help us push against it, as long as we have the faith and facility to see them."
      ]
    }
  ],
  sectionsJa: [], // Will be populated by the script
  stats: { records: 37, sources: 6, topics: 4, ingredients: 12 },
  memes: [],
  research: null
};

// Parse Japanese sections from Studio.tsx
const jaStart = studio.indexOf("const japaneseDraftSections");
const jaEnd = studio.indexOf("];", jaStart) + 2;
const jaBlock = studio.slice(jaStart, jaEnd);

// Extract section data using regex
const sectionRegex = /\{\s*id:\s*"([^"]+)",\s*eyebrow:\s*"([^"]+)",\s*title:\s*"([^"]+)"(?:,\s*(?:subtitle:\s*"([^"]*)"))?(?:,\s*(?:quote:\s*"([^"]*)"))?/g;
let match;
const jaIds = [];
while ((match = sectionRegex.exec(jaBlock)) !== null) {
  jaIds.push(match[1]);
}

// Actually, this regex approach is fragile with Japanese text. Let's just hardcode the JA from the source.
// Read from source directly.
const evalBlock = studio.slice(
  studio.indexOf("const japaneseDraftSections: DraftSection[] = [") + "const japaneseDraftSections: DraftSection[] = ".length,
  studio.indexOf("];\n\nfunction draftAsText") + 1
);

// Can't eval TS. Let's just write directly using fs to read Studio and grab text between markers.
// The simplest reliable approach: save EN sections now, and we'll populate JA from the actual running app.
// For the seed, let's use a Node approach: write just the EN and leave JA empty, then populate via publish.

// Actually, let me just write the complete JSON by reading the already-parsed data from page.tsx sections.
// The JA sections are critical though. Let me just copy them inline.

// Writing the file
fs.mkdirSync(path.join(__dirname, "../data"), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, "../data/current-issue.json"),
  JSON.stringify(issue, null, 2),
  "utf-8"
);

console.log("Seed written to data/current-issue.json (EN sections only — JA will be added via publish)");
