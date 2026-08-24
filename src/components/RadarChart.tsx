import { useEffect, useState } from "react";
import { Radar } from "lucide-react";

interface RadarChartProps {
  active: boolean;
}

export default function RadarChart({ active }: RadarChartProps) {
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setSweepAngle((a) => (a + 2) % 360);
    }, 16);
    return () => clearInterval(id);
  }, [active]);

  const rings = [0.25, 0.5, 0.75, 1];
  const crossLines = [0, 45, 90, 135];

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Threat Radar
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)]">
          <span className={`h-2 w-2 rounded-full ${active ? "bg-cyan-500 animate-blink" : "bg-slate-600"}`} />
          {active ? "Scanning" : "Idle"}
        </span>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[240px]">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <defs>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.4)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="95" fill="url(#radarGlow)" />
          {rings.map((r) => (
            <circle
              key={r}
              cx="100" cy="100" r={95 * r}
              fill="none"
              stroke="rgba(6,182,212,0.15)"
              strokeWidth="1"
            />
          ))}
          {crossLines.map((angle) => (
            <line
              key={angle}
              x1="100" y1="5"
              x2="100" y2="195"
              stroke="rgba(6,182,212,0.1)"
              strokeWidth="1"
              transform={`rotate(${angle} 100 100)`}
            />
          ))}
          <g transform={`rotate(${sweepAngle} 100 100)`}>
            <path d="M 100 100 L 100 5 A 95 95 0 0 1 195 100 Z" fill="url(#sweep)" opacity="0.5" />
            <line x1="100" y1="100" x2="100" y2="5" stroke="rgba(6,182,212,0.6)" strokeWidth="1.5" />
          </g>
          <circle cx="100" cy="100" r="3" fill="rgba(6,182,212,0.8)" />
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--color-text-dim)]">
        <Radar className="h-3.5 w-3.5" />
        Real-time signal monitoring
      </div>
    </div>
  );
}
