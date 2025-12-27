import { TrashIcon } from '@phosphor-icons/react';
import type { SavedList } from '../types';

interface SavedListsProps {
  lists: SavedList[];
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
}

const getTotalPairs = (n: number): number => (n * (n - 1)) / 2;

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const SavedLists = ({ lists, onResume, onDelete }: SavedListsProps) => {
  if (lists.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-lg font-bold uppercase tracking-wide mb-4">
        Previous Lists
      </h2>
      <div className="space-y-3">
        {lists.map((list) => {
          const totalPairs = getTotalPairs(list.items.length);
          const completedPairs = list.completedPairs.length;
          const isComplete = completedPairs >= totalPairs;
          const progress =
            totalPairs > 0 ? (completedPairs / totalPairs) * 100 : 0;

          return (
            <div
              key={list.id}
              onClick={() => onResume(list.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onResume(list.id)}
              className="w-full border-stone-950 dark:border-stone-100 border-2 p-4 flex items-center justify-between gap-4 group text-left cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{list.name}</div>
                <div className="font-mono text-sm opacity-60 flex gap-4 mt-1">
                  <span>{list.items.length} items</span>
                  <span>
                    {isComplete
                      ? 'Complete'
                      : `${Math.round(progress)}% ranked`}
                  </span>
                  <span>{formatDate(list.updatedAt)}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(list.id);
                }}
                className="px-3 py-1 text-sm font-bold uppercase tracking-wide opacity-50 hover:opacity-100 hover:bg-stone-950 hover:text-stone-100 dark:hover:bg-stone-100 dark:hover:text-stone-950 transition-opacity flex items-center gap-1.5"
                title="Delete list"
              >
                <TrashIcon size={14} weight="bold" />
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
