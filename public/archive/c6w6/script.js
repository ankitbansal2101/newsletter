const cover = document.querySelector(".storybook-cover");
const openButton = document.querySelector(".storybook-open");
const replayButton = document.querySelector(".replay-cover");
const progressBar = document.querySelector(".progress__bar");
const revealTargets = document.querySelectorAll(".reveal");
const stage = document.querySelector("#contactStage");
const stageTitle = document.querySelector("#stageTitle");
const stageCopy = document.querySelector("#stageCopy");
const modeButtons = document.querySelectorAll("[data-mode]");
const japaneseToggle = document.querySelector("#japaneseToggle");
const japaneseArticle = document.querySelector("#japaneseArticle");
const japaneseClose = document.querySelector("#japaneseClose");

const modeCopy = {
  impact: {
    title: "The junebug model",
    copy: "Momentum outpaces awareness. The environment is learned through collision.",
  },
  sensing: {
    title: "The dragonfly model",
    copy: "Air pressure and resistance become signals. The path updates before impact.",
  },
  care: {
    title: "Compassionate orientation",
    copy: "The system absorbs mistakes internally so the world does not have to.",
  },
};

function openStory() {
  cover?.classList.add("is-opening");
  window.setTimeout(() => {
    cover?.classList.add("is-hidden");
    document.body.classList.remove("storybook-lock");
  }, 1050);
}

function replayStory() {
  cover?.classList.remove("is-hidden", "is-opening");
  document.body.classList.add("storybook-lock");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setJapaneseOpen(open) {
  if (!japaneseArticle) return;
  japaneseArticle.hidden = !open;
  japaneseToggle?.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("translation-open", open);
  if (open) japaneseArticle.focus({ preventScroll: true });
}

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const value = scrollable <= 0 ? 0 : (window.scrollY / scrollable) * 100;
  if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, value))}%`;
}

function setMode(mode) {
  if (!stage || !modeCopy[mode]) return;
  stage.classList.remove("mode-impact", "mode-sensing", "mode-care");
  stage.classList.add(`mode-${mode}`);
  stageTitle.textContent = modeCopy[mode].title;
  stageCopy.textContent = modeCopy[mode].copy;
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in-view");
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
);

revealTargets.forEach((target) => revealObserver.observe(target));
modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
openButton?.addEventListener("click", openStory);
replayButton?.addEventListener("click", replayStory);
japaneseToggle?.addEventListener("click", () => setJapaneseOpen(japaneseArticle?.hidden ?? true));
japaneseClose?.addEventListener("click", () => setJapaneseOpen(false));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setJapaneseOpen(false);
});
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();
