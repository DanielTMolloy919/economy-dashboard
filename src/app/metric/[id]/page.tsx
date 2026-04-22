import { notFound } from "next/navigation";
import { validCountryCodes, countries } from "~/config/countries";
import { getMetricById } from "~/lib/data";
import { getMetricDefinitions } from "~/config/metrics";
import { getMetricInfo } from "~/config/metric-info";
import { isComparableMetric } from "~/config/comparable-metrics";
import {
  MetricCompareView,
  type CountryMetricSummary,
} from "~/components/compare/metric-compare-view";
import type { MultiCountryRow } from "~/components/compare/multi-country-chart";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isComparableMetric(id)) return {};
  // Find the display name from any country's definitions (they match for shared IDs).
  const def = getMetricDefinitions("au").find((d) => d.id === id);
  return {
    title: `Compare ${def?.name ?? id} across countries`,
    description: `Cross-country comparison of ${def?.name ?? id}.`,
  };
}

export default async function MetricComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isComparableMetric(id)) notFound();

  // Load each country's data for this metric in parallel.
  const loaded = validCountryCodes
    .map((code) => {
      const def = getMetricDefinitions(code).find((d) => d.id === id);
      const data = getMetricById(code, id);
      if (!def || !data) return null;
      return { code, def, data };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (loaded.length === 0) notFound();

  // Merge all countries' series into one date-keyed table for recharts.
  const rowMap = new Map<string, MultiCountryRow>();
  for (const { code, data } of loaded) {
    for (const point of data.series) {
      let row = rowMap.get(point.date);
      if (!row) {
        row = { date: point.date };
        rowMap.set(point.date, row);
      }
      row[code] = point.value;
    }
  }
  const mergedRows: MultiCountryRow[] = Array.from(rowMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date),
  );

  // Country-level summary for the cards below the chart.
  const countryData: CountryMetricSummary[] = loaded.map(
    ({ code, def, data }) => {
      const config = countries[code];
      return {
        code,
        name: config.name,
        flag: config.flag,
        currentValue: data.currentValue,
        previousValue: data.previousValue,
        unit: data.unit,
        decimals: def.decimals,
        health: data.health,
        trendPolarity: def.trendPolarity,
        trendWindow: def.trendWindow,
        trendThreshold: def.trendThreshold,
        series: data.series,
      };
    },
  );

  // Use AU's definition for the shared display metadata (name, description, unit).
  const canonical =
    loaded.find((l) => l.code === "au") ?? loaded[0]!;
  const info = getMetricInfo("au")[id];

  return (
    <MetricCompareView
      metricId={id}
      metricName={canonical.def.name}
      description={info?.summary ?? canonical.def.description}
      unit={canonical.data.unit}
      mergedRows={mergedRows}
      countryData={countryData}
    />
  );
}
