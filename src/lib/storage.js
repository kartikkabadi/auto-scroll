function getStorage() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return chrome.storage.local;
  }
  return null;
}

export function getSpeed() {
  return new Promise((resolve) => {
    const storage = getStorage();
    if (!storage) {
      resolve(6);
      return;
    }
    storage.get(["speed"], (result) => {
      resolve(result.speed ?? 6);
    });
  });
}

export function setSpeed(speed) {
  return new Promise((resolve) => {
    const storage = getStorage();
    if (!storage) {
      resolve();
      return;
    }
    storage.set({ speed }, resolve);
  });
}
