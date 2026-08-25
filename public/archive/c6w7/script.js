document.documentElement.classList.add("js");

const cover = document.querySelector(".casefile-cover");
const openButton = document.querySelector(".casefile-open");
const replayButton = document.querySelector(".replay-cover");
const archiveBack = document.querySelector(".archive-back");
const progressBar = document.querySelector(".progress__bar");
const revealTargets = document.querySelectorAll(".reveal");
const japaneseToggle = document.querySelector("#japaneseToggle");
const japaneseArticle = document.querySelector("#japaneseArticle");
const japaneseClose = document.querySelector("#japaneseClose");
const resolveMemory = document.querySelector("#resolveMemory");
const empathyButtons = document.querySelectorAll("[data-empathy-choice]");
const empathyResult = document.querySelector("#empathyResult");
const empathyGame = document.querySelector("#empathyGame");
const empathyRound = document.querySelector("#empathyRound");
const empathyScenario = document.querySelector("#empathyScenario");
const empathyProgress = document.querySelectorAll(".arcade-progress i");
const empathyUserBar = document.querySelector("#empathyUserBar");
const empathyUserValue = document.querySelector("#empathyUserValue");
const empathyReset = document.querySelector("#empathyReset");
const lorenzTime = document.querySelector("#lorenzTime");
const lorenzTimeLabel = document.querySelector("#lorenzTimeLabel");
const lorenzDistance = document.querySelector("#lorenzDistance");
const lorenzExact = document.querySelector("#lorenzExact");
const lorenzRounded = document.querySelector("#lorenzRounded");
const lorenzExactDot = document.querySelector("#lorenzExactDot");
const lorenzRoundedDot = document.querySelector("#lorenzRoundedDot");
const lorenzSeparationPath = document.querySelector("#lorenzSeparationPath");
const lorenzPlay = document.querySelector("#lorenzPlay");
const lorenzRound = document.querySelector("#lorenzRound");
const lorenzRewind = document.querySelector("#lorenzRewind");
const lorenzLab = document.querySelector(".lorenz-lab");
const storyMain = document.querySelector("main");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const realityLab = document.querySelector("#realityGapLab");
const realityAction = document.querySelector("#realityAction");
const realityReset = document.querySelector("#realityReset");
const realityHotspots = document.querySelectorAll("[data-reality-clue]");
const realityNotes = document.querySelectorAll("[data-reality-note]");
const realitySteps = document.querySelectorAll("[data-reality-step]");
const realityStatusKicker = document.querySelector("#realityStatusKicker");
const realityStatus = document.querySelector("#realityStatus");
const realityInstruction = document.querySelector("#realityInstruction");
const realityStopError = document.querySelector("#realityStopError");
const realityClueCount = document.querySelector("#realityClueCount");
const realityMarshalBubble = document.querySelector("#realityMarshalBubble");
const rankingButtons = document.querySelectorAll("[data-ranking]");
const memoryRows = document.querySelectorAll("#memoryRows > div");
const learningButtons = document.querySelectorAll("[data-learning]");
const networkStage = document.querySelector(".network-stage");
const learningResult = document.querySelector("#learningResult");
const dispatchRadio = document.querySelector("#dispatchRadio");
const radioTune = document.querySelector("#radioTune");
const radioStatus = document.querySelector("#radioStatus");
const radioPresetButtons = document.querySelectorAll("[data-radio-preset]");
const radioBulletinName = document.querySelector("#radioBulletinName");
const radioBulletinValue = document.querySelector("#radioBulletinValue");
const radioBulletinMeasure = document.querySelector("#radioBulletinMeasure");
let translationReturnFocus = null;

function openStory() {
  cover?.classList.add("is-opening");
  window.setTimeout(() => {
    cover?.classList.add("is-hidden");
    document.body.classList.remove("casefile-lock");
    storyMain?.removeAttribute("inert");
    japaneseToggle?.removeAttribute("inert");
    archiveBack?.removeAttribute("inert");
    document.querySelector("h1")?.focus({ preventScroll: true });
  }, prefersReducedMotion.matches ? 0 : 1050);
}

