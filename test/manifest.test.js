import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("manifest", () => {
  it("src/manifest.json is valid JSON and contains required fields", () => {
    const manifestPath = path.resolve(import.meta.dirname, "../src/manifest.json");
    const raw = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(raw);

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe("Auto Scroll");
    expect(manifest.version).toBe("1.2.0");
    expect(manifest.action.default_popup).toBe("popup.html");
    expect(manifest.permissions).toContain("activeTab");
    expect(manifest.permissions).toContain("scripting");
    expect(manifest.permissions).toContain("storage");
    expect(manifest.commands).toHaveProperty("toggle-auto-scroll");
  });
});
