import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { nanoid } from 'nanoid';
import { updateRatings, INITIAL_ELO } from '../utils/elo';
import { getSavedLists, saveList, deleteList } from '../utils/storage';
import { getPairKey, getTotalPairs, getNextPair } from '../utils/pairs';
import type { Item, SavedList } from '../types';

export const useListRanking = () => {
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

  const totalPairs = getTotalPairs(items.length);
  const isOnList = listId !== null;

  // Helper to persist list changes and refresh state
  const persistAndRefresh = useCallback(
    (
      updatedList: SavedList,
      updatedItems: Item[],
      updatedPairs: Set<string>
    ) => {
      saveList(updatedList);
      setSavedLists(getSavedLists());
      const nextPair = getNextPair(updatedItems, updatedPairs);
      setCurrentPair(nextPair);
    },
    []
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
      const updatedList: SavedList = {
        ...currentList,
        items: updatedItems,
        completedPairs: Array.from(newCompletedPairs),
        updatedAt: Date.now(),
      };
      persistAndRefresh(updatedList, updatedItems, newCompletedPairs);
    },
    [items, completedPairs, listId, currentList, persistAndRefresh]
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
      const updatedList: SavedList = {
        ...currentList,
        items: updatedItems,
        updatedAt: Date.now(),
      };
      persistAndRefresh(updatedList, updatedItems, completedPairs);
    },
    [items, completedPairs, listId, currentList, persistAndRefresh]
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
      const updatedList: SavedList = {
        ...currentList,
        items: updatedItems,
        completedPairs: Array.from(newCompletedPairs),
        updatedAt: Date.now(),
      };
      persistAndRefresh(updatedList, updatedItems, newCompletedPairs);
    },
    [items, completedPairs, listId, currentList, persistAndRefresh]
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
      const updatedList: SavedList = {
        ...currentList,
        items: updatedItems,
        completedPairs: Array.from(newCompletedPairs),
        updatedAt: Date.now(),
      };
      persistAndRefresh(updatedList, updatedItems, newCompletedPairs);
    },
    [items, completedPairs, listId, currentList, persistAndRefresh]
  );

  const handleResetAllScores = useCallback(() => {
    if (!listId || !currentList) return;

    const updatedItems = items.map((item) => ({ ...item, elo: INITIAL_ELO }));
    const emptyPairs = new Set<string>();

    // Save to storage
    const updatedList: SavedList = {
      ...currentList,
      items: updatedItems,
      completedPairs: [],
      updatedAt: Date.now(),
    };
    persistAndRefresh(updatedList, updatedItems, emptyPairs);
  }, [items, listId, currentList, persistAndRefresh]);

  return {
    // State
    isOnList,
    savedLists,
    currentPair,
    items,
    completedPairsCount: completedPairs.size,
    totalPairs,

    // Actions
    handleStartRanking,
    handleSelect,
    handleResumeList,
    handleDeleteList,
    handleReset,
    handleAddItems,
    handleDeleteItem,
    handleResetItemElo,
    handleResetAllScores,
  };
};
