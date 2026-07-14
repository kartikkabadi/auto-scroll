import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createScrollController } from "../src/lib/scroll.js";

function setScrollable(el, scrollHeight, clientHeight) {
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true });
}

describe("createScrollController toggle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    setScrollable(document.documentElement, 1000, 500);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns the start result when toggling on", () => {
    const controller = createScrollController(window, document);
    controller.setSpeed(10);
    const result = controller.toggle();
    expect(result.ok).toBe(true);
    expect(result.running).toBe(true);
    expect(result.speed).toBe(10);
    controller.stop();
  });

  it("returns the stop result when toggling off", () => {
    const controller = createScrollController(window, document);
    controller.setSpeed(15);
    controller.toggle();
    const result = controller.toggle();
    expect(result.ok).toBe(true);
    expect(result.running).toBe(false);
    expect(result.speed).toBe(15);
  });

  it("returns the start error when there is nothing to scroll", () => {
    const controller = createScrollController(window, document);
    setScrollable(document.documentElement, 500, 500);
    const result = controller.toggle();
    expect(result.ok).toBe(false);
    expect(result.running).toBe(false);
    expect(result.error).toBe("Nothing to scroll on this page.");
  });

  it("returns the reduced-motion error when toggling on", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });

    const controller = createScrollController(window, document);
    const result = controller.toggle();
    expect(result.ok).toBe(false);
    expect(result.running).toBe(false);
    expect(result.error).toBe("Reduced motion is enabled.");

    window.matchMedia = originalMatchMedia;
  });
});
