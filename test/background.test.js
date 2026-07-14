import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

let commandHandler = null;

vi.mock("../src/lib/api.js", () => ({
  callScrollApi: vi.fn(),
}));

import { callScrollApi } from "../src/lib/api.js";

beforeAll(async () => {
  globalThis.chrome = {
    tabs: {
      query: vi.fn(async () => [{ id: 123, url: "https://example.com/" }]),
    },
    commands: {
      onCommand: {
        addListener: (fn) => {
          commandHandler = fn;
        },
      },
    },
  };

  await import("../src/background.js");
});

beforeEach(() => {
  callScrollApi.mockReset();
});

describe("background command handler", () => {
  it("calls callScrollApi toggle for toggle-auto-scroll", async () => {
    callScrollApi.mockResolvedValue({ ok: true, running: true });
    await commandHandler("toggle-auto-scroll");

    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(callScrollApi).toHaveBeenCalledWith(123, "toggle");
  });

  it("ignores unknown commands", async () => {
    await commandHandler("unknown-command");
    expect(callScrollApi).not.toHaveBeenCalled();
  });

  it("ignores non-http/https tabs", async () => {
    chrome.tabs.query.mockResolvedValueOnce([{ id: 123, url: "chrome://extensions/" }]);
    await commandHandler("toggle-auto-scroll");
    expect(callScrollApi).not.toHaveBeenCalled();
  });
});
