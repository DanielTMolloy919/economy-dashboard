/**
 * Derived metrics — computed from other fetched metrics rather than fetched from APIs directly.
 */

import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData } from "~/types/metrics";
import type { CountryCode } from "~/config/countries";

/**
 * Compute real wage growth = nominal wage growth (YoY%) − CPI inflation (YoY%).
 * Inner-joins on date so only overlapping data points are included.
 */
export function computeRealWages(
  wages: MetricData,
  cpi: MetricData,
  country: CountryCode,
): MetricData {
  const thresholds = getHealthThresholds(country);
  const cpiByDate = new Map(cpi.series.map((p) => [p.date, p.value]));

  const series = wages.series
    .filter((p) => cpiByDate.has(p.date))
    .map((p) => ({
      date: p.date,
      value: Math.round((p.value - cpiByDate.get(p.date)!) * 10) / 10,
    }));

  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;

  const name = country === "nz" ? "Real LCI Growth" : "Real Wage Growth";

  return {
    id: "real-wages",
    name,
    lastUpdated: wages.lastUpdated > cpi.lastUpdated ? wages.lastUpdated : cpi.lastUpdated,
    nextExpectedUpdate:
      wages.nextExpectedUpdate && cpi.nextExpectedUpdate
        ? wages.nextExpectedUpdate < cpi.nextExpectedUpdate
          ? wages.nextExpectedUpdate
          : cpi.nextExpectedUpdate
        : wages.nextExpectedUpdate ?? cpi.nextExpectedUpdate,
    source: wages.source,
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(thresholds, "real-wages", currentValue),
    series,
  };
}
