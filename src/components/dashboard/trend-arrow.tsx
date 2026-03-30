import { cn } from "~/lib/utils";
import type { TrendDirection, TrendPolarity, TrendSentiment } from "~/types/metrics";

export function getTrendDirection(current: number, previous: number): TrendDirection {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "neutral";
}

export function getTrendSentiment(
  direction: TrendDirection,
  polarity: TrendPolarity,
): TrendSentiment {
  if (direction === "neutral" || polarity === "neutral") return "neutral";
  if (polarity === "positive") return direction === "up" ? "good" : "bad";
  return direction === "up" ? "bad" : "good";
}

export function TrendArrow({
  direction,
  sentiment,
  className,
}: {
  direction: TrendDirection;
  sentiment: TrendSentiment;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-sm font-semibold",
        sentiment === "good" && "text-green-500",
        sentiment === "bad" && "text-red-500",
        sentiment === "neutral" && "text-muted-foreground",
        className,
      )}
    >
      {direction === "up" ? "↑" : direction === "down" ? "↓" : "→"}
    </span>
  );
}
