import { describe, expect, it } from "vitest";

import { chooseBalancedSpawnType, MAX_CONSECUTIVE_SPAWN, pickRandomEnemy, type SpawnBalanceState } from "./growthTreeGame";

describe("growthTreeGame", () => {
  it("forces a fruit after too many consecutive bugs", () => {
    const state: SpawnBalanceState = {
      spawnedFruits: 2,
      spawnedBugs: 5,
      consecutiveFruits: 0,
      consecutiveBugs: MAX_CONSECUTIVE_SPAWN,
    };

    expect(chooseBalancedSpawnType(state, 4, 0, () => 0.1)).toBe("fruit");
  });

  it("forces a bug after too many consecutive fruits", () => {
    const state: SpawnBalanceState = {
      spawnedFruits: 5,
      spawnedBugs: 2,
      consecutiveFruits: MAX_CONSECUTIVE_SPAWN,
      consecutiveBugs: 0,
    };

    expect(chooseBalancedSpawnType(state, 1, 0, () => 0.9)).toBe("bug");
  });

  it("rebalances toward fruits when bugs are in excess", () => {
    const state: SpawnBalanceState = {
      spawnedFruits: 2,
      spawnedBugs: 7,
      consecutiveFruits: 0,
      consecutiveBugs: 1,
    };

    expect(chooseBalancedSpawnType(state, 2, 0, () => 0.5)).toBe("fruit");
  });

  it("rebalances toward bugs when fruits are in excess", () => {
    const state: SpawnBalanceState = {
      spawnedFruits: 7,
      spawnedBugs: 2,
      consecutiveFruits: 1,
      consecutiveBugs: 0,
    };

    expect(chooseBalancedSpawnType(state, 2, 0, () => 0.5)).toBe("bug");
  });

  it("increases bug pressure as progress grows", () => {
    const neutralState: SpawnBalanceState = {
      spawnedFruits: 4,
      spawnedBugs: 4,
      consecutiveFruits: 0,
      consecutiveBugs: 0,
    };

    expect(chooseBalancedSpawnType(neutralState, 1, 0, () => 0.53)).toBe("fruit");
    expect(chooseBalancedSpawnType(neutralState, 1, 1, () => 0.53)).toBe("bug");
  });

  it("picks a random enemy from the provided pool", () => {
    expect(pickRandomEnemy(["🐛", "🌩️", "🦇"], () => 0.66)).toBe("🌩️");
  });

  it("falls back to a default enemy when the pool is empty", () => {
    expect(pickRandomEnemy([], () => 0.5)).toBe("🐛");
  });
});

