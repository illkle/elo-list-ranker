import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { nanoid } from 'nanoid';
import { ListInput } from './components/ListInput';
import { Matchup } from './components/Matchup';
import { ProgressMeter } from './components/ProgressMeter';
import { RankedList } from './components/RankedList';
import { ExportButton } from './components/ExportButton';
import { SavedLists } from './components/SavedLists';
import { updateRatings, INITIAL_ELO } from './utils/elo';
import { getSavedLists, saveList, deleteList } from './utils/storage';
import type { Item, SavedList } from './types';

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
  const [listId, setListId] = useQueryState(
    'list',
    parseAsString.withOptions({ history: 'push' })
  );
  const [savedLists, setSavedLists] = useState<SavedList[]>(getSavedLists);
  const [currentPair, setCurrentPair] = useState<[Item, Item] | null>(null);
  const prevListIdRef = useRef<string | null | undefined>(undefined);

  // Derive current list data from storage
  const currentList = useMemo(
    () => (listId ? savedLists.find((l) => l.id === listId) : null),
    [listId, savedLists]
  );
  const items = useMemo(() => currentList?.items ?? [], [currentList]);
  const completedPairs = useMemo(
    () => new Set(currentList?.completedPairs ?? []),
    [currentList]
  );

  // Initialize current pair when listId changes (navigating to a list)
  useEffect(() => {
    if (prevListIdRef.current !== listId) {
      prevListIdRef.current = listId;
      if (listId) {
        // Fetch fresh data from storage when navigating to a list
        const freshList = getSavedLists().find((l) => l.id === listId);
        if (freshList) {
          const pairsSet = new Set(freshList.completedPairs);
          const nextPair = getNextPair(freshList.items, pairsSet);
          queueMicrotask(() => setCurrentPair(nextPair));
        }
      } else {
        queueMicrotask(() => {
          setCurrentPair(null);
          setSavedLists(getSavedLists());
        });
      }
    }
  }, [listId]);

  const handleStartRanking = useCallback(
    (itemNames: string[]) => {
      const newItems: Item[] = itemNames.map((name) => ({
        id: nanoid(),
        name,
        elo: INITIAL_ELO,
      }));

      const newListId = nanoid();
      const now = Date.now();

      // Create and save the new list
      const newList: SavedList = {
        id: newListId,
        name: newItems[0]?.name || 'Untitled List',
        items: newItems,
        completedPairs: [],
        createdAt: now,
        updatedAt: now,
      };
      saveList(newList);
      setSavedLists(getSavedLists());

      // Set the first pair immediately
      const firstPair = getNextPair(newItems, new Set());
      setCurrentPair(firstPair);

      // Navigate to the new list via URL
      setListId(newListId);
    },
    [setListId]
  );

  const handleSelect = useCallback(
    (winner: Item, loser: Item) => {
      if (!listId || !currentList) return;

      // Update Elo ratings
      const [newWinnerElo, newLoserElo] = updateRatings(winner.elo, loser.elo);

      const updatedItems = items.map((item) => {
        if (item.id === winner.id) return { ...item, elo: newWinnerElo };
        if (item.id === loser.id) return { ...item, elo: newLoserElo };
        return item;
      });

      // Mark pair as completed
      const pairKey = getPairKey(winner.id, loser.id);
      const newCompletedPairs = new Set(completedPairs);
      newCompletedPairs.add(pairKey);

      // Save to storage and update local state
      const updatedList = {
        ...currentList,
        items: updatedItems,
        completedPairs: Array.from(newCompletedPairs),
        updatedAt: Date.now(),
      };
      saveList(updatedList);
      setSavedLists(getSavedLists());

      // Get next pair
      const nextPair = getNextPair(updatedItems, newCompletedPairs);
      setCurrentPair(nextPair);
    },
    [items, completedPairs, listId, currentList]
  );

  const handleResumeList = useCallback(
    (id: string) => {
      // Navigate to the list via URL
      setListId(id);
    },
    [setListId]
  );

  const handleDeleteList = useCallback((id: string) => {
    deleteList(id);
    setSavedLists(getSavedLists());
  }, []);

  const handleReset = useCallback(() => {
    // Clear the URL to go back to main page
    setListId(null);
  }, [setListId]);

  const handleAddItems = useCallback(
    (newItemNames: string[]) => {
      if (!listId || !currentList) return;

      const newItems: Item[] = newItemNames.map((name) => ({
        id: nanoid(),
        name,
        elo: INITIAL_ELO,
      }));

      const updatedItems = [...items, ...newItems];

      // Save to storage
      const updatedList = {
        ...currentList,
        items: updatedItems,
        updatedAt: Date.now(),
      };
      saveList(updatedList);
      setSavedLists(getSavedLists());

      // Get next pair
      const nextPair = getNextPair(updatedItems, completedPairs);
      setCurrentPair(nextPair);
    },
    [items, completedPairs, listId, currentList]
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (!listId || !currentList || items.length <= 2) return;

      const updatedItems = items.filter((item) => item.id !== itemId);

      // Remove completed pairs that involve this item
      const newCompletedPairs = new Set<string>();
      completedPairs.forEach((pairKey) => {
        if (!pairKey.includes(itemId)) {
          newCompletedPairs.add(pairKey);
        }
      });

      // Save to storage
      const updatedList = {
        ...currentList,
        items: updatedItems,
        completedPairs: Array.from(newCompletedPairs),
        updatedAt: Date.now(),
      };
      saveList(updatedList);
      setSavedLists(getSavedLists());

      // Get next pair
      const nextPair = getNextPair(updatedItems, newCompletedPairs);
      setCurrentPair(nextPair);
    },
    [items, completedPairs, listId, currentList]
  );

  const handleResetItemElo = useCallback(
    (itemId: string) => {
      if (!listId || !currentList) return;

      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, elo: INITIAL_ELO } : item
      );

      // Remove completed pairs that involve this item so it can be re-compared
      const newCompletedPairs = new Set<string>();
      completedPairs.forEach((pairKey) => {
        if (!pairKey.includes(itemId)) {
          newCompletedPairs.add(pairKey);
        }
      });

      // Save to storage
      const updatedList = {
        ...currentList,
        items: updatedItems,
        completedPairs: Array.from(newCompletedPairs),
        updatedAt: Date.now(),
      };
      saveList(updatedList);
      setSavedLists(getSavedLists());

      // Get next pair
      const nextPair = getNextPair(updatedItems, newCompletedPairs);
      setCurrentPair(nextPair);
    },
    [items, completedPairs, listId, currentList]
  );

  const handleResetAllScores = useCallback(() => {
    if (!listId || !currentList) return;

    const updatedItems = items.map((item) => ({ ...item, elo: INITIAL_ELO }));

    // Save to storage
    const updatedList = {
      ...currentList,
      items: updatedItems,
      completedPairs: [],
      updatedAt: Date.now(),
    };
    saveList(updatedList);
    setSavedLists(getSavedLists());

    // Get first pair
    const nextPair = getNextPair(updatedItems, new Set());
    setCurrentPair(nextPair);
  }, [items, listId, currentList]);

  const totalPairs = getTotalPairs(items.length);
  const isOnList = listId !== null;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1
          onClick={handleReset}
          className="text-2xl text-bg md:text-4xl font-bold uppercase tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
        >
          Elo List Ranker
        </h1>
        {isOnList && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wide hover:bg-(--fg) hover:text-(--bg)"
          >
            Back
          </button>
        )}
      </header>

      {!isOnList && (
        <div className="max-w-2xl mx-auto">
          <ListInput onSubmit={handleStartRanking} />
          <SavedLists
            lists={savedLists}
            onResume={handleResumeList}
            onDelete={handleDeleteList}
          />
        </div>
      )}

      {isOnList && (
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

            <button
              onClick={handleResetAllScores}
              className="px-4 py-2 text-sm font-bold uppercase tracking-wide border-(--border) border-2 hover:bg-(--fg) hover:text-(--bg)"
            >
              Reset All Scores
            </button>
          </div>

          <aside className="space-y-6">
            <RankedList
              items={items}
              onDeleteItem={handleDeleteItem}
              onResetItemElo={handleResetItemElo}
            />
            <ExportButton items={items} />
            <div className="border-(--border) border-2 p-4">
              <ListInput
                onSubmit={handleAddItems}
                existingNames={items.map((i) => i.name)}
                mode="merge"
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default App;
