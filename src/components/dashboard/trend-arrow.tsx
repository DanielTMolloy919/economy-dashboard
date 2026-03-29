import { cn } from "~/lib/utils";
import type { TrendDirection } from "~/types/metrics";

export function getTrendDirection(current: number, previous: number): TrendDirection {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "neutral";
}

export function TrendArrow({
  direction,
  className,
}: {
  direction: TrendDirection;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-sm font-semibold",
        direction === "up" && "text-green-500",
        direction === "down" && "text-red-500",
        direction === "neutral" && "text-muted-foreground",
        className,
      )}
    >
      {direction === "up" ? "↑" : direction === "down" ? "↓" : "→"}
    </span>
  );
}
