import { useEffect } from 'react';
import type { Item } from '../types';

interface MatchupProps {
  itemA: Item;
  itemB: Item;
  onSelect: (winner: Item, loser: Item) => void;
}

export const Matchup = ({ itemA, itemB, onSelect }: MatchupProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        onSelect(itemA, itemB);
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        e.preventDefault();
        onSelect(itemB, itemA);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemA, itemB, onSelect]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center font-mono text-sm opacity-60">
        Which do you prefer? (A/← or D/→)
      </p>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => onSelect(itemA, itemB)}
          className="p-8 border-stone-950 dark:border-stone-100 border-2 bg-stone-100 dark:bg-stone-950 text-stone-950 dark:text-stone-100 hover:bg-stone-950 hover:text-stone-100 dark:hover:bg-stone-100 dark:hover:text-stone-950 active:opacity-80 transition-colors min-h-32 flex flex-col items-center justify-center gap-2"
        >
          <div className="flex items-center gap-2 font-mono text-xs opacity-50">
            <span>[A / ←]</span>
          </div>
          <span className="text-xl font-bold wrap-break-word text-center">
            {itemA.name}
          </span>
        </button>

        <button
          onClick={() => onSelect(itemB, itemA)}
          className="p-8 border-stone-950 dark:border-stone-100 border-2 bg-stone-100 dark:bg-stone-950 text-stone-950 dark:text-stone-100 hover:bg-stone-950 hover:text-stone-100 dark:hover:bg-stone-100 dark:hover:text-stone-950 active:opacity-80 transition-colors min-h-32 flex flex-col items-center justify-center gap-2"
        >
          <div className="flex items-center gap-2 font-mono text-xs opacity-50">
            <span>[D / →]</span>
          </div>
          <span className="text-xl font-bold wrap-break-word text-center">
            {itemB.name}
          </span>
        </button>
      </div>
    </div>
  );
};
