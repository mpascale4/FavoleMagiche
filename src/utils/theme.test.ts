import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentTimeOfDay, shouldApplyNightTheme } from "./theme";

function setMockHour(hour: number) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 1, hour, 0, 0));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("theme utils", () => {
  it("classifica correttamente i momenti della giornata", () => {
    setMockHour(7);
    expect(getCurrentTimeOfDay()).toBe("morning");

    setMockHour(13);
    expect(getCurrentTimeOfDay()).toBe("afternoon");

    setMockHour(19);
    expect(getCurrentTimeOfDay()).toBe("evening");

    setMockHour(2);
    expect(getCurrentTimeOfDay()).toBe("night");
  });

  it("attiva la modalità notturna tra le 18:00 e le 05:59", () => {
    setMockHour(17);
    expect(shouldApplyNightTheme()).toBe(false);

    setMockHour(18);
    expect(shouldApplyNightTheme()).toBe(true);

    setMockHour(5);
    expect(shouldApplyNightTheme()).toBe(true);

    setMockHour(6);
    expect(shouldApplyNightTheme()).toBe(false);
  });
});

