export function pixelsPerSecond(s) {
  // Slider 1–100 → ~12–480 px/s. Speed ~6 ≈ 36 px/s (readable).
  // Linear in slider so every step is usable once carry accumulates.
  return 12 + ((s - 1) / 99) * 468;
}

export function pixelsPerFrame(s) {
  return pixelsPerSecond(s) / 60; // ~16ms ticks
}

export function getMaxScroll(el) {
  return Math.max(0, el.scrollHeight - el.clientHeight);
}

export function isScrollable(window, document, el) {
  if (!el || el === document.body || el === document.documentElement) {
    return false;
  }
  const style = window.getComputedStyle(el);
  const oy = style.overflowY;
  if (oy !== "auto" && oy !== "scroll" && oy !== "overlay") return false;
  return el.scrollHeight > el.clientHeight + 10;
}

export function documentScrollRoot(document) {
  const se = document.scrollingElement || document.documentElement;
  if (se.scrollHeight > se.clientHeight + 10) return se;
  if (document.documentElement.scrollHeight > document.documentElement.clientHeight + 10) {
    return document.documentElement;
  }
  if (document.body && document.body.scrollHeight > document.body.clientHeight + 10) {
    return document.body;
  }
  return se;
}

export function findScrollTarget(window, document) {
  let best = null;
  let bestArea = 0;
  for (const el of document.querySelectorAll("body *")) {
    if (!isScrollable(window, document, el)) continue;
    const rect = el.getBoundingClientRect();
    const area = Math.max(0, rect.width) * Math.max(0, rect.height);
    if (area > bestArea) {
      bestArea = area;
      best = el;
    }
  }
  const root = documentScrollRoot(document);
  const rootCanScroll = root.scrollHeight > root.clientHeight + 10;
  if (best && bestArea > window.innerWidth * window.innerHeight * 0.25) {
    if (!rootCanScroll || best.scrollHeight >= root.scrollHeight * 0.8) {
      return best;
    }
  }
  return root;
}

export function createScrollController(window, document, options = {}) {
  const rAF = options.requestAnimationFrame || window.requestAnimationFrame;
  const cAF = options.cancelAnimationFrame || window.cancelAnimationFrame;

  const state = {
    running: false,
    speed: 6,
    target: null,
    carry: 0,
    rafId: null,
    licensed: false,
  };

  function getStatus() {
    return {
      ok: true,
      running: state.running,
      speed: state.speed,
      licensed: state.licensed,
    };
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

    state.rafId = rAF(tick);

    if (!state.target || !document.contains(state.target)) {
      state.target = findScrollTarget(window, document);
    }

    state.carry += pixelsPerFrame(state.speed);
    const whole = Math.floor(state.carry);
    if (whole < 1) return;
    state.carry -= whole;

    if (!step(state.target, whole)) {
      state.target = findScrollTarget(window, document);
      step(state.target, whole);
    }
  }

  function start(speed) {
    if (state.rafId != null) {
      cAF(state.rafId);
      state.rafId = null;
    }

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return { ...getStatus(), running: false, error: "Reduced motion is enabled." };
    }

    state.running = true;
    state.speed = speed;
    state.target = findScrollTarget(window, document);
    state.rafId = rAF(tick);
    return getStatus();
  }

  function stop() {
    state.running = false;
    if (state.rafId != null) {
      cAF(state.rafId);
      state.rafId = null;
    }
    return getStatus();
  }

  function setSpeed(speed) {
    state.speed = speed;
    return getStatus();
  }

  function toggle() {
    if (state.running) {
      stop();
    } else {
      start(state.speed);
    }
    return getStatus();
  }

  return { start, stop, setSpeed, getStatus, toggle };
}
