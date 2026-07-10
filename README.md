# Auto Scroll

A tiny Chrome extension that scrolls the current page for you. Set the speed, hit Start, and it keeps going — even after you close the popup. When it hits the bottom, it jumps back to the top and loops.

<p align="center">
  <img src="docs/screenshot.png" alt="Auto Scroll popup" width="280" />
</p>

## Install

1. Clone this repo (or [download the ZIP](https://github.com/kartikkabadi/auto-scroll/archive/refs/heads/main.zip) and unzip it)
2. Open Chrome → `chrome://extensions`
3. Turn on **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `auto-scroll` folder

## Use

1. Open any normal webpage (`http` / `https`)
2. Click the extension icon
3. Drag the **Speed** slider (1–100)
4. Hit **Start** / **Stop**

Scrolling keeps running after you close the popup. Reopen it to stop or change speed.

## After updating

On `chrome://extensions`, click the reload button on Auto Scroll, then refresh the page you’re testing.

## How it works

The popup injects a small scroll loop into the active tab (`chrome.scripting`). It picks the best scrollable target on the page (document or a large overflow container), advances at a steady rate, and wraps to the top at the bottom.

## License

[MIT](LICENSE)
