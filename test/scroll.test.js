import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createScrollController,
  findScrollTarget,
  isScrollable,
  getMaxScroll,
  pixelsPerSecond,
  pixelsPerFrame,
} from "../src/lib/scroll.js";

function setScrollable(el, scrollHeight, clientHeight) {
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true });
}

describe("scroll math", () => {
  it("maps speed 1 to 12 px/s", () => {
    expect(pixelsPerSecond(1)).toBe(12);
  });

  it("maps speed 100 to 480 px/s", () => {
    expect(pixelsPerSecond(100)).toBe(480);
  });

  it("computes pixels per frame at 60 fps", () => {
    expect(pixelsPerFrame(1)).toBe(12 / 60);
    expect(pixelsPerFrame(100)).toBe(480 / 60);
  });

  it("max scroll is zero when there is no scroll room", () => {
    const el = document.createElement("div");
    setScrollable(el, 100, 100);
    expect(getMaxScroll(el)).toBe(0);
  });

  it("max scroll is positive when scroll room exists", () => {
    const el = document.createElement("div");
    setScrollable(el, 500, 100);
    expect(getMaxScroll(el)).toBe(400);
  });
});

describe("isScrollable", () => {
  it("returns false for document.body and document.documentElement", () => {
    expect(isScrollable(window, document, document.body)).toBe(false);
    expect(isScrollable(window, document, document.documentElement)).toBe(false);
  });

  it("returns false when overflow is hidden", () => {
    const el = document.createElement("div");
    el.style.overflowY = "hidden";
    setScrollable(el, 500, 100);
    expect(isScrollable(window, document, el)).toBe(false);
  });

  it("returns true when overflow is auto and content overflows", () => {
    const el = document.createElement("div");
    el.style.overflowY = "auto";
    setScrollable(el, 500, 100);
    expect(isScrollable(window, document, el)).toBe(true);
  });
});

describe("findScrollTarget", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    setScrollable(document.documentElement, 1000, 500);
  });

  it("returns the document root when there are no scrollable elements", () => {
    expect(findScrollTarget(window, document)).toBe(document.documentElement);
  });
});

describe("createScrollController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    setScrollable(document.documentElement, 1000, 500);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts and stops scrolling", async () => {
    const controller = createScrollController(window, document);
    expect(controller.getStatus()).toEqual({
      ok: true,
      running: false,
      speed: 6,
    });

    controller.start(10);
    expect(controller.getStatus().running).toBe(true);

    // First tick accumulates carry; second tick scrolls by at least one pixel.
    await vi.advanceTimersByTimeAsync(16);
    await vi.advanceTimersByTimeAsync(16);
    expect(document.documentElement.scrollTop).toBeGreaterThan(0);

    controller.stop();
    expect(controller.getStatus().running).toBe(false);
  });

  it("changes speed without starting", () => {
    const controller = createScrollController(window, document);
    controller.setSpeed(20);
    expect(controller.getStatus().speed).toBe(20);
    expect(controller.getStatus().running).toBe(false);
  });

  it("toggles state", () => {
    const controller = createScrollController(window, document);
    controller.toggle();
    expect(controller.getStatus().running).toBe(true);
    controller.toggle();
    expect(controller.getStatus().running).toBe(false);
  });
});
