interface ProgressMeterProps {
  completed: number;
  total: number;
  className?: string;
}

export const ProgressMeter = ({
  completed,
  total,
  className,
}: ProgressMeterProps) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className={`border-stone-950 dark:border-stone-100 border-2 p-4 ${className}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold uppercase tracking-wide text-sm">
          Progress
        </span>
        <span className="font-mono text-sm">
          {completed}/{total} pairs ({percentage}%)
        </span>
      </div>

      <div className="h-4 border-stone-950 dark:border-stone-100 border-2 bg-stone-100 dark:bg-stone-950">
        <div
          className="h-full bg-stone-950 dark:bg-stone-100 transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
