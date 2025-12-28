import { ArrowCounterClockwiseIcon, TrashIcon } from '@phosphor-icons/react';
import { INITIAL_ELO } from '../utils/elo';
import type { Item } from '../types';

interface RankedListProps {
  items: Item[];
  onDeleteItem?: (itemId: string) => void;
  onResetItemElo?: (itemId: string) => void;
}

export const RankedList = ({
  items,
  onDeleteItem,
  onResetItemElo,
}: RankedListProps) => {
  // Sort by Elo score descending
  const sorted = [...items].sort((a, b) => b.elo - a.elo);

  return (
    <div className="border-border border-2">
      <div className="p-3 border-b-[3px] border-border">
        <span className="font-bold uppercase tracking-wide text-sm">
          Rankings
        </span>
      </div>

      <div className="">
        {sorted.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-3 border-b border-border last:border-b-0 group"
          >
            <span className="font-mono text-sm w-6 opacity-60">
              {index + 1}.
            </span>
            <span className="flex-1 truncate">{item.name}</span>
            <span className="font-mono text-xs opacity-60  font-font-mono">
              {item.elo}
            </span>
            {onResetItemElo && (
              <button
                disabled={item.elo === INITIAL_ELO}
                onClick={() => onResetItemElo(item.id)}
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide border-border border opacity-40 hover:not-disabled:opacity-100 hover:not-disabled:bg-accent hover:not-disabled:text-accent-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                title="Reset ELO"
              >
                <ArrowCounterClockwiseIcon size={12} weight="bold" />
              </button>
            )}
            {onDeleteItem && items.length > 2 && (
              <button
                onClick={() => onDeleteItem(item.id)}
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide border-border border opacity-40 hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all flex items-center justify-center"
                title="Delete"
              >
                <TrashIcon size={12} weight="bold" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
