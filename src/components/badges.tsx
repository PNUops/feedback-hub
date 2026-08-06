import type { Status, Priority } from "@prisma/client";
import { STATUS_LABEL, STATUS_STYLE, PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StateBadge({ closed }: { closed: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white",
        closed ? "bg-violet-600" : "bg-green-600",
      )}
    >
      {closed ? "Closed" : "Open"}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "MEDIUM") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        PRIORITY_STYLE[priority],
      )}
    >
      우선순위 {PRIORITY_LABEL[priority]}
    </span>
  );
}

function readableText(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1f2937" : "#ffffff";
}

export function LabelChip({
  name,
  color,
  withDot,
}: {
  name: string;
  color: string;
  withDot?: boolean;
}) {
  const fg = readableText(color);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: color, color: fg }}
    >
      {withDot && <span className="size-2 rounded-full" style={{ backgroundColor: fg }} />}
      {name}
    </span>
  );
}
