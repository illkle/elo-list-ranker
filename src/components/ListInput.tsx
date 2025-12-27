import { useState } from 'react';

interface ListInputProps {
  onSubmit: (items: string[]) => void;
}

const parseInput = (text: string): string[] => {
  return text
    .split('\n')
    .map((line) => line.trim())
    .map((line) => {
      // Remove markdown list prefixes
      // Matches: "- ", "* ", "1. ", "1) ", "10. ", "10) ", etc.
      return line.replace(/^(?:[-*]|\d+[.)]) /, '');
    })
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

export const ListInput = ({ onSubmit }: ListInputProps) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const items = parseInput(text);
    if (items.length >= 2) {
      onSubmit(items);
    }
  };

  const parsedItems = parseInput(text);
  const isValid = parsedItems.length >= 2;

  return (
    <div className="max-w-2xl mx-auto">
      <label className="block mb-4">
        <span className="text-lg font-bold uppercase tracking-wide block mb-2">
          Paste your list
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'- Item one\n- Item two\n- Item three\n...'}
          className="w-full h-64 p-4 bg-(--bg) text-(--fg) border-(--border) border-2 mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-(--fg)"
        />
      </label>

      <div className="flex justify-between items-center">
        <span className="mono text-sm">
          {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''}{' '}
          detected
        </span>

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="px-8 py-3 bg-(--fg) text-(--bg) font-bold uppercase tracking-wide border-(--border) border-2 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 active:opacity-60"
        >
          Start Ranking
        </button>
      </div>

      {parsedItems.length === 1 && (
        <p className="mt-4 mono text-sm">Need at least 2 items to compare</p>
      )}
    </div>
  );
};
