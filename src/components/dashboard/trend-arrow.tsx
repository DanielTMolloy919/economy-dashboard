import { cn } from "~/lib/utils";
import type { MetricSeries, TrendDirection, TrendPolarity, TrendSentiment } from "~/types/metrics";

// Fit a least-squares linear regression over the last `window` points.
// Returns the slope per period. Uses point index (0, 1, 2…) as x-axis
// so the unit is "value change per data point" regardless of date spacing.
function regressionSlope(series: MetricSeries[], window: number): number {
  const points = series.slice(-window);
  const n = points.length;
  if (n < 2) return 0;

  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.value);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  const ssXY = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i]! - meanY), 0);
  const ssXX = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);

  return ssXX === 0 ? 0 : ssXY / ssXX;
}

// Derive trend direction from regression slope over a window.
// Returns neutral if the absolute slope is below the threshold — i.e. the
// series is flat enough that no meaningful direction can be claimed.
export function getTrendDirection(
  series: MetricSeries[],
  window: number,
  threshold: number,
): TrendDirection {
  const slope = regressionSlope(series, window);
  if (Math.abs(slope) < threshold) return "neutral";
  return slope > 0 ? "up" : "down";
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
