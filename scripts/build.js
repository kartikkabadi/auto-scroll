import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SRC = path.join(ROOT, "src");
const ICONS = path.join(ROOT, "icons");

const STATIC_FILES = ["manifest.json", "popup.html", "popup.css"];

async function clean() {
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });
}

async function copyStaticFiles() {
  for (const file of STATIC_FILES) {
    await fs.copyFile(path.join(SRC, file), path.join(DIST, file));
  }
}

async function copyIcons() {
  const entries = await fs.readdir(ICONS, { withFileTypes: true });
  await fs.mkdir(path.join(DIST, "icons"), { recursive: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      await fs.copyFile(path.join(ICONS, entry.name), path.join(DIST, "icons", entry.name));
    }
  }
}

async function bundleScript(entry, outFile) {
  await build({
    entryPoints: [path.join(SRC, entry)],
    bundle: true,
    format: "iife",
    outfile: path.join(DIST, outFile),
    platform: "browser",
    target: "chrome120",
  });
}

async function addDirToZip(zip, dir, zipPrefix) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const zipPath = path.join(zipPrefix, entry.name);
    if (entry.isDirectory()) {
      await addDirToZip(zip, fullPath, zipPath);
    } else {
      const data = await fs.readFile(fullPath);
      zip.file(zipPath, data);
    }
  }
}

async function createZip() {
  const zip = new JSZip();
  await addDirToZip(zip, DIST, "");
  const content = await zip.generateAsync({ type: "nodebuffer" });
  await fs.writeFile(path.join(ROOT, "dist.zip"), content);
  console.log("Created dist.zip");
}

async function main() {
  await clean();
  await copyStaticFiles();
  await copyIcons();
  await bundleScript("popup.js", "popup.js");
  await bundleScript("scroll-api.js", "scroll-api.js");
  await bundleScript("background.js", "background.js");
  console.log("Build complete: dist/");

  if (process.argv.includes("zip")) {
    await createZip();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
