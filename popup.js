const speedEl = document.getElementById("speed");
const speedValueEl = document.getElementById("speedValue");
const toggleEl = document.getElementById("toggle");
const statusEl = document.getElementById("status");

let running = false;

function setStatus(text) {
  if (!text) {
    statusEl.hidden = true;
    statusEl.textContent = "";
    return;
  }
  statusEl.hidden = false;
  statusEl.textContent = text;
}

function render() {
  speedValueEl.textContent = String(speedEl.value);
  toggleEl.textContent = running ? "Stop" : "Start";
  toggleEl.classList.toggle("running", running);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function canInject(url) {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

async function injectAndStart(tabId, speed) {
  // Run scrolling directly in the page — most reliable path.
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    args: [speed],
    func: (speedArg) => {
      const KEY = "__autoScrollExt";
      const existing = window[KEY];
      if (existing?.timerId != null) {
        clearInterval(existing.timerId);
      }

      const state = {
        running: true,
        speed: speedArg,
        timerId: null,
        target: null,
        carry: 0, // banks sub-pixel deltas so slow speeds still move
      };
      window[KEY] = state;

      function pixelsPerSecond(s) {
        // Slider 1–100 → ~12–480 px/s. Speed ~6 ≈ 36 px/s (readable).
        // Linear in slider so every step is usable once carry accumulates.
        return 12 + ((s - 1) / 99) * 468;
      }

      function pixelsPerFrame(s) {
        return pixelsPerSecond(s) / 60; // ~16ms ticks
      }

      function isScrollable(el) {
        if (!el || el === document.body || el === document.documentElement) {
          return false;
        }
        const style = window.getComputedStyle(el);
        const oy = style.overflowY;
        if (oy !== "auto" && oy !== "scroll" && oy !== "overlay") return false;
        return el.scrollHeight > el.clientHeight + 10;
      }

      function documentScrollRoot() {
        const se = document.scrollingElement || document.documentElement;
        if (se.scrollHeight > se.clientHeight + 10) return se;
        if (
          document.documentElement.scrollHeight >
          document.documentElement.clientHeight + 10
        ) {
          return document.documentElement;
        }
        if (
          document.body &&
          document.body.scrollHeight > document.body.clientHeight + 10
        ) {
          return document.body;
        }
        return se;
      }

      function findScrollTarget() {
        let best = null;
        let bestArea = 0;
        for (const el of document.querySelectorAll("body *")) {
          if (!isScrollable(el)) continue;
          const rect = el.getBoundingClientRect();
          const area = Math.max(0, rect.width) * Math.max(0, rect.height);
          if (area > bestArea) {
            bestArea = area;
            best = el;
          }
        }
        const root = documentScrollRoot();
        const rootCanScroll = root.scrollHeight > root.clientHeight + 10;
        if (best && bestArea > window.innerWidth * window.innerHeight * 0.25) {
          if (!rootCanScroll || best.scrollHeight >= root.scrollHeight * 0.8) {
            return best;
          }
        }
        return root;
      }

      function getMaxScroll(el) {
        return Math.max(0, el.scrollHeight - el.clientHeight);
      }

      function step(el, wholePixels) {
        const max = getMaxScroll(el);
        if (max <= 0) return false;

        const isDoc =
          el === document.body ||
          el === document.documentElement ||
          el === document.scrollingElement;

        if (isDoc) {
          const cur = window.scrollY || el.scrollTop || 0;
          if (cur >= max - 1) {
            window.scrollTo(0, 0);
            el.scrollTop = 0;
            state.carry = 0;
          } else {
            const next = Math.min(max, cur + wholePixels);
            window.scrollTo(0, next);
            el.scrollTop = next;
          }
          return true;
        }

        if (el.scrollTop >= max - 1) {
          el.scrollTop = 0;
          state.carry = 0;
        } else {
          el.scrollTop = Math.min(max, el.scrollTop + wholePixels);
        }
        return true;
      }

      function tick() {
        if (!state.running) return;
        if (!state.target || !document.contains(state.target)) {
          state.target = findScrollTarget();
        }

        // Accumulate fractional pixels; browsers ignore sub-pixel scrollTop.
        state.carry += pixelsPerFrame(state.speed);
        const whole = Math.floor(state.carry);
        if (whole < 1) return;
        state.carry -= whole;

        if (!step(state.target, whole)) {
          state.target = findScrollTarget();
          step(state.target, whole);
        }
      }

      state.target = findScrollTarget();
      state.timerId = setInterval(tick, 16);
      return { ok: true, running: true, speed: state.speed };
    },
  });
  return result;
}

async function injectAndStop(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => {
      const KEY = "__autoScrollExt";
      const state = window[KEY];
      if (state) {
        state.running = false;
        if (state.timerId != null) clearInterval(state.timerId);
        state.timerId = null;
      }
      return { ok: true, running: false };
    },
  });
  return result;
}

async function injectSetSpeed(tabId, speed) {
  await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    args: [speed],
    func: (speedArg) => {
      const state = window.__autoScrollExt;
      if (state) state.speed = speedArg;
    },
  });
}

async function injectStatus(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => {
      const state = window.__autoScrollExt;
      if (!state) return { ok: true, running: false, speed: 6 };
      return {
        ok: true,
        running: Boolean(state.running),
        speed: state.speed ?? 6,
      };
    },
  });
  return result;
}

async function init() {
  const tab = await getActiveTab();
  if (!tab?.id || !canInject(tab.url)) {
    setStatus("Open a normal webpage (http/https) to use Auto Scroll.");
    toggleEl.disabled = true;
    speedEl.disabled = true;
    render();
    return;
  }

  try {
    const res = await injectStatus(tab.id);
    if (res?.ok) {
      running = Boolean(res.running);
      if (typeof res.speed === "number") speedEl.value = String(res.speed);
    }
    setStatus("");
  } catch (err) {
    setStatus("Couldn’t reach this page. Try refreshing it.");
    console.error(err);
  }

  render();
}

speedEl.addEventListener("input", async () => {
  render();
  const tab = await getActiveTab();
  if (!tab?.id || !canInject(tab.url) || !running) return;
  try {
    await injectSetSpeed(tab.id, Number(speedEl.value));
  } catch {
    // ignore
  }
});

toggleEl.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id || !canInject(tab.url)) {
    setStatus("Open a normal webpage (http/https) to use Auto Scroll.");
    return;
  }

  toggleEl.disabled = true;
  try {
    const speed = Number(speedEl.value);
    const res = running
      ? await injectAndStop(tab.id)
      : await injectAndStart(tab.id, speed);
    running = Boolean(res?.running);
    setStatus("");
  } catch (err) {
    setStatus("Couldn’t control this page. Try refreshing it.");
    console.error(err);
  } finally {
    toggleEl.disabled = false;
    render();
  }
});

init();
