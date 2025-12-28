import { useState } from 'react';
import { CheckIcon, ClipboardIcon } from '@phosphor-icons/react';
import type { Item } from '../types';

interface ExportButtonProps {
  items: Item[];
}

export const ExportButton = ({ items }: ExportButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    // Sort by Elo descending
    const sorted = [...items].sort((a, b) => b.elo - a.elo);

    // Generate markdown ordered list
    const markdown = sorted
      .map((item, index) => `${index + 1}. ${item.name}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="w-full px-6 py-3 border-border border-2 bg-accent text-accent-foreground font-bold uppercase tracking-wide hover:opacity-80 active:opacity-60 flex items-center justify-center gap-2"
    >
      {copied ? (
        <>
          <CheckIcon size={18} weight="bold" />
          Copied!
        </>
      ) : (
        <>
          <ClipboardIcon size={18} weight="bold" />
          Copy as Markdown
        </>
      )}
    </button>
  );
};
