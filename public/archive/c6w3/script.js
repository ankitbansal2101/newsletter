const progressBar = document.querySelector(".progress__bar");
const revealTargets = document.querySelectorAll(".reveal");
const svgNS = "http://www.w3.org/2000/svg";
const storybookCover = document.querySelector(".storybook-cover");
const storybookOpen = document.querySelector(".storybook-open");
const storybookReplay = document.querySelector(".replay-cover");
const owlGuideButton = document.querySelector("#owlGuideButton");
const owlGuidePanel = document.querySelector("#owlGuidePanel");
const owlGuideClose = document.querySelector("#owlGuideClose");
const dyslexiaToggle = document.querySelector("#guideDyslexiaToggle");
const japaneseToggle = document.querySelector("#japaneseToggle");
const japaneseArticle = document.querySelector("#japaneseArticle");
const japaneseClose = document.querySelector("#japaneseClose");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  },
);

revealTargets.forEach((target) => revealObserver.observe(target));

function setProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable <= 0 ? 0 : (window.scrollY / scrollable) * 100;
  progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

setProgress();
window.addEventListener("scroll", setProgress, { passive: true });
window.addEventListener("resize", setProgress);

const tooltip = document.querySelector("#vizTooltip");
const pinboard = document.querySelector("#vizPinboard");
const renderedCharts = new Set();
let clusterMode = "clusters";
let playTimers = [];
const clusterModeCopy = {
  clusters: {
    title: "Cluster view",
    body: "The ovals show the story a pattern-matcher wants to tell: familiar-looking founders appear to sort into neat groups.",
  },
  misses: {
    title: "Model misses",
    body: "The brighter teal points are high-return cases outside the comfortable clusters. This is the point: the pattern looks useful until the best outcomes refuse to fit.",
  },
  residuals: {
    title: "Residuals",
    body: "The bars below show prediction error. When the errors lean instead of scattering randomly, the model is missing structure.",
  },
};

if (storybookCover) {
  document.body.classList.add("storybook-lock");
}

function openStorybook() {
  if (!storybookCover) return;
  storybookCover.classList.add("is-opening");
  window.setTimeout(() => {
    storybookCover.classList.add("is-hidden");
    document.body.classList.remove("storybook-lock");
  }, 1050);
}

function replayStorybook() {
  if (!storybookCover) return;
  storybookCover.classList.remove("is-hidden", "is-opening");
  document.body.classList.add("storybook-lock");
}

storybookOpen?.addEventListener("click", openStorybook);
storybookReplay?.addEventListener("click", replayStorybook);

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Reader preferences are nice-to-have, not required.
  }
}

function applyDyslexiaMode(enabled) {
  document.body.classList.toggle("reader-dyslexia", enabled);
  dyslexiaToggle?.setAttribute("aria-pressed", String(enabled));
  dyslexiaToggle?.classList.toggle("is-active", enabled);
  if (dyslexiaToggle) {
    dyslexiaToggle.textContent = enabled ? "Dyslexia on" : "Dyslexia mode";
  }
  safeStorageSet("pende-reader-dyslexia", enabled ? "1" : "0");
}

dyslexiaToggle?.addEventListener("click", () => {
  applyDyslexiaMode(!document.body.classList.contains("reader-dyslexia"));
});

applyDyslexiaMode(safeStorageGet("pende-reader-dyslexia") === "1");

function setGuideOpen(open) {
  if (!owlGuidePanel || !owlGuideButton) return;
  owlGuidePanel.hidden = !open;
  owlGuideButton.setAttribute("aria-expanded", String(open));
}

function setJapaneseOpen(open) {
  if (!japaneseArticle) return;
  japaneseArticle.hidden = !open;
  japaneseToggle?.setAttribute("aria-expanded", String(open));
  if (japaneseToggle) {
    japaneseToggle.textContent = open ? "Japanese version open" : "Open Japanese version";
  }
  document.body.classList.toggle("translation-open", open);
  if (open) {
    japaneseArticle.focus({ preventScroll: true });
  }
}

