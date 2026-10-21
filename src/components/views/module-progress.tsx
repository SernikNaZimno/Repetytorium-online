import type { ModuleSummary } from "@/lib/stats";
import { STATUS_LABELS } from "@/lib/srs";
import { cn } from "@/lib/cn";

const SEGMENTS = [
  { key: "mastered", className: "bg-success" },
  { key: "young", className: "bg-chart-1" },
  { key: "learning", className: "bg-warning" },
] as const;

export function StatusBar({ sum, className }: { sum: ModuleSummary; className?: string }) {
  return (
    <div className={cn("flex h-2.5 overflow-hidden rounded-full bg-muted", className)}>
      {SEGMENTS.map(s => (
        <div key={s.key} className={cn("h-full transition-all", s.className)} style={{ width: `${(sum.status[s.key] / Math.max(1, sum.total)) * 100}%` }} />
      ))}
    </div>
  );
}

export function StatusLegend({ sum }: { sum: ModuleSummary }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {SEGMENTS.map(s => (
        <span key={s.key} className="flex items-center gap-1.5">
          <i className={cn("size-2 rounded-full", s.className)} /> {STATUS_LABELS[s.key]} {sum.status[s.key]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <i className="size-2 rounded-full bg-muted-foreground/30" /> {STATUS_LABELS.new} {sum.status.new}
      </span>
    </div>
  );
}
