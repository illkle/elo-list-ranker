import type { Item } from '../types';

/**
 * Generate a unique pair key (order-independent)
 */
export const getPairKey = (a: string, b: string): string => {
  return [a, b].sort().join('-');
};

/**
 * Calculate total possible pairs for n items
 */
export const getTotalPairs = (n: number): number => {
  return (n * (n - 1)) / 2;
};

/**
 * Get next pair to compare, avoiding already completed pairs
 * Prioritizes items with fewer comparisons
 */
export const getNextPair = (
  items: Item[],
  completedPairs: Set<string>
): [Item, Item] | null => {
  // Count comparisons per item
  const comparisonCounts = new Map<string, number>();
  items.forEach((item) => comparisonCounts.set(item.id, 0));

  completedPairs.forEach((pairKey) => {
    const [id1, id2] = pairKey.split('-');
    comparisonCounts.set(id1, (comparisonCounts.get(id1) || 0) + 1);
    comparisonCounts.set(id2, (comparisonCounts.get(id2) || 0) + 1);
  });

  // Find all valid pairs (not yet compared)
  const validPairs: [Item, Item][] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const pairKey = getPairKey(items[i].id, items[j].id);
      if (!completedPairs.has(pairKey)) {
        validPairs.push([items[i], items[j]]);
      }
    }
  }

  if (validPairs.length === 0) return null;

  // Sort by total comparison count (prefer pairs where both items have fewer comparisons)
  validPairs.sort((pairA, pairB) => {
    const countA =
      (comparisonCounts.get(pairA[0].id) || 0) +
      (comparisonCounts.get(pairA[1].id) || 0);
    const countB =
      (comparisonCounts.get(pairB[0].id) || 0) +
      (comparisonCounts.get(pairB[1].id) || 0);
    return countA - countB;
  });

  // Pick from the pairs with fewest comparisons, with some randomness
  const minCount =
    (comparisonCounts.get(validPairs[0][0].id) || 0) +
    (comparisonCounts.get(validPairs[0][1].id) || 0);
  const candidatePairs = validPairs.filter((pair) => {
    const count =
      (comparisonCounts.get(pair[0].id) || 0) +
      (comparisonCounts.get(pair[1].id) || 0);
    return count <= minCount + 2; // Allow some variance
  });

  // Random selection from candidates
  const selected =
    candidatePairs[Math.floor(Math.random() * candidatePairs.length)];

  // Randomly swap order for display
  return Math.random() > 0.5 ? selected : [selected[1], selected[0]];
};
