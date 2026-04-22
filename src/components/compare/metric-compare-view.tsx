"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { HealthBadge } from "~/components/dashboard/health-badge";
import {
  TrendArrow,
  getTrendDirection,
  getTrendSentiment,
} from "~/components/dashboard/trend-arrow";
import {
  TimeRangeTabs,
  type TimeRange,
} from "~/components/dashboard/time-range-tabs";
import {
  MultiCountryChart,
  COUNTRY_COLORS,
  type MultiCountryRow,
} from "~/components/compare/multi-country-chart";
import type { CountryCode } from "~/config/countries";
import { validCountryCodes } from "~/config/countries";
import type { MetricSeries } from "~/types/metrics";
import type { HealthStatus, TrendPolarity } from "~/types/metrics";

export interface CountryMetricSummary {
  code: CountryCode;
  name: string;
  flag: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  decimals: number;
  health: HealthStatus;
  trendPolarity: TrendPolarity;
  trendWindow: number;
  trendThreshold: number;
  series: MetricSeries[];
}

interface MetricCompareViewProps {
  metricId: string;
  metricName: string;
  description?: string;
  unit: string; // display unit (% YoY, %, etc.)
  mergedRows: MultiCountryRow[];
  countryData: CountryMetricSummary[];
}

function filterRows(rows: MultiCountryRow[], range: TimeRange) {
  if (range === "all") return rows;
  const yearsBack = range === "1Y" ? 1 : range === "5Y" ? 5 : 10;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - yearsBack);
  return rows.filter((r) => new Date(r.date) >= cutoff);
}

function filterSeries(series: MetricSeries[], range: TimeRange) {
  if (range === "all") return series;
  const yearsBack = range === "1Y" ? 1 : range === "5Y" ? 5 : 10;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - yearsBack);
  return series.filter((p) => new Date(p.date) >= cutoff);
}

export function MetricCompareView({
  metricId,
  metricName,
  description,
  unit,
  mergedRows,
  countryData,
}: MetricCompareViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const filteredRows = useMemo(
    () => filterRows(mergedRows, timeRange),
    [mergedRows, timeRange],
  );

  // Sort countries by current value, most extreme first (assumes bigger = more notable).
  const sortedCountries = useMemo(
    () => [...countryData].sort((a, b) => b.currentValue - a.currentValue),
    [countryData],
  );

  const byCode = new Map(countryData.map((c) => [c.code, c]));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href="/au"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="size-4" />
            <span>Back</span>
          </Link>
          <div className="min-w-0 text-right">
            <h1 className="text-lg font-bold leading-tight truncate">
              {metricName}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              Compare across countries
            </p>
          </div>
        </div>
        <div className="border-t bg-background/95">
          <div className="mx-auto w-full max-w-2xl px-4 py-2 flex items-center justify-between gap-3">
            <TimeRangeTabs value={timeRange} onChange={setTimeRange} />
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        <div className="h-80">
          <MultiCountryChart data={filteredRows} unit={unit} />
        </div>

        {/* Custom legend tied to line colours */}
        <div className="flex flex-wrap gap-3 justify-center">
          {validCountryCodes.map((code) => {
            const c = byCode.get(code);
            if (!c) return null;
            return (
              <div key={code} className="flex items-center gap-1.5 text-xs">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: COUNTRY_COLORS[code] }}
                />
                <span>
                  {c.flag} {c.name}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedCountries.map((c) => {
            const trend = getTrendDirection(
              filterSeries(c.series, timeRange),
              c.trendWindow,
              c.trendThreshold,
            );
            const sentiment = getTrendSentiment(trend, c.trendPolarity);
            const change = c.currentValue - c.previousValue;
            const changeStr = `${change >= 0 ? "+" : ""}${change.toFixed(c.decimals)}`;
            return (
              <Link
                key={c.code}
                href={`/${c.code}#${metricId}`}
                className="block group"
              >
                <Card className="transition-colors group-hover:bg-muted/50">
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <HealthBadge status={c.health} />
                        <span className="text-sm">
                          {c.flag} {c.name}
                        </span>
                      </div>
                      <TrendArrow direction={trend} sentiment={sentiment} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold tabular-nums">
                        {c.currentValue.toFixed(c.decimals)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {c.unit}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {changeStr} vs prev
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 text-xs text-muted-foreground text-center">
          Data sourced per country — see individual dashboards for source
          attribution.
        </div>
      </footer>
    </div>
  );
}
