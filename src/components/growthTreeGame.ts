export type GrowthTreeSpawnType = "fruit" | "bug";

export const FRUITS_PER_ROUND = 10;
export const MAX_CONSECUTIVE_SPAWN = 2;
export const BASE_BUG_PROBABILITY = 0.5;
export const LEVEL_BUG_PROBABILITY_STEP = 0.04;
export const PROGRESS_BUG_PROBABILITY_STEP = 0.1;
export const MIN_BUG_PROBABILITY = 0.35;
export const MAX_BUG_PROBABILITY = 0.65;

export type SpawnBalanceState = {
  spawnedFruits: number;
  spawnedBugs: number;
  consecutiveFruits: number;
  consecutiveBugs: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function chooseBalancedSpawnType(
  state: SpawnBalanceState,
  level: number,
  progress: number = 0,
  random: () => number = Math.random,
): GrowthTreeSpawnType {
  if (state.consecutiveBugs >= MAX_CONSECUTIVE_SPAWN) {
    return "fruit";
  }
  if (state.consecutiveFruits >= MAX_CONSECUTIVE_SPAWN) {
    return "bug";
  }

  let bugProbability = BASE_BUG_PROBABILITY
    + Math.max(0, level - 1) * LEVEL_BUG_PROBABILITY_STEP
    + clamp(progress, 0, 1) * PROGRESS_BUG_PROBABILITY_STEP;

  const bugFruitDelta = state.spawnedBugs - state.spawnedFruits;
  if (bugFruitDelta >= 2) {
    bugProbability -= 0.15;
  } else if (bugFruitDelta <= -2) {
    bugProbability += 0.15;
  }

  bugProbability = clamp(bugProbability, MIN_BUG_PROBABILITY, MAX_BUG_PROBABILITY);
  return random() < bugProbability ? "bug" : "fruit";
}

export function pickRandomEnemy(enemies: string[], random: () => number = Math.random): string {
  if (enemies.length === 0) {
    return "🐛";
  }

  const index = Math.floor(random() * enemies.length);
  return enemies[index] || enemies[0];
}

