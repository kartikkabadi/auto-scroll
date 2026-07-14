# Skill: Release Auto Scroll extension

## When to use
Use this skill when the user wants to package the Auto Scroll Chrome extension for a release or the Chrome Web Store.

## Steps
1. Run `npm run lint` and fix any lint errors.
2. Run `npm run test` and fix any test failures.
3. Run `npm run zip` to build `dist/` and produce `dist.zip`.
4. Verify `dist.zip` contains at the root: `manifest.json`, `popup.html`, `popup.css`, `popup.js`, `background.js`, `scroll-api.js`, and `icons/`.
5. Report the manifest version and the `dist.zip` path.
