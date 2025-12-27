import type { Item } from '../types';

interface RankedListProps {
  items: Item[];
}

export const RankedList = ({ items }: RankedListProps) => {
  // Sort by Elo score descending
  const sorted = [...items].sort((a, b) => b.elo - a.elo);

  return (
    <div className="border-(--border) border-2">
      <div className="p-3 border-b-[3px] border-(--fg)">
        <span className="font-bold uppercase tracking-wide text-sm">
          Rankings
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {sorted.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 border-b border-(--fg) last:border-b-0 hover:bg-(--fg) hover:text-(--bg) transition-colors"
          >
            <span className="mono text-sm w-8 opacity-60">{index + 1}.</span>
            <span className="flex-1 truncate">{item.name}</span>
            <span className="mono text-sm opacity-60">{item.elo}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
