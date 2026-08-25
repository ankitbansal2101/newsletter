(() => {
  "use strict";

  const clamp = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value));

  function within(root, selector) {
    return root.querySelector(selector) || document.querySelector(selector);
  }

  function makeLiveRegion(element) {
    if (!element) return;
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    element.setAttribute("aria-atomic", "true");
  }

  function setMeter(element, value, label) {
    if (!element) return;
    const next = clamp(value);
    const isNativeMeter = element.tagName === "METER" || element.tagName === "PROGRESS";
    if (isNativeMeter) {
      element.max = 100;
      element.value = next;
    } else {
      element.style.width = `${next}%`;
    }
    element.style.setProperty("--meter-value", `${next}%`);
    element.dataset.value = String(next);
    element.setAttribute("aria-valuemin", "0");
    element.setAttribute("aria-valuemax", "100");
    element.setAttribute("aria-valuenow", String(next));
    element.setAttribute("aria-valuetext", label || `${next} percent`);
    const meterContainer = element.parentElement?.closest('[role="meter"]');
    if (meterContainer && meterContainer !== element) {
      meterContainer.setAttribute("aria-valuemin", "0");
      meterContainer.setAttribute("aria-valuemax", "100");
      meterContainer.setAttribute("aria-valuenow", String(next));
      meterContainer.setAttribute("aria-valuetext", label || `${next} percent`);
    }
  }

  function setButtonDisabled(button, disabled) {
    if (!button) return;
    if ("disabled" in button) button.disabled = disabled;
    button.setAttribute("aria-disabled", String(disabled));
  }

  function initBaggageGame(game) {
    const actionButtons = [...game.querySelectorAll("[data-baggage-action]")];
    if (!actionButtons.length) return;

    const heardMeter = within(game, "#heardMeter");
    const journeyMeter = within(game, "#journeyMeter");
    const debtBoss = within(game, "#debtBoss");
    const heardValue = within(game, "#heardValue");
    const journeyValue = within(game, "#journeyValue");
    const verdict = within(game, "#baggageVerdict");
    const log = within(game, "#baggageLog");
    const operationalOrder = ["locate", "owner", "delivery"];
    const stageNames = ["missing", "located", "owner-assigned", "delivered"];
    let state;

    makeLiveRegion(log);

    function writeLog(message, reset = false) {
      if (!log) return;
      const copy = `Move ${state.turn}: ${message}`;
      if (log.matches("ol, ul")) {
        if (reset) log.replaceChildren();
        const item = document.createElement("li");
        item.textContent = copy;
        log.append(item);
        while (log.children.length > 6) log.firstElementChild?.remove();
      } else {
        log.textContent = copy;
      }
    }

    function updateButtons() {
      const won = state.stage === operationalOrder.length;
      actionButtons.forEach((button) => {
        const action = button.dataset.baggageAction;
        const operationIndex = operationalOrder.indexOf(action);
        if (operationIndex >= 0) {
          const completed = operationIndex < state.stage;
          button.setAttribute("aria-pressed", String(completed));
          button.classList.toggle("is-complete", completed);
          setButtonDisabled(button, won || operationIndex !== state.stage);
          return;
        }
        if (action === "reset") {
          setButtonDisabled(button, false);
          return;
        }
        setButtonDisabled(button, won);
      });
    }

    function render() {
      const won = state.stage === operationalOrder.length;
      const sufficientlyHeard = state.heard >= 40;
      const resolution = won ? (sufficientlyHeard ? "understood" : "resolved-unheard") : (sufficientlyHeard ? "heard-unresolved" : "open");
      game.dataset.stage = stageNames[state.stage];
      game.dataset.heard = String(state.heard);
      game.dataset.dialogueCount = String(state.dialogueCount);
      game.dataset.journey = String(state.journey);
      game.dataset.debt = String(state.debt);
      game.dataset.resolution = resolution;
      game.classList.toggle("is-won", won);
      setMeter(heardMeter, state.heard, `${state.heard} percent heard`);
      setMeter(journeyMeter, state.journey, `${state.journey} percent of the recovery journey complete`);
      setMeter(debtBoss, state.debt, `${state.debt} percent connection debt remaining`);
      if (heardValue) heardValue.textContent = `${state.heard}%`;
      if (journeyValue) journeyValue.textContent = `${state.journey}%`;
      if (verdict) verdict.textContent = ({ understood: "Heard + changed", "resolved-unheard": "Resolved, not heard", "heard-unresolved": "Heard, not changed", open: "Case open" })[resolution];
      updateButtons();
    }

    function reset() {
      state = { heard: 0, journey: 0, debt: 60, stage: 0, turn: 0, dialogueCount: 0 };
      render();
      writeLog("Bag missing. Polished words can raise Heard; only Locate → Assign owner → Schedule delivery completes the quest.", true);
    }

    function useDialogue(action) {
      const dialogue = {
        apology: { heard: 24, debt: 3, copy: "Beautiful apology received. The bag has not moved." },
        reassure: { heard: 18, debt: 2, copy: "Reassurance received. The carousel is still empty." },
        repeat: { heard: 10, debt: 16, copy: "The traveler repeats the story. Heard rises a little; Connection Debt rises sharply." },
      }[action];
      if (!dialogue) return false;
      state.dialogueCount = Math.min(3, state.dialogueCount + 1);
      state.heard = clamp(state.heard + dialogue.heard);
      state.debt = clamp(state.debt + dialogue.debt);
      writeLog(dialogue.copy);
      return true;
    }

    function useOperation(action) {
      const expected = operationalOrder[state.stage];
      if (!expected) return;
      if (action !== expected) {
        const nextLabels = { locate: "locate the bag", owner: "assign an owner", delivery: "schedule delivery" };
        state.debt = clamp(state.debt + 6);
        writeLog(`Action blocked. First ${nextLabels[expected]}. Skipping operational context adds debt.`);
        return;
      }

      state.stage += 1;
      const operations = {
        locate: { journey: 34, debt: 40, copy: "Bag located at the transfer airport. Reality has changed." },
        owner: { journey: 67, debt: 20, copy: "A named recovery owner accepts the case. The handoff now has accountability." },
        delivery: { journey: 100, debt: 0, copy: state.heard >= 40 ? "Delivery scheduled and confirmed. The customer was acknowledged and the transaction changed." : "Delivery scheduled and confirmed. The bag is resolved—but the customer was never meaningfully acknowledged." },
      };
      const next = operations[action];
      state.journey = next.journey;
      state.debt = action === "delivery" && state.heard < 40 ? 22 : Math.min(state.debt, next.debt);
      writeLog(next.copy);
    }

    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.baggageAction;
        if (!action) return;
        if (action === "reset") {
          reset();
          return;
        }
        state.turn += 1;
        if (!useDialogue(action)) useOperation(action);
        render();
      });
    });

    reset();
  }

  const PERSON_POSITIONS = {
    familiar: { x: 22, y: 23, label: "the familiar path" },
    explore: { x: 78, y: 23, label: "new territory" },
    quiet: { x: 22, y: 77, label: "quiet time" },
    social: { x: 78, y: 77, label: "a social gathering" },
  };

  const RECOMMENDATIONS = {
    familiar: "Downstream recommendation: repeat the usual favorites.",
    explore: "Downstream recommendation: surface unfamiliar places and ideas.",
    quiet: "Downstream recommendation: protect low-stimulation time.",
    social: "Downstream recommendation: suggest people and shared events.",
  };

  function initShadowGame(game) {
    const targetButtons = [...game.querySelectorAll("[data-person-target]")];
    const actionButtons = [...game.querySelectorAll("[data-profile-action]")];
    if (!targetButtons.length && !actionButtons.length) return;

    const person = within(game, "#personNow");
    const shadow = within(game, "#profileShadow");
    const thread = within(game, "#shadowThread");
    const outcome = within(game, "#shadowOutcome");
    const recommendation = within(game, "#shadowRecommendation");
    let state;

    makeLiveRegion(outcome);

    function place(element, target, kind) {
      if (!element || !target || !PERSON_POSITIONS[target]) return;
      const point = PERSON_POSITIONS[target];
      element.dataset.target = target;
      element.style.left = `${point.x}%`;
      element.style.top = `${point.y}%`;
      element.style.setProperty(`--${kind}-x`, `${point.x}%`);
      element.style.setProperty(`--${kind}-y`, `${point.y}%`);
      element.setAttribute("aria-label", `${kind === "person" ? "Person now" : "Stored profile"}: ${point.label}`);
    }

    function updateThread() {
      if (!thread) return;
      const currentPoint = PERSON_POSITIONS[state.person];
      const profilePoint = PERSON_POSITIONS[state.profile];
      const hasProfile = Boolean(profilePoint) && (state.profileState === "stale" || state.profileState === "current");
      thread.dataset.from = hasProfile ? state.profile : state.profileState;
      thread.dataset.to = state.person;
      thread.dataset.connected = String(hasProfile);
      thread.classList.toggle("is-diverged", hasProfile && state.profile !== state.person);
      thread.classList.toggle("is-aligned", hasProfile && state.profile === state.person);
      thread.style.setProperty("--thread-x1", `${hasProfile ? profilePoint.x : currentPoint.x}%`);
      thread.style.setProperty("--thread-y1", `${hasProfile ? profilePoint.y : currentPoint.y}%`);
      thread.style.setProperty("--thread-x2", `${currentPoint.x}%`);
      thread.style.setProperty("--thread-y2", `${currentPoint.y}%`);

      if (thread instanceof SVGElement) {
        const x1 = hasProfile ? profilePoint.x : currentPoint.x;
        const y1 = hasProfile ? profilePoint.y : currentPoint.y;
        const shape = thread.matches("line, path") ? thread : thread.querySelector("line, path");
        if (shape?.tagName.toLowerCase() === "line") {
          shape.setAttribute("x1", String(x1));
          shape.setAttribute("y1", String(y1));
          shape.setAttribute("x2", String(currentPoint.x));
          shape.setAttribute("y2", String(currentPoint.y));
        } else if (shape?.tagName.toLowerCase() === "path") {
          shape.setAttribute("d", `M ${x1} ${y1} L ${currentPoint.x} ${currentPoint.y}`);
        }
        thread.setAttribute("aria-label", hasProfile ? `Stored profile points from ${state.profile} to current ${state.person}` : "No stored profile is connected");
      } else {
        const profileLabel = hasProfile ? PERSON_POSITIONS[state.profile].label : `${state.profileState} profile`;
        thread.textContent = `PROFILE: ${profileLabel} → NOW: ${currentPoint.label}`;
      }
    }

    function currentRecommendation() {
      if (state.profileState === "forgotten") return "Downstream recommendation: start neutral and ask what fits now.";
      if (state.profileState === "private") return "Downstream recommendation: use no private profile signal; offer context-free choices.";
      if (state.profileState === "corrected") return "Downstream recommendation: retire the old assumption and ask before saving a replacement.";
      return RECOMMENDATIONS[state.profile];
    }

    function render() {
      const hasProfile = state.profileState === "stale" || state.profileState === "current";
      const aligned = hasProfile && state.profile === state.person;
      game.dataset.person = state.person;
      game.dataset.personPosition = state.person;
      game.dataset.profile = hasProfile ? state.profile : state.profileState;
      game.dataset.profilePosition = hasProfile ? state.profile : state.profileState;
      game.dataset.profileState = state.profileState;
      game.dataset.action = state.action;
      game.dataset.aligned = String(aligned);
      game.classList.toggle("is-aligned", aligned);
      game.classList.toggle("is-diverged", hasProfile && !aligned);
      game.classList.toggle("is-forgotten", state.profileState === "forgotten");
      game.classList.toggle("is-private", state.profileState === "private");
      place(person, state.person, "person");
      if (hasProfile) place(shadow, state.profile, "profile");
      if (shadow) {
        shadow.dataset.state = state.profileState;
        shadow.setAttribute("aria-hidden", String(!hasProfile));
      }
      updateThread();
      if (recommendation) recommendation.textContent = currentRecommendation().replace("Downstream recommendation: ", "");
      targetButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.personTarget === state.person)));
      actionButtons.forEach((button) => {
        const action = button.dataset.profileAction;
        if (action !== "reset") button.setAttribute("aria-pressed", String(action === state.action));
      });
    }

    function reset() {
      state = { person: "familiar", profile: "familiar", profileState: "stale", action: "reset" };
      render();
      if (outcome) outcome.textContent = "The model and person begin together. Choose where the person goes next; the stored profile will stay behind.";
    }

    function chooseTarget(target) {
      if (!PERSON_POSITIONS[target]) return;
      state.person = target;
      if (state.profileState === "current" && state.profile !== target) state.profileState = "stale";
      state.action = "move";
      render();
      if (!outcome) return;
      const staleRecommendation = currentRecommendation();
      outcome.textContent = (state.profileState === "stale" || state.profileState === "current") && state.profile !== state.person
        ? `You moved to ${PERSON_POSITIONS[target].label}. The shadow stayed with ${PERSON_POSITIONS[state.profile].label}. ${staleRecommendation}`
        : `You moved to ${PERSON_POSITIONS[target].label}. ${staleRecommendation}`;
    }

    function updateProfile(action) {
      if (action === "reset") {
        reset();
        return;
      }
      state.action = action;
      if (action === "correct") {
        state.profileState = "corrected";
        render();
        if (outcome) outcome.textContent = `Correction accepted. The old assumption is retired without silently turning today’s choice into a permanent trait. ${currentRecommendation()}`;
      } else if (action === "confirm") {
        state.profile = state.person;
        state.profileState = "current";
        render();
        if (outcome) outcome.textContent = `Current preference confirmed with permission. ${currentRecommendation()}`;
      } else if (action === "forget") {
        state.profileState = "forgotten";
        render();
        if (outcome) outcome.textContent = `The old preference was forgotten. ${currentRecommendation()}`;
      } else if (action === "private") {
        state.profileState = "private";
        render();
        if (outcome) outcome.textContent = `This preference stays private and is not used for personalization. ${currentRecommendation()}`;
      }
    }

    targetButtons.forEach((button) => button.addEventListener("click", () => chooseTarget(button.dataset.personTarget)));
    actionButtons.forEach((button) => button.addEventListener("click", () => updateProfile(button.dataset.profileAction)));
    reset();
  }

  function initMemoryDungeon(game) {
    const itemButtons = [...game.querySelectorAll("[data-memory-item]")];
    if (!itemButtons.length) return;

    const enterButton = within(game, "#enterDungeon");
    const resetButton = within(game, "#resetDungeon");
    const outcome = within(game, "#dungeonOutcome");
    const npc = within(game, "#dungeonNpc");
    const gate = within(game, "#dungeonGate");
    const packSlots = [...game.querySelectorAll(".dungeon-pack span")];
    const selected = new Set();
    const allowedItems = new Set(["allergy", "old-job", "new-job", "route", "anxiety"]);

    makeLiveRegion(outcome);

    function setGate(state, label) {
      if (!gate) return;
      gate.dataset.state = state;
      gate.classList.toggle("is-open", state === "open");
      gate.classList.toggle("is-blocked", state === "blocked");
      gate.classList.toggle("is-locked", state === "locked");
      gate.setAttribute("aria-label", label);
      gate.setAttribute("aria-live", "polite");
    }

    function renderSelection() {
      itemButtons.forEach((button) => {
        const isSelected = selected.has(button.dataset.memoryItem);
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      });
      game.dataset.selected = [...selected].join(" ");
      game.dataset.count = String(selected.size);
      const chosenItems = [...selected];
      packSlots.forEach((slot, index) => {
        const item = chosenItems[index];
        const source = itemButtons.find((button) => button.dataset.memoryItem === item);
        slot.textContent = source?.querySelector("strong")?.textContent?.trim() || "empty";
        slot.dataset.item = item || "empty";
        slot.classList.toggle("is-filled", Boolean(item));
      });
      if (enterButton) setButtonDisabled(enterButton, selected.size === 0);
    }

    function resetEvaluation() {
      game.dataset.result = "unevaluated";
      setGate("locked", "Dungeon gate locked; choose up to three memories, then test the inventory");
    }

    function toggleItem(item) {
      if (!allowedItems.has(item)) return;
      if (selected.has(item)) {
        selected.delete(item);
        if (outcome) outcome.textContent = `${selected.size} of 3 inventory slots filled. Memory removed.`;
      } else if (selected.size >= 3) {
        if (outcome) outcome.textContent = "Inventory full: remove one memory before selecting another. Maximum 3.";
        game.classList.remove("is-over-limit");
        window.requestAnimationFrame(() => game.classList.add("is-over-limit"));
        return;
      } else {
        selected.add(item);
        if (outcome) outcome.textContent = `${selected.size} of 3 inventory slots filled.`;
      }
      game.classList.remove("is-over-limit");
      resetEvaluation();
      renderSelection();
    }

    function evaluate() {
      const missingAllergy = !selected.has("allergy");
      const hasOldJob = selected.has("old-job");
      const missingNewJob = !selected.has("new-job");
      const hasAnxiety = selected.has("anxiety");
      const ideal = !missingAllergy && !hasOldJob && !missingNewJob && !hasAnxiety;

      if (ideal) {
        game.dataset.result = "ideal";
        setGate("open", "Dungeon gate open; inventory is safe, current, and permission-aware");
        if (npc) {
          const npcCopy = npc.querySelector("span") || npc;
          npcCopy.textContent = "Welcome to Field Notes. Your current role is loaded, and clinic intake flags penicillin before treatment.";
        }
        if (outcome) outcome.textContent = "Gate open. The inventory kept an evergreen safety fact and the current job without carrying stale or private context.";
        return;
      }

      const warnings = [];
      if (missingAllergy) warnings.push("Safety warning: the evergreen allergy fact is missing.");
      if (hasOldJob) warnings.push("Wrong profile: the agent routed you to the old job.");
      if (hasAnxiety) warnings.push("Privacy violation: a sensitive anxiety note was carried without a present need.");
      if (missingNewJob) warnings.push("Stale context: the current job is missing.");
      game.dataset.result = "blocked";
      setGate("blocked", "Dungeon gate blocked; the selected memory inventory failed its context check");
      if (outcome) outcome.textContent = warnings.join(" ");
      if (npc) {
        const npcCopy = npc.querySelector("span") || npc;
        if (missingAllergy) npcCopy.textContent = "Clinic intake opened without the penicillin safety alert.";
        else if (hasOldJob) npcCopy.textContent = "Your meeting is ready at the company you already left.";
        else if (hasAnxiety) npcCopy.textContent = "I announced a private note that was irrelevant to this room.";
        else npcCopy.textContent = "I cannot tailor this encounter because your current role is missing.";
      }
    }

    function reset() {
      selected.clear();
      game.classList.remove("is-over-limit");
      renderSelection();
      resetEvaluation();
      if (outcome) outcome.textContent = "Choose up to 3 memories. The gate rewards freshness, relevance, safety, and permission.";
      if (npc) (npc.querySelector("span") || npc).textContent = "Pack carefully. More memory is not always better memory.";
    }

    itemButtons.forEach((button) => button.addEventListener("click", () => toggleItem(button.dataset.memoryItem)));
    enterButton?.addEventListener("click", evaluate);
    resetButton?.addEventListener("click", reset);
    reset();
  }

  function initAdventureParallax() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".baggage-scene,.shadow-world,.dungeon-board,.reality-scene").forEach((scene) => {
      scene.addEventListener("pointermove", (event) => {
        if (event.pointerType && event.pointerType !== "mouse") return;
        const bounds = scene.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -12;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -8;
        scene.style.setProperty("--scene-x", `${x.toFixed(1)}px`);
        scene.style.setProperty("--scene-y", `${y.toFixed(1)}px`);
      }, { passive: true });
      scene.addEventListener("pointerleave", () => {
        scene.style.setProperty("--scene-x", "0px");
        scene.style.setProperty("--scene-y", "0px");
      }, { passive: true });
    });
  }

  document.querySelectorAll(".baggage-game").forEach(initBaggageGame);
  document.querySelectorAll(".shadow-game").forEach(initShadowGame);
  document.querySelectorAll(".memory-dungeon").forEach(initMemoryDungeon);
  initAdventureParallax();
})();
