import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getProfileStorageKey,
  hasStorageItem,
  readJsonStorage,
  removeStorageItem,
  setStorageItem,
} from "./storage";

describe("storage utils", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("builds profile-aware keys", () => {
    expect(getProfileStorageKey("favole_magiche_stories", "p1")).toBe("favole_magiche_stories_p1");
    expect(getProfileStorageKey("favole_magiche_stories", null)).toBe("favole_magiche_stories");
  });

  it("writes and detects keys", () => {
    setStorageItem("favole_magiche_test", "ok");
    expect(hasStorageItem("favole_magiche_test")).toBe(true);

    removeStorageItem("favole_magiche_test");
    expect(hasStorageItem("favole_magiche_test")).toBe(false);
  });

  it("reads valid JSON values", () => {
    setStorageItem("favole_magiche_json", JSON.stringify({ enabled: true }));

    const parsed = readJsonStorage("favole_magiche_json", { enabled: false });
    expect(parsed.enabled).toBe(true);
  });

  it("returns fallback on invalid JSON and logs optional error label", () => {
    setStorageItem("favole_magiche_bad_json", "{");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const parsed = readJsonStorage("favole_magiche_bad_json", ["fallback"], "parse failed");

    expect(parsed).toEqual(["fallback"]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

