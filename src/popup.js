import { getSpeed, setSpeed } from "./lib/storage.js";
import { callScrollApi } from "./lib/api.js";

const speedEl = document.getElementById("speed");
const speedValueEl = document.getElementById("speedValue");
const toggleEl = document.getElementById("toggle");
const shareEl = document.getElementById("share");
const statusEl = document.getElementById("status");

let running = false;

function setStatus(text, type = "") {
  if (!text) {
    statusEl.hidden = true;
    statusEl.textContent = "";
    statusEl.className = "status";
    return;
  }
  statusEl.hidden = false;
  statusEl.textContent = text;
  statusEl.className = `status ${type}`.trim();
}

function render() {
  speedValueEl.textContent = String(speedEl.value);
  toggleEl.textContent = running ? "Stop" : "Start";
  toggleEl.classList.toggle("running", running);
  toggleEl.setAttribute("aria-pressed", String(running));
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

async function shareExtension() {
  const url = "https://github.com/kartikkabadi/auto-scroll";
  const data = {
    title: "Auto Scroll",
    text: "Try this free auto-scroll Chrome extension",
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied to clipboard", "info");
    }
  } catch {
    // User cancelled share or the browser does not support sharing.
  }
}

function handleResponse(res) {
  if (!res?.ok) {
    setStatus(res?.error || "Couldn’t control this page. Try refreshing it.", "error");
    return false;
  }
  return true;
}

async function init() {
  const tab = await getActiveTab();
  if (!tab?.id || !canInject(tab.url)) {
    setStatus("Open a normal webpage (http/https) to use Auto Scroll.", "info");
    toggleEl.disabled = true;
    speedEl.disabled = true;
    render();
    return;
  }

  toggleEl.disabled = false;
  speedEl.disabled = false;

  try {
    const savedSpeed = await getSpeed();
    speedEl.value = String(savedSpeed);

    const res = await getScrollStatus(tab.id);
    if (handleResponse(res)) {
      running = Boolean(res.running);
      if (res.running && typeof res.speed === "number") {
        speedEl.value = String(res.speed);
      }
      if (running) {
        setStatus("Scrolling", "info");
      } else {
        setStatus("");
      }
    }
  } catch (err) {
    setStatus("Couldn’t reach this page. Try refreshing it.", "error");
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
      const res = await setScrollSpeed(tab.id, speed);
      handleResponse(res);
    }
  } catch (err) {
    setStatus("Couldn’t update speed. Try refreshing the page.", "error");
    console.error(err);
  }
});

toggleEl.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id || !canInject(tab.url)) {
    setStatus("Open a normal webpage (http/https) to use Auto Scroll.", "info");
    return;
  }

  toggleEl.disabled = true;
  try {
    const speed = Number(speedEl.value);
    const res = running ? await stopScroll(tab.id) : await startScroll(tab.id, speed);
    if (handleResponse(res)) {
      running = Boolean(res.running);
      if (running) {
        setStatus("Scrolling", "info");
      } else {
        setStatus("");
      }
    }
  } catch (err) {
    setStatus("Couldn’t control this page. Try refreshing it.", "error");
    console.error(err);
  } finally {
    toggleEl.disabled = false;
    render();
  }
});

shareEl.addEventListener("click", shareExtension);

init();
