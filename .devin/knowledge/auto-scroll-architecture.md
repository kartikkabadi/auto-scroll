# Auto Scroll extension architecture

## Overview
Auto Scroll is a Manifest V3 Chrome extension. The source lives in `src/` and the build output in `dist/`.

## Control flow
- `src/popup.js` (popup page) calls `src/lib/api.js` → `chrome.scripting.executeScript` to inject `src/scroll-api.js` into the active tab in the `MAIN` world.
- `src/scroll-api.js` creates a single `window.__autoScrollExtAPI` object via `createScrollController` from `src/lib/scroll.js`.
- `src/popup.js` then calls `window.__autoScrollExtAPI.start(speed)`, `stop()`, `setSpeed(speed)`, or `getStatus()` to control scrolling.
- `src/background.js` (service worker) listens for the `toggle-auto-scroll` command and calls the same API on the active tab.
- `src/lib/storage.js` persists speed and license data in `chrome.storage.local`.
- `src/lib/license.js` is currently a stub that accepts any non-empty key; real validation should be added in Phase 2.

## Build and test
- `npm run build` bundles `src/*.js` into `dist/` and copies static files from `src/` plus `icons/`.
- `npm run zip` produces `dist.zip` for the Chrome Web Store.
- `npm run test` runs Vitest with jsdom.
- `npm run lint` runs ESLint on `src/`, `scripts/`, and `test/`.

## Loading the extension
After `npm run build`, load `dist/` as an unpacked extension from `chrome://extensions` with Developer mode on.

## Key symbols
- `createScrollController(window, document, options)` in `src/lib/scroll.js` — the main scroll engine.
- `callScrollApi(tabId, method, ...args)` in `src/lib/api.js` — popup/background bridge to the page API.
- `window.__autoScrollExtAPI` — the API surface exposed in the page after `scroll-api.js` is injected.

## Notes
- The scroll engine uses `requestAnimationFrame` instead of `setInterval`.
- The extension respects `prefers-reduced-motion: reduce` and will not start scrolling when that preference is set.
- The content script is injected on demand via `chrome.scripting` so permissions are minimal (`activeTab`, `scripting`, `storage`).