function replayStory() {
  cover?.classList.remove("is-hidden", "is-opening");
  document.body.classList.add("casefile-lock");
  storyMain?.setAttribute("inert", "");
  japaneseToggle?.setAttribute("inert", "");
  archiveBack?.setAttribute("inert", "");
  window.scrollTo({ top: 0, behavior: "smooth" });
  openButton?.focus({ preventScroll: true });
}

function setJapaneseOpen(open) {
  if (!japaneseArticle) return;
  if (open) {
    translationReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : japaneseToggle;
    japaneseArticle.hidden = false;
    japaneseToggle?.setAttribute("aria-expanded", "true");
    document.body.classList.add("translation-open");
    storyMain?.setAttribute("inert", "");
    japaneseToggle?.setAttribute("inert", "");
    archiveBack?.setAttribute("inert", "");
    window.requestAnimationFrame(() => japaneseClose?.focus({ preventScroll: true }));
    return;
  }
  japaneseArticle.hidden = true;
  japaneseToggle?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("translation-open");
  if (cover?.classList.contains("is-hidden")) {
    storyMain?.removeAttribute("inert");
    japaneseToggle?.removeAttribute("inert");
    archiveBack?.removeAttribute("inert");
  }
  const returnTarget = translationReturnFocus?.isConnected ? translationReturnFocus : japaneseToggle;
  translationReturnFocus = null;
  returnTarget?.focus({ preventScroll: true });
}

