import type { MetricData } from "~/types/metrics";
import type { MetricThreshold } from "~/config/health-thresholds";
import { getOverallScore } from "~/config/health-thresholds";

/**
 * Compute the overall health score at every GDP-quarter date.
 * For each date, each metric uses the most recent value on or before that date.
 * Dates where fewer than half the metrics have data yet are skipped.
 */
export function computeScoreHistory(
  thresholds: Record<string, MetricThreshold>,
  metrics: MetricData[],
): { date: string; score: number }[] {
  const gdp = metrics.find((m) => m.id === "gdp");
  if (!gdp || gdp.series.length === 0) return [];

  const minMetrics = Math.ceil(metrics.length / 2);

  return gdp.series
    .map(({ date }) => {
      const sliced = metrics
        .map((m) => {
          const upTo = m.series.filter((p) => p.date <= date);
          if (upTo.length === 0) return null;
          return {
            id: m.id,
            currentValue: upTo[upTo.length - 1]!.value,
            series: upTo,
          };
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);

      if (sliced.length < minMetrics) return null;

      return { date, score: getOverallScore(thresholds, sliced) };
    })
    .filter((p): p is { date: string; score: number } => p !== null);
}
