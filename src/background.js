import { callScrollApi } from "./lib/api.js";

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-auto-scroll") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:\/\//.test(tab.url)) return;

  await callScrollApi(tab.id, "toggle");
});