function handleDialogKeydown(event) {
  const translationIsOpen = Boolean(japaneseArticle && !japaneseArticle.hidden);
  if (event.key === "Escape" && translationIsOpen) {
    event.preventDefault();
    setJapaneseOpen(false);
    return;
  }
  if (event.key !== "Tab") return;
  if (!translationIsOpen) {
    if (cover && !cover.classList.contains("is-hidden")) {
      event.preventDefault();
      openButton?.focus({ preventScroll: true });
    }
    return;
  }
  const focusable = [...japaneseArticle.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter((element) => !element.hasAttribute("inert"));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const value = scrollable <= 0 ? 0 : (window.scrollY / scrollable) * 100;
  if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, value))}%`;
}

const empathyScenarios = [
  "You need to say something difficult. Who do you want listening?",
  "You are grieving and do not want advice yet. Who receives the first message?",
  "You changed your mind after months of certainty. Who gets the correction?",
  "The context is private, unfinished, and hard to explain. Who do you open first?",
];
let empathyChoices = [];
let empathyTransitioning = false;

function renderEmpathyArcade() {
  const index = Math.min(empathyChoices.length, empathyScenarios.length - 1);
  if (empathyRound) empathyRound.textContent = String(Math.min(index + 1, 4));
  if (empathyScenario) empathyScenario.textContent = empathyScenarios[index];
  empathyProgress.forEach((item, itemIndex) => {
    item.classList.toggle("is-done", itemIndex < empathyChoices.length);
    item.classList.toggle("is-current", itemIndex === empathyChoices.length && empathyChoices.length < 4);
  });
  empathyButtons.forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.disabled = empathyChoices.length >= 4 || empathyTransitioning;
  });
}

function setEmpathyChoice(choice) {
  if (empathyTransitioning || empathyChoices.length >= 4) return;
  empathyTransitioning = true;
  empathyChoices.push(choice);
  empathyButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.empathyChoice === choice));
    button.disabled = true;
  });
  if (empathyChoices.length === 4) {
    const humanRate = (empathyChoices.filter((item) => item === "human").length / 4) * 100;
    empathyGame?.classList.add("is-complete");
    if (empathyResult) empathyResult.textContent = `You chose a human ${humanRate.toFixed(0)}% of the time. Study 3’s benchmark was 62.1%, while AI responses received higher empathy and felt-heard ratings.`;
    empathyUserBar?.style.setProperty("--value", `${humanRate}%`);
    if (empathyUserValue) empathyUserValue.textContent = `${humanRate.toFixed(0)}%`;
    empathyTransitioning = false;
    renderEmpathyArcade();
    return;
  }
  if (empathyResult) empathyResult.textContent = `Round ${empathyChoices.length} recorded. Relationship choice and response rating are separate signals.`;
  window.setTimeout(() => {
    empathyTransitioning = false;
    renderEmpathyArcade();
  }, prefersReducedMotion.matches ? 0 : 420);
}

function resetEmpathyArcade() {
  empathyChoices = [];
  empathyGame?.classList.remove("is-complete");
  empathyUserBar?.style.setProperty("--value", "0%");
  if (empathyUserValue) empathyUserValue.textContent = "—";
  if (empathyResult) empathyResult.textContent = "Choose before seeing how your pattern compares with the study.";
  renderEmpathyArcade();
}

const realityEvidence = {
  surface: {
    title: "Environment",
    note: "Wet concrete changed traction beyond the dry-floor simulation.",
    feedback: "You found deployment context the simulation omitted.",
  },
  wheel: {
    title: "Hardware",
    note: "The worn left wheel differs from the component assumed in testing.",
    feedback: "You found component drift hidden by the clean test rig.",
  },
  marshal: {
    title: "Human feedback",
    note: "The dock marshal reports the short stop recurs on rainy shifts.",
    feedback: "The affected operator turned one miss into a recurring pattern.",
  },
};

let realityState = "briefing";
let realityCollected = new Set();
let realityTimer = 0;

function setRealityQuestStep(step) {
  realitySteps.forEach((item) => {
    if (item.dataset.realityStep === step) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
}

function setRealityHotspotsEnabled(enabled) {
  realityHotspots.forEach((button) => {
    const collected = realityCollected.has(button.dataset.realityClue);
    button.disabled = !enabled || collected;
  });
}

function setRealitySceneState(state) {
  realityState = state;
  realityLab?.setAttribute("data-reality-state", state);
  const step = state === "briefing" ? "simulate" : state === "deploying" ? "deploy" : state === "incident" ? "observe" : "correct";
  setRealityQuestStep(step);
}

function startRealityDeployment() {
  if (realityState !== "briefing") return;
  window.clearTimeout(realityTimer);
  setRealitySceneState("deploying");
  setRealityHotspotsEnabled(false);
  if (realityAction) realityAction.disabled = true;
  if (realityStatusKicker) realityStatusKicker.textContent = "Production run · revision 01";
  if (realityStatus) realityStatus.textContent = "The same policy is running on the live dock.";
  if (realityInstruction) realityInstruction.textContent = "Watch where the cart actually stops.";
  if (realityStopError) realityStopError.textContent = "field run · measuring…";
  if (realityMarshalBubble) realityMarshalBubble.textContent = "That floor is not your test rig.";
  realityTimer = window.setTimeout(() => {
    setRealitySceneState("incident");
    setRealityHotspotsEnabled(true);
    if (realityAction) {
      realityAction.textContent = "Collect 3 field signals";
      realityAction.disabled = true;
    }
    if (realityStatusKicker) realityStatusKicker.textContent = "Incident · stop fell short";
    if (realityStatus) realityStatus.textContent = "The live cart stopped 1.8 m before the gold line.";
    if (realityInstruction) realityInstruction.textContent = "Inspect the scene. Production evidence must explain what the metric alone cannot.";
    if (realityStopError) realityStopError.textContent = "observed miss · 1.8 m short";
    if (realityMarshalBubble) realityMarshalBubble.textContent = "Don’t trust the dashboard. Look around.";
  }, prefersReducedMotion.matches ? 0 : 1650);
}

function collectRealityEvidence(clue) {
  if (realityState !== "incident" || realityCollected.has(clue) || !realityEvidence[clue]) return;
  realityCollected.add(clue);
  const evidence = realityEvidence[clue];
  realityHotspots.forEach((button) => {
    if (button.dataset.realityClue !== clue) return;
    button.setAttribute("aria-pressed", "true");
    button.disabled = true;
    const marker = button.querySelector("span");
    if (marker) marker.textContent = "✓";
  });
  realityNotes.forEach((note) => {
    if (note.dataset.realityNote !== clue) return;
    note.classList.add("is-found");
    const copy = note.querySelector("span");
    if (copy) copy.innerHTML = `<strong>${evidence.title}</strong>${evidence.note}`;
  });
  if (realityClueCount) realityClueCount.textContent = `${realityCollected.size} / 3`;
  if (realityStatus) realityStatus.textContent = evidence.feedback;
  if (realityMarshalBubble && clue === "marshal") realityMarshalBubble.textContent = "It misses short every rainy shift.";
  if (realityCollected.size === 3) {
    if (realityAction) {
      realityAction.textContent = "Update policy + rerun";
      realityAction.disabled = false;
    }
    if (realityStatusKicker) realityStatusKicker.textContent = "Evidence packet · ready";
    if (realityStatus) realityStatus.textContent = "Telemetry, field conditions, and operator feedback now tell one story.";
    if (realityInstruction) realityInstruction.textContent = "Use the evidence to revise the policy, then evaluate it on the dock again.";
  } else if (realityInstruction) {
    realityInstruction.textContent = `${3 - realityCollected.size} field signal${realityCollected.size === 2 ? "" : "s"} still missing.`;
  }
}

function rerunRealityDeployment() {
  if (realityState !== "incident" || realityCollected.size !== 3) return;
  window.clearTimeout(realityTimer);
  setRealitySceneState("rewind");
  setRealityHotspotsEnabled(false);
  if (realityAction) realityAction.disabled = true;
  if (realityStatusKicker) realityStatusKicker.textContent = "Revision 02 · field evidence incorporated";
  if (realityStatus) realityStatus.textContent = "The cart is returning to the start with an updated stopping policy.";
  if (realityInstruction) realityInstruction.textContent = "The new claim still has to survive deployment.";
  if (realityStopError) realityStopError.textContent = "updated run · preparing…";
  realityTimer = window.setTimeout(() => {
    setRealitySceneState("correcting");
    if (realityStatus) realityStatus.textContent = "Revision 02 is running against the same wet dock.";
    if (realityMarshalBubble) realityMarshalBubble.textContent = "Same dock. New claim. Let’s see.";
    realityTimer = window.setTimeout(() => {
      setRealitySceneState("complete");
      if (realityStatusKicker) realityStatusKicker.textContent = "Production check · revision 02";
      if (realityStatus) realityStatus.textContent = "The updated cart stops within 0.1 m of the gold line.";
      if (realityInstruction) realityInstruction.textContent = "A new field result closes this loop—and becomes the baseline for the next one.";
      if (realityStopError) realityStopError.textContent = "post-update error · 0.1 m";
      if (realityMarshalBubble) realityMarshalBubble.textContent = "Now the next action changed.";
      if (realityAction) realityAction.textContent = "Field check complete";
    }, prefersReducedMotion.matches ? 0 : 1700);
  }, prefersReducedMotion.matches ? 0 : 520);
}

function resetRealityCase() {
  window.clearTimeout(realityTimer);
  realityCollected = new Set();
  setRealitySceneState("briefing");
  realityHotspots.forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.disabled = true;
    const marker = button.querySelector("span");
    if (marker) marker.textContent = "?";
  });
  realityNotes.forEach((note) => {
    note.classList.remove("is-found");
    const copy = note.querySelector("span");
    const placeholder = {
      surface: "<strong>Environment</strong>Awaiting field observation.",
      wheel: "<strong>Hardware</strong>Awaiting component check.",
      marshal: "<strong>Human feedback</strong>Awaiting affected operator.",
    }[note.dataset.realityNote];
    if (copy && placeholder) copy.innerHTML = placeholder;
  });
  if (realityClueCount) realityClueCount.textContent = "0 / 3";
  if (realityAction) {
    realityAction.textContent = "Deploy at Dock 07";
    realityAction.disabled = false;
  }
  if (realityStatusKicker) realityStatusKicker.textContent = "Simulation record · revision 01";
  if (realityStatus) realityStatus.textContent = "The clean model predicts a perfect stop. Deployment is the test.";
  if (realityInstruction) realityInstruction.textContent = "Send the policy into Dock 07.";
  if (realityStopError) realityStopError.textContent = "simulated error · 0.0 m";
  if (realityMarshalBubble) realityMarshalBubble.textContent = "Dry-floor trial looked perfect. Your move.";
}

function setRanking(mode) {
  rankingButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.ranking === mode)));
  memoryRows.forEach((row) => {
    const score = Number(row.dataset[mode]);
    row.style.setProperty("--memory-score", `${score * 100}%`);
    const label = row.querySelector("strong");
    if (label) label.textContent = score.toFixed(4);
  });
}

function setLearningMode(mode) {
  learningButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.learning === mode)));
  networkStage?.setAttribute("data-mode", mode);
  if (!learningResult) return;
  learningResult.innerHTML = mode === "backprop"
    ? "<strong>Backprop:</strong> data moves forward, then one global error signal travels backward through the network."
    : "<strong>Forward-only:</strong> activity keeps moving forward; layers can learn from local objectives without sending one global error backward.";
}

let radioTuneTimer = 0;
const radioStations = {
  ddog: { name: "Market reaction · Datadog", value: "−19%", measure: "one-day stock move after slowdown guidance" },
  pltr: { name: "Operating wire · Palantir", value: "+89%", measure: "first-half revenue growth" },
  shop: { name: "Operating wire · Shopify", value: "+34%", measure: "quarterly revenue growth" },
  crwv: { name: "Forecast wire · CoreWeave", value: "+111%", measure: "expected revenue growth · period supplied" },
};

function tuneDispatchRadio(requestedStation) {
  if (!dispatchRadio || !radioTune || !radioStatus) return;
  const stationKeys = Object.keys(radioStations);
  const currentIndex = Math.max(0, stationKeys.indexOf(dispatchRadio.dataset.radioStation));
  const station = radioStations[requestedStation] ? requestedStation : stationKeys[(currentIndex + 1) % stationKeys.length];
  window.clearTimeout(radioTuneTimer);
  dispatchRadio.dataset.radioState = "seeking";
  radioTune.disabled = true;
  radioTune.setAttribute("aria-pressed", "true");
  radioPresetButtons.forEach((button) => { button.disabled = true; });
  radioStatus.textContent = `Scanning for ${station.toUpperCase()}…`;
  const lockSignal = () => {
    const bulletin = radioStations[station];
    dispatchRadio.dataset.radioStation = station;
    dispatchRadio.dataset.radioState = "tuned";
    radioTune.disabled = false;
    radioTune.setAttribute("aria-pressed", "false");
    radioPresetButtons.forEach((button) => {
      button.disabled = false;
      button.setAttribute("aria-pressed", String(button.dataset.radioPreset === station));
    });
    if (radioBulletinName) radioBulletinName.textContent = bulletin.name;
    if (radioBulletinValue) radioBulletinValue.textContent = bulletin.value;
    if (radioBulletinMeasure) radioBulletinMeasure.textContent = bulletin.measure;
    radioStatus.textContent = `Locked · ${station.toUpperCase()}`;
  };
  if (prefersReducedMotion.matches) lockSignal();
  else radioTuneTimer = window.setTimeout(lockSignal, 1900);
}

function lorenzStep([x, y, z], dt) {
  const derivative = ([a, b, c]) => [10 * (b - a), a * (28 - c) - b, a * b - (8 / 3) * c];
  const add = (state, delta, scale) => state.map((value, index) => value + delta[index] * scale);
  const k1 = derivative([x, y, z]);
  const k2 = derivative(add([x, y, z], k1, dt / 2));
  const k3 = derivative(add([x, y, z], k2, dt / 2));
  const k4 = derivative(add([x, y, z], k3, dt));
  return [x, y, z].map((value, index) => value + (dt / 6) * (k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index]));
}

function buildLorenz(start) {
  const points = [start];
  for (let index = 1; index < 2200; index += 1) points.push(lorenzStep(points[index - 1], 0.009));
  return points;
}

const exactTrajectory = buildLorenz([0.506127, 0, 25]);
const roundedTrajectory = buildLorenz([0.506, 0, 25]);
const allLorenzPoints = [...exactTrajectory, ...roundedTrajectory];
const lorenzSeparationValues = exactTrajectory.map((point, index) => Math.log10(Math.hypot(...point.map((value, axis) => value - roundedTrajectory[index][axis])) + 0.000001));
const lorenzSeparationMin = Math.min(...lorenzSeparationValues);
const lorenzSeparationMax = Math.max(...lorenzSeparationValues);
const lorenzBounds = {
  minX: Math.min(...allLorenzPoints.map((point) => point[0])),
  maxX: Math.max(...allLorenzPoints.map((point) => point[0])),
  minZ: Math.min(...allLorenzPoints.map((point) => point[2])),
  maxZ: Math.max(...allLorenzPoints.map((point) => point[2])),
};
const projectLorenz = ([x, , z]) => [
  28 + ((x - lorenzBounds.minX) / (lorenzBounds.maxX - lorenzBounds.minX)) * 664,
  332 - ((z - lorenzBounds.minZ) / (lorenzBounds.maxZ - lorenzBounds.minZ)) * 304,
];

function renderLorenz() {
  if (!lorenzTime || !lorenzExact || !lorenzRounded) return;
  const end = Math.max(2, Math.round((Number(lorenzTime.value) / 100) * (exactTrajectory.length - 1)));
  const pathFor = (points) => {
    const commands = [];
    for (let index = 0; index <= end; index += 3) commands.push(`${commands.length ? "L" : "M"}${projectLorenz(points[index]).map((value) => value.toFixed(1)).join(" ")}`);
    if (end % 3) commands.push(`L${projectLorenz(points[end]).map((value) => value.toFixed(1)).join(" ")}`);
    return commands.join(" ");
  };
  lorenzExact.setAttribute("d", pathFor(exactTrajectory));
  lorenzRounded.setAttribute("d", lorenzReleased ? pathFor(roundedTrajectory) : "");
  if (lorenzSeparationPath) {
    const separationCommands = [];
    if (lorenzReleased) for (let index = 0; index <= end; index += 3) {
      const value = lorenzSeparationValues[index];
      const x = 20 + (index / (lorenzSeparationValues.length - 1)) * 680;
      const y = 76 - ((value - lorenzSeparationMin) / (lorenzSeparationMax - lorenzSeparationMin)) * 62;
      separationCommands.push(`${separationCommands.length ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    const separationPath = separationCommands.join(" ");
    lorenzSeparationPath.setAttribute("d", separationPath);
  }
  const exactPoint = projectLorenz(exactTrajectory[end]);
  const roundedPoint = projectLorenz(lorenzReleased ? roundedTrajectory[end] : exactTrajectory[end]);
  [lorenzExactDot, lorenzRoundedDot].forEach((dot, index) => {
    const point = index ? roundedPoint : exactPoint;
    dot?.setAttribute("cx", point[0].toFixed(1));
    dot?.setAttribute("cy", point[1].toFixed(1));
  });
  const separation = lorenzReleased ? Math.hypot(...exactTrajectory[end].map((value, index) => value - roundedTrajectory[end][index])) : 0;
  if (lorenzDistance) lorenzDistance.textContent = `state-space separation ${separation.toFixed(3)}`;
  if (lorenzTimeLabel) lorenzTimeLabel.textContent = `${lorenzTime.value}%`;
}

