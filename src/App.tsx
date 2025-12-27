import { useState, useCallback } from 'react';
import { ListInput } from './components/ListInput';
import { Matchup } from './components/Matchup';
import { ProgressMeter } from './components/ProgressMeter';
import { RankedList } from './components/RankedList';
import { ExportButton } from './components/ExportButton';
import { updateRatings, INITIAL_ELO } from './utils/elo';
import type { Item, AppPhase } from './types';

/**
 * Generate a unique pair key (order-independent)
 */
const getPairKey = (a: string, b: string): string => {
  return [a, b].sort().join('-');
};

/**
 * Calculate total possible pairs for n items
 */
const getTotalPairs = (n: number): number => {
  return (n * (n - 1)) / 2;
};

/**
 * Get next pair to compare, avoiding already completed pairs
 * Prioritizes items with fewer comparisons
 */
const getNextPair = (
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

export const App = () => {
  const [phase, setPhase] = useState<AppPhase>('input');
  const [items, setItems] = useState<Item[]>([]);
  const [completedPairs, setCompletedPairs] = useState<Set<string>>(new Set());
  const [currentPair, setCurrentPair] = useState<[Item, Item] | null>(null);

  const handleStartRanking = useCallback((itemNames: string[]) => {
    const newItems: Item[] = itemNames.map((name, index) => ({
      id: `item-${index}-${Date.now()}`,
      name,
      elo: INITIAL_ELO,
    }));

    setItems(newItems);
    setCompletedPairs(new Set());
    setPhase('comparing');

    // Get first pair
    const firstPair = getNextPair(newItems, new Set());
    setCurrentPair(firstPair);
  }, []);

  const handleSelect = useCallback(
    (winner: Item, loser: Item) => {
      // Update Elo ratings
      const [newWinnerElo, newLoserElo] = updateRatings(winner.elo, loser.elo);

      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === winner.id) return { ...item, elo: newWinnerElo };
          if (item.id === loser.id) return { ...item, elo: newLoserElo };
          return item;
        })
      );

      // Mark pair as completed
      const pairKey = getPairKey(winner.id, loser.id);
      const newCompletedPairs = new Set(completedPairs);
      newCompletedPairs.add(pairKey);
      setCompletedPairs(newCompletedPairs);

      // Get next pair
      const nextPair = getNextPair(items, newCompletedPairs);
      setCurrentPair(nextPair);
    },
    [items, completedPairs]
  );

  const handleReset = useCallback(() => {
    setPhase('input');
    setItems([]);
    setCompletedPairs(new Set());
    setCurrentPair(null);
  }, []);

  const totalPairs = getTotalPairs(items.length);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl text-bg md:text-4xl font-bold uppercase tracking-tight">
          Elo List Ranker
        </h1>
        {phase === 'comparing' && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wide hover:bg-(--fg) hover:text-(--bg)"
          >
            Reset
          </button>
        )}
      </header>

      {phase === 'input' && <ListInput onSubmit={handleStartRanking} />}

      {phase === 'comparing' && (
        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          <div className="space-y-6">
            <ProgressMeter completed={completedPairs.size} total={totalPairs} />

            {currentPair ? (
              <Matchup
                itemA={currentPair[0]}
                itemB={currentPair[1]}
                onSelect={handleSelect}
              />
            ) : (
              <div className="border-(--border) border-2 p-8 text-center">
                <p className="text-xl font-bold mb-4">All pairs compared!</p>
                <p className="mono text-sm opacity-60">
                  Export your ranked list below
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <RankedList items={items} />
            <ExportButton items={items} />
          </aside>
        </div>
      )}
    </div>
  );
};

export default App;
