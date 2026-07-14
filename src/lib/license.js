import { getLicense } from "./storage.js";

export async function isLicensed() {
  const license = await getLicense();
  return Boolean(license?.valid);
}

export async function validateLicense(key) {
  // Phase 1: accept any non-empty key as valid. Replace with real validation in Phase 2.
  if (!key || typeof key !== "string" || !key.trim()) {
    return { valid: false, error: "License key is required." };
  }
  return { valid: true, key: key.trim() };
}
