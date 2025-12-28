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
      className={`border-border border-2 p-4 ${className}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold uppercase tracking-wide text-sm">
          Progress
        </span>
        <span className="font-mono text-sm">
          {completed}/{total} pairs ({percentage}%)
        </span>
      </div>

      <div className="h-4 border-border border-2 bg-background">
        <div
          className="h-full bg-accent transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
