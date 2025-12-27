import type { SavedList } from '../types';

const STORAGE_KEY = 'elo-ranker-lists';

// Cache for useSyncExternalStore - must return same reference if data hasn't changed
let cachedLists: SavedList[] | null = null;
let cachedData: string | null = null;

export const getSavedLists = (): SavedList[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    // Return cached result if data hasn't changed
    if (data === cachedData && cachedLists !== null) {
      return cachedLists;
    }

    cachedData = data;
    if (!data) {
      cachedLists = [];
      return cachedLists;
    }
    cachedLists = JSON.parse(data) as SavedList[];
    return cachedLists;
  } catch {
    cachedLists = [];
    return cachedLists;
  }
};

export const saveList = (list: SavedList): void => {
  const currentLists = getSavedLists();
  const existingIndex = currentLists.findIndex((l) => l.id === list.id);

  // Create a new array to ensure React detects the change
  let newLists: SavedList[];
  if (existingIndex >= 0) {
    newLists = [...currentLists];
    newLists[existingIndex] = list;
  } else {
    newLists = [list, ...currentLists];
  }

  const newData = JSON.stringify(newLists);
  localStorage.setItem(STORAGE_KEY, newData);
  // Update cache with new array
  cachedData = newData;
  cachedLists = newLists;
};

export const deleteList = (id: string): void => {
  const lists = getSavedLists().filter((l) => l.id !== id);
  const newData = JSON.stringify(lists);
  localStorage.setItem(STORAGE_KEY, newData);
  // Invalidate cache
  cachedData = newData;
  cachedLists = lists;
};