owlGuideButton?.addEventListener("click", () => {
  setGuideOpen(owlGuidePanel?.hidden ?? true);
  owlGuideButton.classList.remove("sparkle-now");
  window.setTimeout(() => owlGuideButton.classList.add("sparkle-now"), 0);
});

owlGuideClose?.addEventListener("click", () => setGuideOpen(false));

japaneseToggle?.addEventListener("click", () => {
  setJapaneseOpen(japaneseArticle?.hidden ?? true);
});

japaneseClose?.addEventListener("click", () => setJapaneseOpen(false));

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  setJapaneseOpen(false);
  setGuideOpen(false);
});

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function label(svg, text, x, y, className = "tick-label", anchor = "middle") {
  const node = svgEl("text", { x, y, class: className, "text-anchor": anchor });
  node.textContent = text;
  svg.appendChild(node);
  return node;
}

function showTooltip(event, html) {
  if (!tooltip) return;
  tooltip.innerHTML = html;
  tooltip.classList.add("is-visible");
  tooltip.setAttribute("aria-hidden", "false");
  moveTooltip(event);
}

function moveTooltip(event) {
  if (!tooltip) return;
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function hideTooltip() {
  if (!tooltip) return;
  tooltip.classList.remove("is-visible");
  tooltip.setAttribute("aria-hidden", "true");
}

function withTooltip(node, html) {
  node.style.cursor = "pointer";
  node.setAttribute("tabindex", "0");
  node.setAttribute("role", "button");
  node.setAttribute("aria-label", html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
  node.addEventListener("pointerenter", (event) => showTooltip(event, html));
  node.addEventListener("pointermove", moveTooltip);
  node.addEventListener("pointerleave", hideTooltip);
  node.addEventListener("click", () => pinNote(html));
  node.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pinNote(html);
    }
  });
}

function pinNote(html) {
  if (!pinboard) return;
  const title = html.match(/<strong>(.*?)<\/strong>/)?.[1] ?? "Pinned note";
  const body = html.replace(/<strong>.*?<\/strong>/, "").replace(/<br\s*\/?>/g, " ");
  pinboard.innerHTML = `<span>${title}</span><p>${body.trim()}</p>`;
}

function updateClusterModeNote(mode) {
  const note = document.querySelector("#clusterModeNote");
  const copy = clusterModeCopy[mode];
  if (!note || !copy) return;
  note.querySelector("strong").textContent = copy.title;
  note.querySelector("span").textContent = copy.body;
}

function clearChart(id) {
  const host = document.getElementById(id);
  if (!host) return null;
  host.textContent = "";
  return host;
}

function drawGrid(svg, ticks, scale, left, right, labelX) {
  ticks.forEach((tick) => {
    const y = scale(tick);
    svg.appendChild(svgEl("line", { x1: left, x2: right, y1: y, y2: y, class: "grid-line" }));
    label(svg, tick, labelX, y + 4, "tick-label", "end");
  });
}

function animateRect(rect, y, height) {
  rect.setAttribute("y", Number(rect.getAttribute("data-base")));
  rect.setAttribute("height", 0);
  requestAnimationFrame(() => {
    rect.setAttribute("y", y);
    rect.setAttribute("height", height);
  });
}

function animatePath(path) {
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
  path.style.transition = "stroke-dashoffset 1100ms cubic-bezier(0.22, 1, 0.36, 1)";
  requestAnimationFrame(() => {
    path.style.strokeDashoffset = 0;
  });
}

