import { generateStage } from "./stages";

export interface AchievementReward {
  emoji: string;
  text: string;
}

export interface Achievement {
  id: string;
  milestone: string; // Formato: "1.1", "1.2", ..., "1.6"
  title: string;
  message: string;
  rewards: AchievementReward[];
  isWorldCompletion: boolean;
}

const createStageAchievement = (stageIndex: number): Achievement => {
  const stage = generateStage(stageIndex);
  const worldLabel = `${stage.worldIndex}`;
  const milestone = `${worldLabel}.${stage.stageInWorld}`;

  return {
    id: stage.id,
    milestone,
    title: `Tappa ${stage.stageInWorld} completata`,
    message: `Tappa ${stage.stageInWorld} (${stage.worldName}) completata.`,
    rewards: [
      {
        emoji: "🎁",
        text: "Hai sbloccato una nuova ricompensa della mappa!"
      }
    ],
    isWorldCompletion: false
  };
};

const createWorldCompletionAchievement = (worldIndex: number): Achievement => {
  const stage = generateStage(worldIndex * 5);
  const cleanWorldName = stage.worldName;

  return {
    id: `world_${worldIndex}_complete`,
    milestone: `${worldIndex}.6`,
    title: `Mondo ${worldIndex} completato`,
    message: `Mondo ${worldIndex} (${cleanWorldName}) completato.`,
    rewards: [
      { emoji: "🏆", text: "Ricompensa epica del mondo sbloccata" },
      { emoji: "✨", text: "Nuovo elemento magico disponibile" },
      { emoji: "🗺️", text: "Sentiero del prossimo mondo aperto" }
    ],
    isWorldCompletion: true
  };
};

/**
 * Restituisce tutti i milestone raggiunti tra previousCount e newCount.
 * Ogni multiplo di 5 completa una tappa, il 5° step del mondo aggiunge anche il milestone X.6.
 */
export function checkMilestonesReached(previousCount: number, newCount: number): Achievement[] {
  if (newCount <= previousCount) return [];

  const milestones: Achievement[] = [];
  const prevStageIndex = Math.floor(previousCount / 5);
  const newStageIndex = Math.floor(newCount / 5);

  for (let stageIndex = prevStageIndex + 1; stageIndex <= newStageIndex; stageIndex++) {
    const stageAchievement = createStageAchievement(stageIndex);
    milestones.push(stageAchievement);

    const stage = generateStage(stageIndex);
    if (stage.stageInWorld === 5) {
      milestones.push(createWorldCompletionAchievement(stage.worldIndex));
    }
  }

  return milestones;
}