let lorenzPlaying = false;
let lorenzReleased = false;
let lorenzFrame = 0;
let lorenzLastTime = 0;
let lorenzLastRenderTime = 0;

function setLorenzPlaying(playing) {
  lorenzPlaying = playing;
  lorenzPlay?.setAttribute("aria-pressed", String(playing));
  if (lorenzPlay) lorenzPlay.textContent = playing ? "Pause" : Number(lorenzTime?.value) >= 100 ? "Replay" : "Play";
  if (playing && !lorenzFrame) lorenzFrame = window.requestAnimationFrame(advanceLorenz);
}

function advanceLorenz(timestamp) {
  if (!lorenzPlaying || !lorenzTime) {
    lorenzFrame = 0;
    lorenzLastTime = 0;
    lorenzLastRenderTime = 0;
    return;
  }
  if (!lorenzLastTime) lorenzLastTime = timestamp;
  const elapsed = Math.min(80, timestamp - lorenzLastTime);
  lorenzLastTime = timestamp;
  lorenzTime.value = String(Math.min(100, Number(lorenzTime.value) + elapsed / 120));
  if (!lorenzLastRenderTime || timestamp - lorenzLastRenderTime >= 34 || Number(lorenzTime.value) >= 100) {
    renderLorenz();
    lorenzLastRenderTime = timestamp;
  }
  if (Number(lorenzTime.value) >= 100) {
    setLorenzPlaying(false);
    lorenzFrame = 0;
    return;
  }
  lorenzFrame = window.requestAnimationFrame(advanceLorenz);
}

