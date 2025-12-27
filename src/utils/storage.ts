import type { SavedList } from '../types';

const STORAGE_KEY = 'elo-ranker-lists';

export const getSavedLists = (): SavedList[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as SavedList[];
  } catch {
    return [];
  }
};

export const saveList = (list: SavedList): void => {
  const lists = getSavedLists();
  const existingIndex = lists.findIndex((l) => l.id === list.id);

  if (existingIndex >= 0) {
    lists[existingIndex] = list;
  } else {
    lists.unshift(list);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
};

export const deleteList = (id: string): void => {
  const lists = getSavedLists().filter((l) => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
};

