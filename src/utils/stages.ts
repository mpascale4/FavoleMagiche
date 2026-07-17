export interface Stage {
  id: string;
  title: string;
  mapName: string;
  description: string;
  icon: string;
  targetCount: number; // total required for this stage
  worldIndex: number;
  worldName: string;
  stageInWorld: number;
}

export const WORLD_INFO = [
  { name: "🌲 Selva dei Sogni Sussurranti", emoji: "🌲", icon: "📝" },
  { name: "🧜‍♀️ Abisso dei Canti di Corallo", emoji: "🧜‍♀️", icon: "📖" },
  { name: "🏰 Castello dei Sogni Sospesi", emoji: "🏰", icon: "✍️" },
  { name: "🐉 Antro del Drago d'Oro Ancestrale", emoji: "🐉", icon: "🔍" },
  { name: "🪐 Galassia delle Comete Canterine", emoji: "🪐", icon: "🧙‍♂️" },
  { name: "🌋 Gola dei Vulcani di Cioccolato", emoji: "🌋", icon: "🦉" },
  { name: "🦄 Prateria degli Unicorni di Luce", emoji: "🦄", icon: "👑" },
  { name: "❄️ Ghiacciaio delle Stelle Polari", emoji: "❄️", icon: "🐉" },
  { name: "🦁 Savana del Sole Ruggente", emoji: "🦁", icon: "🎨" },
  { name: "🤖 Isola degli Ingranaggi Incantati", emoji: "🤖", icon: "🪄" },
];

export function generateStage(index: number): Stage {
  const worldIndex = Math.ceil(index / 5);
  const stageInWorld = index - (worldIndex - 1) * 5;
  const worldInfo = WORLD_INFO[(worldIndex - 1) % WORLD_INFO.length];
  
  const targetCount = index * 5;
  const description = `Crea ${targetCount} favole per completare questa tappa!`;
  
  return {
    id: `stage_${index}`,
    title: `Tappa ${stageInWorld}`,
    mapName: `${worldInfo.name} - Tappa ${stageInWorld}`,
    description,
    icon: worldInfo.icon,
    targetCount,
    worldIndex,
    worldName: worldInfo.name,
    stageInWorld
  };
}

export function getVisibleStages(createdCount: number): Stage[] {
  const stages: Stage[] = [];
  
  // Each stage requires 5 creations, 5 stages per world = 25 creations per world
  const currentWorldIndex = Math.floor(createdCount / 25) + 1;
  const stagesToShow = currentWorldIndex * 5;
  
  for (let i = 1; i <= stagesToShow; i++) {
    stages.push(generateStage(i));
  }
  
  return stages;
}