function restartLorenz(playing = true) {
  if (!lorenzTime) return;
  lorenzTime.value = "0";
  lorenzLastTime = 0;
  lorenzLastRenderTime = 0;
  renderLorenz();
  setLorenzPlaying(playing);
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("in-view")),
    { threshold: 0.12, rootMargin: "0px 0px -7% 0px" },
  );
  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("in-view"));
}
openButton?.addEventListener("click", openStory);
replayButton?.addEventListener("click", replayStory);
japaneseToggle?.addEventListener("click", () => setJapaneseOpen(japaneseArticle?.hidden ?? true));
japaneseClose?.addEventListener("click", () => setJapaneseOpen(false));
empathyButtons.forEach((button) => button.addEventListener("click", () => setEmpathyChoice(button.dataset.empathyChoice)));
empathyReset?.addEventListener("click", resetEmpathyArcade);
realityAction?.addEventListener("click", () => {
  if (realityState === "briefing") startRealityDeployment();
  else if (realityState === "incident") rerunRealityDeployment();
});
realityReset?.addEventListener("click", resetRealityCase);
realityHotspots.forEach((button) => button.addEventListener("click", () => collectRealityEvidence(button.dataset.realityClue)));
rankingButtons.forEach((button) => button.addEventListener("click", () => setRanking(button.dataset.ranking)));
learningButtons.forEach((button) => button.addEventListener("click", () => setLearningMode(button.dataset.learning)));
radioTune?.addEventListener("click", () => tuneDispatchRadio());
radioPresetButtons.forEach((button) => button.addEventListener("click", () => tuneDispatchRadio(button.dataset.radioPreset)));
lorenzTime?.addEventListener("input", renderLorenz);
lorenzPlay?.addEventListener("click", () => {
  if (Number(lorenzTime?.value) >= 100) restartLorenz(true);
  else setLorenzPlaying(!lorenzPlaying);
});
lorenzRound?.addEventListener("click", () => {
  lorenzReleased = true;
  lorenzLab?.setAttribute("data-released", "true");
  restartLorenz(true);
});
lorenzRewind?.addEventListener("click", () => restartLorenz(false));
resolveMemory?.addEventListener("click", () => {
  resolveMemory.textContent = "Resolved · current fact retained";
  resolveMemory.setAttribute("disabled", "");
});
window.addEventListener("keydown", handleDialogKeydown);
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();
storyMain?.setAttribute("inert", "");
japaneseToggle?.setAttribute("inert", "");
archiveBack?.setAttribute("inert", "");
document.querySelector("h1")?.setAttribute("tabindex", "-1");
renderLorenz();
lorenzLab?.setAttribute("data-released", "false");
resetRealityCase();
setRanking("baseline");
setLearningMode("backprop");
renderEmpathyArcade();
if (lorenzLab && !prefersReducedMotion.matches) {
  const lorenzObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      setLorenzPlaying(true);
      lorenzObserver.disconnect();
    }
  }, { threshold: 0.3 });
  lorenzObserver.observe(lorenzLab);
}
