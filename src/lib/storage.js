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

export function getLicense() {
  return new Promise((resolve) => {
    const storage = getStorage();
    if (!storage) {
      resolve(null);
      return;
    }
    storage.get(["license"], (result) => {
      resolve(result.license ?? null);
    });
  });
}

export function setLicense(license) {
  return new Promise((resolve) => {
    const storage = getStorage();
    if (!storage) {
      resolve();
      return;
    }
    storage.set({ license }, resolve);
  });
}
