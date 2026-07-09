'use client';

interface StatsProps {
  total: number;
}

export function Stats({ total }: StatsProps) {
  const progress = Math.min((total / 1000) * 100, 100);

  return (
    <div className="mb-8 p-4 border border-black dark:border-white">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Progress</span>
        <span className="text-sm text-[var(--muted)]">
          {total} / 1,000 videos
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-800">
        <div
          className="h-2 bg-black dark:bg-white transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
