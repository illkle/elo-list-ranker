import { useState } from 'react';
import { ArrowRightIcon, PlusIcon } from '@phosphor-icons/react';

interface ListInputProps {
  onSubmit: (items: string[]) => void;
  existingNames?: string[];
  mode?: 'create' | 'merge';
}

const parseInput = (text: string, existingNames: string[] = []): string[] => {
  const existingSet = new Set(existingNames.map((n) => n.toLowerCase()));
  const seen = new Set<string>();

  return text
    .split('\n')
    .map((line) => line.trim())
    .map((line) => {
      // Remove markdown list prefixes
      // Matches: "- ", "* ", "1. ", "1) ", "10. ", "10) ", etc.
      return line.replace(/^(?:[-*]|\d+[.)]) /, '');
    })
    .map((line) => line.trim())
    .filter((line) => {
      if (line.length === 0) return false;
      const lower = line.toLowerCase();
      // Skip if already exists in the list or is a duplicate in input
      if (existingSet.has(lower) || seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
};

export const ListInput = ({
  onSubmit,
  existingNames = [],
  mode = 'create',
}: ListInputProps) => {
  const [text, setText] = useState('');

  const parsedItems = parseInput(text, existingNames);
  const isValid =
    mode === 'merge' ? parsedItems.length >= 1 : parsedItems.length >= 2;

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(parsedItems);
      setText('');
    }
  };

  const duplicatesFiltered =
    text.split('\n').filter((l) => l.trim()).length - parsedItems.length;

  const isCompact = mode === 'merge';

  return (
    <div>
      <label className="block mb-3">
        <span
          className={`font-bold uppercase tracking-wide block mb-2 ${
            isCompact ? 'text-sm' : 'text-lg'
          }`}
        >
          {mode === 'merge' ? 'Add items' : 'Paste your list'}
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'- Item one\n- Item two\n...'}
          className={`w-full p-3 bg-background text-foreground border-border border-2 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-border ${
            isCompact ? 'h-32' : 'h-64'
          }`}
        />
      </label>

      <div
        className={`flex items-center ${
          isCompact ? 'flex-col gap-1' : 'justify-between'
        }`}
      >
        <div className="font-mono text-xs">
          <span className="text-muted">
            {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''}
          </span>
          {duplicatesFiltered > 0 && (
            <span className="opacity-60 ml-1">
              ({duplicatesFiltered} dup{duplicatesFiltered !== 1 ? 's' : ''})
            </span>
          )}

          {mode === 'create' && parsedItems.length < 2 && (
            <span className="ml-2">Add at least 2 items to compare</span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`bg-accent text-accent-foreground font-bold uppercase tracking-wide border-border border-2 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 active:opacity-60 flex items-center justify-center gap-2 ${
            isCompact ? 'w-full px-4 py-2 text-sm' : 'px-8 py-3'
          }`}
        >
          {mode === 'merge' ? (
            <>
              <PlusIcon size={18} weight="bold" />
              Add Items
            </>
          ) : (
            <>
              Start Ranking <ArrowRightIcon size={16} weight="bold" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
