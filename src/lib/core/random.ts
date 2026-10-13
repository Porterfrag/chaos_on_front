export function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function chance(probability: number): boolean {
  return Math.random() < probability;
}

/** Picks a value from the array with the given weights (must sum to ~1, gaps default to no-pick). */
export function weightedPick<T extends string>(weights: Record<T, number>): T | null {
  const roll = Math.random();
  let cumulative = 0;
  for (const [key, weight] of Object.entries(weights) as [T, number][]) {
    cumulative += weight;
    if (roll < cumulative) return key;
  }
  return null;
}
