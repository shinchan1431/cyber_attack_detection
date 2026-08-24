import { Shield, ScanLine, Loader2, FilePlus2, Radio } from "lucide-react";

interface HeaderProps {
  scanning: boolean;
  generating: boolean;
  autoMode: boolean;
  lastScan: Date | null;
  onScan: () => void;
  onGenerate: () => void;
  onToggleAuto: () => void;
}

export default function Header({
  scanning, generating, autoMode, lastScan, onScan, onGenerate, onToggleAuto,
}: HeaderProps) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm">
      <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--color-surface)] bg-emerald-500 animate-blink" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--color-text)]">
              Sentinel<span className="text-blue-400">AI</span>
            </h1>
            <p className="text-xs text-[var(--color-text-dim)]">Cyber Attack Detection System</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {lastScan && (
            <span className="hidden font-mono text-xs text-[var(--color-text-dim)] sm:block">
              Last scan: {lastScan.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onToggleAuto}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              autoMode
                ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-400"
                : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Radio className="h-4 w-4" />
            Auto-Scan {autoMode ? "ON" : "OFF"}
          </button>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
            Simulate Traffic
          </button>
          <button
            onClick={onScan}
            disabled={scanning}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            Run Threat Scan
          </button>
        </div>
      </div>
    </header>
  );
}
