/**
 * Definizioni degli achievement e milestone nel progetto
 */

export interface Achievement {
  id: string;
  milestone: number; // Numero di storie per raggiungere l'obiettivo
  title: string;
  message: string;
  reward: string;
  rewardEmoji: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_story",
    milestone: 1,
    title: "Il Primo Capitolo",
    message: "Hai creato la tua prima storia! Benvenuto nel magico mondo della narrazione.",
    reward: "Sblocchi il tema 'Avventura'",
    rewardEmoji: "🎉"
  },
  {
    id: "story_five",
    milestone: 5,
    title: "Narratore Provetto",
    message: "5 storie create! Stai diventando un vero narratore di favole magiche.",
    reward: "Sblocchi il tema 'Mistero'",
    rewardEmoji: "📖"
  },
  {
    id: "story_ten",
    milestone: 10,
    title: "Maestro delle Fiabe",
    message: "10 storie! La magia della narrazione scorre nelle tue vene.",
    reward: "Sblocchi il tema 'Mitologia'",
    rewardEmoji: "✨"
  },
  {
    id: "story_twenty",
    milestone: 20,
    title: "Leggenda Vivente",
    message: "20 storie! Sei diventato una leggenda nel regno delle favole.",
    reward: "Sblocchi il tema 'Spazio'",
    rewardEmoji: "🌟"
  },
  {
    id: "story_fifty",
    milestone: 50,
    title: "Guardiano del Sapere",
    message: "50 storie! Hai creato una biblioteca magica di incredibili avventure.",
    reward: "Sblocchi il tema 'Supereroi'",
    rewardEmoji: "👑"
  }
];

/**
 * Trova il prossimo achievement da raggiungere
 */
export function getNextAchievement(storiesGenerated: number): Achievement | null {
  return ACHIEVEMENTS.find(a => a.milestone > storiesGenerated) || null;
}

/**
 * Verifica se un numero di storie raggiunge un milestone
 */
export function checkMilestoneReached(
  previousCount: number,
  newCount: number
): Achievement | null {
  return ACHIEVEMENTS.find(
    a => a.milestone <= newCount && a.milestone > previousCount
  ) || null;
}