function renderBurnChart() {
  const host = clearChart("burnChart");
  if (!host) return;
  const compact = host.clientWidth < 720;

  const data = [
    { year: 2020, annual: 6.6, cumulative: 6.6 },
    { year: 2021, annual: 10.2, cumulative: 16.8 },
    { year: 2022, annual: 13.7, cumulative: 30.5 },
    { year: 2023, annual: 16.1, cumulative: 46.6 },
    { year: 2024, annual: 17.7, cumulative: 64.4 },
    { year: 2025, annual: 19.2, cumulative: 83.5 },
  ];
  const width = compact ? 760 : 920;
  const height = compact ? 420 : 470;
  const margin = compact
    ? { top: 34, right: 34, bottom: 54, left: 54 }
    : { top: 34, right: 70, bottom: 62, left: 72 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const maxY = 90;
  const x = (i) => margin.left + (plotW / (data.length - 1)) * i;
  const y = (value) => margin.top + (1 - value / maxY) * plotH;
  const base = y(0);
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });

  drawGrid(svg, compact ? [0, 40, 80] : [0, 20, 40, 60, 80], y, margin.left, width - margin.right, margin.left - 12);
  svg.appendChild(svgEl("line", { x1: margin.left, x2: width - margin.right, y1: base, y2: base, class: "axis-line" }));
  label(svg, compact ? "$B loss" : "Annual operating loss ($B)", 22, height / 2, "axis-label", "middle").setAttribute("transform", `rotate(-90 22 ${height / 2})`);

  const barW = compact ? 42 : 52;
  data.forEach((d, i) => {
    const barH = base - y(d.annual);
    const rect = svgEl("rect", {
      x: x(i) - barW / 2,
      y: base,
      width: barW,
      height: 0,
      class: "bar",
      "data-base": base,
    });
    svg.appendChild(rect);
    animateRect(rect, y(d.annual), barH);
    withTooltip(rect, `<strong>${d.year}</strong>Annual loss: $${d.annual}B<br>Cumulative loss: $${d.cumulative}B`);

    label(svg, d.year, x(i), height - 24, "tick-label");
    if (!compact || i === data.length - 1) {
      label(svg, `$${d.annual}B`, x(i), y(d.annual) - 9, "label-muted label-optional");
    }
  });

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.cumulative)}`).join(" ");
  const path = svgEl("path", { d: line, class: "line-path" });
  svg.appendChild(path);
  animatePath(path);

  data.forEach((d, i) => {
    const circle = svgEl("circle", { cx: x(i), cy: y(d.cumulative), r: 6, class: "point" });
    svg.appendChild(circle);
    withTooltip(circle, `<strong>${d.year}</strong>Cumulative burn: $${d.cumulative}B`);
  });

  label(svg, compact ? "$83.5B" : "$83.5B cumulative", x(data.length - 1) - 4, y(83.5) - 18, "label-hot", "end");
  host.appendChild(svg);
}

function renderTimingChart() {
  const host = clearChart("timingChart");
  if (!host) return;
  const compact = host.clientWidth < 720;

  const rows = [
    {
      label: "Grocery delivery",
      fail: [1997, 2001, "HomeGrocer / Webvan"],
      win: [2012, 2026, "Instacart"],
      gap: "11-year gap",
      detail: "Same promise, lighter capital model, changed consumer behavior.",
    },
    {
      label: "PDAs to smartphones",
      fail: [1993, 1998, "Apple Newton"],
      win: [2007, 2026, "iPhone"],
      gap: "14-year gap",
      detail: "Touchscreens, mobile broadband, and app economics caught up.",
    },
    {
      label: "Smart glasses",
      fail: [2012, 2015, "Google Glass"],
      win: [2023, 2026, "Meta Ray-Ban"],
      gap: "11-year gap",
      detail: "Fashion partnership and modest features lowered adoption friction.",
    },
    {
      label: "Online trading",
      fail: [1992, 2013, "E*Trade / Zecco"],
      win: [2013, 2026, "Robinhood"],
      gap: "7-21 year gap",
      detail: "Mobile UX, gamification, and identity marketing changed the sale.",
      legacy: true,
    },
  ];

  const width = compact ? 760 : 920;
  const height = compact ? 430 : 450;
  const margin = compact
    ? { top: 30, right: 28, bottom: 54, left: 126 }
    : { top: 35, right: 42, bottom: 58, left: 145 };
  const minYear = 1990;
  const maxYear = 2027;
  const plotW = width - margin.left - margin.right;
  const rowGap = compact ? 74 : 80;
  const x = (year) => margin.left + ((year - minYear) / (maxYear - minYear)) * plotW;
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });

  const yearTicks = compact ? [1990, 2000, 2010, 2020] : [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];
  yearTicks.forEach((year) => {
    const xx = x(year);
    svg.appendChild(svgEl("line", { x1: xx, x2: xx, y1: margin.top, y2: height - margin.bottom, class: "grid-line" }));
    label(svg, year, xx, height - 24, "tick-label");
  });

  rows.forEach((row, index) => {
    const y = margin.top + 40 + index * rowGap;
    label(svg, row.label, margin.left - 16, y + 5, "tick-label", "end");

    const failX = x(row.fail[0]);
    const failWidth = Math.max(8, x(row.fail[1]) - failX);
    const fail = svgEl("rect", {
      x: failX,
      y: y - 16,
      width: 0,
      height: 24,
      class: row.legacy ? "timeline-bar timeline-bar--legacy" : "timeline-bar timeline-bar--fail",
    });
    svg.appendChild(fail);
    requestAnimationFrame(() => fail.setAttribute("width", failWidth));
    withTooltip(fail, `<strong>${row.fail[2]}</strong>${row.fail[0]}-${row.fail[1]}<br>${row.detail}`);

    if (!compact) {
      label(svg, row.fail[2], failX + failWidth + 8, y + 2, "label-hot label-optional", "start");
    }

    const winX = x(row.win[0]);
    const winWidth = Math.max(8, x(row.win[1]) - winX);
    const win = svgEl("rect", {
      x: winX,
      y: y + 16,
      width: 0,
      height: 24,
      class: "timeline-bar timeline-bar--win",
    });
    svg.appendChild(win);
    requestAnimationFrame(() => win.setAttribute("width", winWidth));
    withTooltip(win, `<strong>${row.win[2]}</strong>${row.win[0]}-${row.win[1]}<br>${row.detail}`);

    if (!compact) {
      label(svg, row.win[2], winX + Math.min(winWidth - 8, 140), y + 34, "label-cool label-optional", "end");
    }

    const gapStart = x(row.fail[1]) + 4;
    const gapEnd = x(row.win[0]) - 4;
    if (gapEnd > gapStart) {
      svg.appendChild(svgEl("line", {
        x1: gapStart,
        x2: gapEnd,
        y1: y + 6,
        y2: y + 6,
        stroke: "#f2a45b",
        "stroke-width": 2,
        "stroke-dasharray": "4 4",
      }));
      label(svg, row.gap, (gapStart + gapEnd) / 2, compact ? y + 2 : y - 3, "label-hot");
    }
  });

  label(svg, "Year", width / 2, height - 5, "axis-label");
  host.appendChild(svg);
}

function renderGapChart() {
  const host = clearChart("gapChart");
  if (!host) return;
  const compact = host.clientWidth < 720;

  const rows = [
    { label: "Snap Specs", sub: "stock impact, 2 days", actual: -18, projected: 4, actualLabel: "~18% slide", projectedLabel: "+4% bump" },
    { label: "WeWork IPO", sub: "valuation", actual: 17, projected: 100, actualLabel: "$8B vs $47B", projectedLabel: "$47B thesis" },
    { label: "IBM Watson Oncology", sub: "investment ROI", actual: 0, projected: 100, actualLabel: "abandoned", projectedLabel: "$4B ROI thesis" },
    { label: "Motorola Iridium", sub: "subscribers", actual: 0.5, projected: 100, actualLabel: "10K subs", projectedLabel: "2M subs" },
    { label: "Apple Newton", sub: "units/year", actual: 5, projected: 100, actualLabel: "~50K units", projectedLabel: "1M units" },
    { label: "Webvan", sub: "profitable markets", actual: 0, projected: 100, actualLabel: "0 markets", projectedLabel: "26 markets" },
  ];

  const width = compact ? 760 : 920;
  const height = compact ? 430 : 470;
  const margin = compact
    ? { top: 30, right: 34, bottom: 54, left: 150 }
    : { top: 34, right: 72, bottom: 58, left: 190 };
  const min = -25;
  const max = 120;
  const plotW = width - margin.left - margin.right;
  const x = (value) => margin.left + ((value - min) / (max - min)) * plotW;
  const rowGap = 55;
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });

  const ticks = compact ? [-20, 0, 50, 100] : [-20, 0, 20, 40, 60, 80, 100, 120];
  ticks.forEach((tick) => {
    const xx = x(tick);
    svg.appendChild(svgEl("line", { x1: xx, x2: xx, y1: margin.top, y2: height - margin.bottom, class: "grid-line" }));
    label(svg, tick, xx, height - 24, "tick-label");
  });
  label(svg, compact ? "% of projected outcome" : "% of projected outcome achieved", width / 2 + 40, height - 4, "axis-label");

  rows.forEach((row, index) => {
    const y = margin.top + 35 + index * rowGap;
    label(svg, row.label, margin.left - 16, y - 5, "tick-label", "end");
    if (!compact) {
      label(svg, row.sub, margin.left - 16, y + 12, "label-muted label-optional", "end");
    }
    svg.appendChild(svgEl("line", { x1: x(row.actual), x2: x(row.projected), y1: y, y2: y, class: "gap-line" }));

    const actual = svgEl("circle", { cx: x(row.actual), cy: y, r: 7, class: "dumbbell-point actual-point" });
    const projected = svgEl("circle", { cx: x(row.projected), cy: y, r: 7, class: "dumbbell-point projected-point" });
    svg.append(actual, projected);
    withTooltip(actual, `<strong>${row.label}: actual</strong>${row.actualLabel}`);
    withTooltip(projected, `<strong>${row.label}: projected</strong>${row.projectedLabel}`);
    if (!compact && index < 3) {
      label(svg, row.actualLabel, x(row.actual) - 10, y + 5, "label-hot label-optional", "end");
      label(svg, row.projectedLabel, x(row.projected) + 10, y + 5, "label-cool label-optional", "start");
    }
  });

  host.appendChild(svg);
}

function seededRandom(seedStart = 15) {
  let seed = seedStart;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function normal(rand) {
  const u = Math.max(rand(), 0.001);
  const v = Math.max(rand(), 0.001);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clusterData() {
  const rand = seededRandom(88);
  const points = [];
  for (let i = 0; i < 42; i += 1) {
    const x = 0.5 + rand() * 4.6;
    points.push({ x, y: 2 + x * 0.28 + normal(rand) * 2.3, type: "fit" });
  }
  for (let i = 0; i < 38; i += 1) {
    const x = 5.2 + rand() * 4.5;
    points.push({ x, y: 1.4 + x * 0.28 + normal(rand) * 2.4, type: "winner" });
  }
  for (let i = 0; i < 13; i += 1) {
    points.push({ x: 0.8 + rand() * 8.4, y: 9.5 + rand() * 6.8, type: "unicorn" });
  }
  return points.map((point) => ({ ...point, y: Math.max(-4.8, Math.min(17, point.y)) }));
}

function regression(points) {
  const n = points.length;
  const sx = points.reduce((sum, p) => sum + p.x, 0);
  const sy = points.reduce((sum, p) => sum + p.y, 0);
  const sxx = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const sxy = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = sy / n - slope * (sx / n);
  const meanY = sy / n;
  const ssTot = points.reduce((sum, p) => sum + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((sum, p) => sum + (p.y - (intercept + slope * p.x)) ** 2, 0);
  return { slope, intercept, r2: 1 - ssRes / ssTot };
}

function renderClusterChart(mode = clusterMode) {
  const host = clearChart("clusterChart");
  if (!host) return;
  updateClusterModeNote(mode);
  const compact = host.clientWidth < 720;

  const points = clusterData();
  const reg = regression(points);
  const width = compact ? 760 : 920;
  const height = compact ? 540 : 590;
  const margin = compact
    ? { top: 30, right: 26, bottom: 54, left: 54 }
    : { top: 34, right: 46, bottom: 58, left: 72 };
  const scatterH = mode === "residuals" ? (compact ? 220 : 260) : (compact ? 380 : 420);
  const x = (value) => margin.left + (value / 10) * (width - margin.left - margin.right);
  const y = (value) => margin.top + (1 - (value + 6) / 24) * scatterH;
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });

  const xTicks = compact ? [0, 5, 10] : [0, 2, 4, 6, 8, 10];
  xTicks.forEach((tick) => {
    const xx = x(tick);
    svg.appendChild(svgEl("line", { x1: xx, x2: xx, y1: margin.top, y2: margin.top + scatterH, class: "grid-line" }));
    label(svg, tick, xx, margin.top + scatterH + 24, "tick-label");
  });
  (compact ? [-5, 5, 15] : [-5, 0, 5, 10, 15]).forEach((tick) => {
    const yy = y(tick);
    svg.appendChild(svgEl("line", { x1: margin.left, x2: width - margin.right, y1: yy, y2: yy, class: "grid-line" }));
    label(svg, tick, margin.left - 12, yy + 4, "tick-label", "end");
  });

  label(svg, compact ? "Pedigree score" : "Founder pedigree score", width / 2, margin.top + scatterH + 52, "axis-label");
  label(svg, compact ? "Return" : "Return multiple", 24, margin.top + scatterH / 2, "axis-label").setAttribute("transform", `rotate(-90 24 ${margin.top + scatterH / 2})`);

  if (mode !== "residuals") {
    svg.appendChild(svgEl("ellipse", {
      cx: x(3),
      cy: y(1.5),
      rx: 190,
      ry: 74,
      fill: "none",
      stroke: "#84c3d6",
      "stroke-width": 2,
      "stroke-dasharray": "7 7",
      opacity: 0.72,
    }));
    svg.appendChild(svgEl("ellipse", {
      cx: x(7.6),
      cy: y(2.7),
      rx: 170,
      ry: 70,
      fill: "none",
      stroke: "#e19a55",
      "stroke-width": 2,
      "stroke-dasharray": "7 7",
      opacity: 0.72,
    }));
  }

  points.forEach((point) => {
    const isMiss = point.type === "unicorn";
    const circle = svgEl("circle", {
      cx: x(point.x),
      cy: y(point.y),
      r: mode === "misses" && isMiss ? 7 : 5,
      class: `scatter-point scatter-point--${point.type}`,
      opacity: mode === "misses" ? (isMiss ? 1 : 0.2) : 0.78,
    });
    svg.appendChild(circle);
    withTooltip(circle, `<strong>${point.type === "unicorn" ? "Missed high-outcome point" : "Clustered observation"}</strong>Pedigree: ${point.x.toFixed(1)}<br>Return multiple: ${point.y.toFixed(1)}x`);
  });

  const regLine = svgEl("line", {
    x1: x(0),
    y1: y(reg.intercept),
    x2: x(10),
    y2: y(reg.intercept + reg.slope * 10),
    stroke: "#f5c76d",
    "stroke-width": 2,
    "stroke-dasharray": "5 5",
    opacity: 0.75,
  });
  svg.appendChild(regLine);
  label(svg, compact ? `R2 = ${reg.r2.toFixed(2)}` : `R2 = ${reg.r2.toFixed(2)} / weak signal`, width - margin.right - 8, y(reg.intercept + reg.slope * 9.2) - 12, "label-hot", "end");

  if (mode === "misses" && !compact) {
    label(svg, "Actual outliers the cluster story would miss", x(5.5), y(16.2), "label-cool");
  }

  if (mode === "residuals") {
    const residuals = points
      .map((point) => point.y - (reg.intercept + reg.slope * point.x))
      .sort((a, b) => a - b);
    const top = margin.top + scatterH + 92;
    const resH = 155;
    const zero = top + resH / 2;
    const maxAbs = Math.max(...residuals.map((value) => Math.abs(value)));
    const barW = (width - margin.left - margin.right) / residuals.length;
    label(svg, compact ? "Residual distribution" : "Residual distribution: uneven, asymmetric, non-random", width / 2, top - 22, "title-label");
    svg.appendChild(svgEl("line", { x1: margin.left, x2: width - margin.right, y1: zero, y2: zero, class: "axis-line" }));
    residuals.forEach((residual, index) => {
      const h = Math.abs(residual / maxAbs) * (resH / 2 - 6);
      const rect = svgEl("rect", {
        x: margin.left + index * barW,
        y: residual >= 0 ? zero - h : zero,
        width: Math.max(1, barW - 1),
        height: h,
        class: residual >= 0 ? "residual-bar--positive" : "residual-bar--negative",
        opacity: 0.9,
      });
      svg.appendChild(rect);
    });
  }

  host.appendChild(svg);
}

function renderViz(name) {
  if (name === "burn") renderBurnChart();
  if (name === "timing") renderTimingChart();
  if (name === "gap") renderGapChart();
  if (name === "cluster") renderClusterChart(clusterMode);
  renderedCharts.add(name);
}

function activateViz(target) {
  const shell = document.querySelector(".viz-shell");
  shell?.scrollIntoView({ behavior: "auto", block: "start" });
  document.querySelectorAll("[data-viz]").forEach((tabButton) => {
    const active = tabButton.dataset.viz === target;
    tabButton.classList.toggle("is-active", active);
    tabButton.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === target);
  });
  renderViz(target);
  hideTooltip();
}

function clearPlayTimers() {
  playTimers.forEach((timer) => window.clearTimeout(timer));
  playTimers = [];
}

document.querySelectorAll("[data-viz]").forEach((button) => {
  button.addEventListener("click", () => {
    clearPlayTimers();
    activateViz(button.dataset.viz);
  });
});

document.querySelectorAll("[data-cluster-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    clearPlayTimers();
    clusterMode = button.dataset.clusterMode;
    document.querySelectorAll("[data-cluster-mode]").forEach((modeButton) => {
      modeButton.classList.toggle("is-active", modeButton === button);
    });
    renderClusterChart(clusterMode);
    hideTooltip();
  });
});

document.querySelector("#replayChartMotion")?.addEventListener("click", () => {
  const active = document.querySelector("[data-viz].is-active")?.dataset.viz ?? "burn";
  renderViz(active);
});

document.querySelector("#playDataStory")?.addEventListener("click", () => {
  clearPlayTimers();
  dataLab?.scrollIntoView({ behavior: "smooth", block: "start" });
  const sequence = [
    () => {
      activateViz("burn");
      pinNote("<strong>Meta burn</strong>The bars rise, but the cumulative line is the real thesis: ambition compounds faster than adoption.");
    },
    () => {
      activateViz("timing");
      pinNote("<strong>Timing gap</strong>The same idea can fail first and win later when infrastructure, culture, and behavior catch up.");
    },
    () => {
      activateViz("gap");
      pinNote("<strong>Projection gap</strong>The farther the blue dot sits from the pink dot, the louder the echo chamber was.");
    },
    () => {
      activateViz("cluster");
      clusterMode = "misses";
      updateClusterModeNote(clusterMode);
      renderClusterChart(clusterMode);
      document.querySelectorAll("[data-cluster-mode]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.clusterMode === "misses");
      });
      pinNote("<strong>Cluster lab</strong>The high-outcome misses are the uncomfortable part: the pattern feels predictive until the residuals object.");
    },
    () => {
      clusterMode = "residuals";
      updateClusterModeNote(clusterMode);
      renderClusterChart(clusterMode);
      document.querySelectorAll("[data-cluster-mode]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.clusterMode === "residuals");
      });
      pinNote("<strong>Residuals</strong>This is the professor bait: show the model, then show the error structure.");
    },
  ];
  sequence.forEach((step, index) => {
    playTimers.push(window.setTimeout(step, index * 2300));
  });
});

const dataLab = document.querySelector("#data-lab");
if (dataLab) {
  const dataLabObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !renderedCharts.has("burn")) {
          renderBurnChart();
          renderedCharts.add("burn");
        }
      });
    },
    { threshold: 0.25 },
  );
  dataLabObserver.observe(dataLab);
}
