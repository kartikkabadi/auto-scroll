import { getSpeed, setSpeed } from "./lib/storage.js";
import { callScrollApi } from "./lib/api.js";

const speedEl = document.getElementById("speed");
const speedValueEl = document.getElementById("speedValue");
const toggleEl = document.getElementById("toggle");
const statusEl = document.getElementById("status");

let running = false;

function setStatus(text) {
  if (!text) {
    statusEl.hidden = true;
    statusEl.textContent = "";
    return;
  }
  statusEl.hidden = false;
  statusEl.textContent = text;
}

function render() {
  speedValueEl.textContent = String(speedEl.value);
  toggleEl.textContent = running ? "Stop" : "Start";
  toggleEl.classList.toggle("running", running);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function canInject(url) {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

async function startScroll(tabId, speed) {
  return callScrollApi(tabId, "start", speed);
}

async function stopScroll(tabId) {
  return callScrollApi(tabId, "stop");
}

async function setScrollSpeed(tabId, speed) {
  return callScrollApi(tabId, "setSpeed", speed);
}

async function getScrollStatus(tabId) {
  return callScrollApi(tabId, "getStatus");
}

async function init() {
  const tab = await getActiveTab();
  if (!tab?.id || !canInject(tab.url)) {
    setStatus("Open a normal webpage (http/https) to use Auto Scroll.");
    toggleEl.disabled = true;
    speedEl.disabled = true;
    render();
    return;
  }

  try {
    const savedSpeed = await getSpeed();
    speedEl.value = String(savedSpeed);

    const res = await getScrollStatus(tab.id);
    if (res?.ok) {
      running = Boolean(res.running);
      if (res.running && typeof res.speed === "number") {
        speedEl.value = String(res.speed);
      }
    }
    setStatus("");
  } catch (err) {
    setStatus("Couldn’t reach this page. Try refreshing it.");
    console.error(err);
  }

  render();
}

speedEl.addEventListener("input", async () => {
  render();
  const tab = await getActiveTab();
  if (!tab?.id || !canInject(tab.url)) return;

  const speed = Number(speedEl.value);
  try {
    await setSpeed(speed);
    if (running) {
      await setScrollSpeed(tab.id, speed);
    }
  } catch {
    // ignore
  }
});

toggleEl.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id || !canInject(tab.url)) {
    setStatus("Open a normal webpage (http/https) to use Auto Scroll.");
    return;
  }

  toggleEl.disabled = true;
  try {
    const speed = Number(speedEl.value);
    const res = running
      ? await stopScroll(tab.id)
      : await startScroll(tab.id, speed);
    if (res?.ok) {
      running = Boolean(res.running);
    }
    setStatus("");
  } catch (err) {
    setStatus("Couldn’t control this page. Try refreshing it.");
    console.error(err);
  } finally {
    toggleEl.disabled = false;
    render();
  }
});

init();
