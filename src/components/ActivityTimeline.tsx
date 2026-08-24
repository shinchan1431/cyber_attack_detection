import { useMemo } from "react";

interface ActivityTimelineProps {
  data: { time: string; count: number }[];
}

export default function ActivityTimeline({ data }: ActivityTimelineProps) {
  const max = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Activity Volume (24h)
        </h3>
        <span className="font-mono text-xs text-[var(--color-text-dim)]">
          {data.reduce((s, d) => s + d.count, 0)} events
        </span>
      </div>
      <div className="flex h-32 items-end gap-1">
        {data.map((d, i) => {
          const h = (d.count / max) * 100;
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              <div
                className="w-full rounded-t bg-gradient-to-t from-blue-500/40 to-cyan-400/70 transition-all duration-300 hover:from-blue-500/60 hover:to-cyan-300"
                style={{ height: `${Math.max(h, 2)}%` }}
              />
              <div className="pointer-events-none absolute -top-8 hidden whitespace-nowrap rounded bg-[var(--color-bg)] px-2 py-1 font-mono text-[10px] text-[var(--color-text)] group-hover:block">
                {d.count} events
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[var(--color-text-dim)]">
        <span>24h ago</span>
        <span>12h ago</span>
        <span>now</span>
      </div>
    </div>
  );
}
