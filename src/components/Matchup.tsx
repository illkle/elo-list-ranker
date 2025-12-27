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
      <p className="text-center mono text-sm opacity-60">
        Which do you prefer? (A/← or D/→)
      </p>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => onSelect(itemA, itemB)}
          className="p-8 border-(--border) border-2 bg-(--bg) text-(--fg) hover:bg-(--fg) hover:text-(--bg) active:opacity-80 transition-colors min-h-32 flex flex-col items-center justify-center gap-2"
        >
          <span className="mono text-xs opacity-50">[A / ←]</span>
          <span className="text-xl font-bold wrap-break-word text-center">
            {itemA.name}
          </span>
        </button>

        <button
          onClick={() => onSelect(itemB, itemA)}
          className="p-8 border-(--border) border-2 bg-(--bg) text-(--fg) hover:bg-(--fg) hover:text-(--bg) active:opacity-80 transition-colors min-h-32 flex flex-col items-center justify-center gap-2"
        >
          <span className="mono text-xs opacity-50">[D / →]</span>
          <span className="text-xl font-bold wrap-break-word text-center">
            {itemB.name}
          </span>
        </button>
      </div>
    </div>
  );
};
