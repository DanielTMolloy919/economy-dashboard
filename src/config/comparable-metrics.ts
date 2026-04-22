// Metric IDs that can be compared across all 5 countries.
// Same ID, same unit, same semantics across au/nz/us/uk/ca.
// Trade is excluded because currency units differ per country.
export const COMPARABLE_METRIC_IDS = [
  "gdp",
  "gdp-per-capita",
  "cpi",
  "unemployment",
  "wages",
  "real-wages",
] as const;

export type ComparableMetricId = (typeof COMPARABLE_METRIC_IDS)[number];

export function isComparableMetric(id: string): id is ComparableMetricId {
  return (COMPARABLE_METRIC_IDS as readonly string[]).includes(id);
}
