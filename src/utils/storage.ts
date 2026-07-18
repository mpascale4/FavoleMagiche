export function getProfileStorageKey(base: string, profileId?: string | null): string {
  return profileId ? `${base}_${profileId}` : base;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function hasStorageItem(key: string): boolean {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(key) !== null;
}

export function getStorageItem(key: string): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(key);
}

export function setStorageItem(key: string, value: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, value);
}

export function removeStorageItem(key: string): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(key);
}

export function readJsonStorage<T>(key: string, fallback: T, errorLabel?: string): T {
  const raw = getStorageItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    if (errorLabel) {
      console.error(errorLabel, error);
    }
    return fallback;
  }
}

