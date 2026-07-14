import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { vi } from "vitest";
import { callScrollApi } from "../src/lib/api.js";

describe("callScrollApi", () => {
  const executeScriptCalls = [];

  beforeEach(() => {
    executeScriptCalls.length = 0;
    globalThis.chrome = {
      scripting: {
        executeScript: vi.fn(async (args) => {
          executeScriptCalls.push(args);
          if (args.files) {
            return [{}];
          }
          const { func, args: [method, methodArgs] } = args;
          const result = func(method, methodArgs);
          return [{ result }];
        }),
      },
    };
  });

  afterEach(() => {
    delete globalThis.chrome;
  });

  it("injects the scroll API and proxies the toggle result", async () => {
    window.__autoScrollExtAPI = {
      toggle: () => ({ ok: true, running: true, speed: 6 }),
    };

    const result = await callScrollApi(42, "toggle");

    expect(result).toEqual({ ok: true, running: true, speed: 6 });
    expect(executeScriptCalls).toHaveLength(2);
    expect(executeScriptCalls[0].files).toEqual(["scroll-api.js"]);
    expect(executeScriptCalls[1].args).toEqual(["toggle", []]);
  });

  it("returns an error when the page API is not loaded", async () => {
    delete window.__autoScrollExtAPI;

    const result = await callScrollApi(42, "toggle");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Auto Scroll API not loaded");
  });
});
