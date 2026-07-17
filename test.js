const WORLD_INFO = [
  { name: "🌲 Selva dei Sogni Sussurranti", emoji: "🌲", icon: "📝" },
];

function generateStage(index) {
  const worldIndex = Math.ceil(index / 5);
  const stageInWorld = index - (worldIndex - 1) * 5;
  const worldInfo = WORLD_INFO[(worldIndex - 1) % WORLD_INFO.length];
  
  const targetCount = index * 5;
  const description = `Crea ${targetCount} favole per completare questa tappa!`;
  
  return {
    id: `stage_${index}`,
    title: `Tappa ${stageInWorld}`,
    targetCount,
  };
}

function getVisibleStages(createdCount) {
  const stages = [];
  const currentWorldIndex = Math.floor(createdCount / 25) + 1;
  const stagesToShow = currentWorldIndex * 5;
  
  for (let i = 1; i <= stagesToShow; i++) {
    stages.push(generateStage(i));
  }
  return stages;
}

const createdCount = 0;
const activeStages = getVisibleStages(createdCount);
const claimedAchievements = [];

const unclaimed = activeStages.find(ach => {
  const current = createdCount;
  const isCompleted = current >= ach.targetCount;
  const isClaimed = claimedAchievements.includes(ach.id);
  return isCompleted && !isClaimed;
});

console.log("Unclaimed:", unclaimed);
