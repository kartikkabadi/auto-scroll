export async function loadScrollApi(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    files: ["scroll-api.js"],
  });
}

export async function callScrollApi(tabId, method, ...args) {
  await loadScrollApi(tabId);
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    args: [method, args],
    func: (method, args) => {
      const api = window.__autoScrollExtAPI;
      if (!api) return { ok: false, error: "Auto Scroll API not loaded" };
      return api[method](...args);
    },
  });
  return result;
}
