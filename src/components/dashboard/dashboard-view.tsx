"use client";
import { useState, useMemo, useEffect } from "react";
import type { MetricData } from "~/types/metrics";
import type { CountryCode } from "~/config/countries";
import { countries } from "~/config/countries";
import type { MetricDefinition } from "~/config/metrics";
import { getMetricDefinitions, getHeroMetricIds } from "~/config/metrics";
import {
  getHealthThresholds,
  getOverallScore,
  getHealthStatus,
} from "~/config/health-thresholds";
import { getMetricInfo } from "~/config/metric-info";
import { computeScoreHistory } from "~/lib/score-history";
import { TimeRangeTabs, type TimeRange } from "~/components/dashboard/time-range-tabs";
import { OverallHealth } from "~/components/dashboard/overall-health";
import { SummaryCards } from "~/components/dashboard/summary-cards";
import { MetricCard } from "~/components/dashboard/metric-card";
import { ThemeToggle } from "~/components/dashboard/theme-toggle";
import { Button } from "~/components/ui/button";
import { CountrySwitcher } from "~/components/dashboard/country-switcher";
import { ScoreHistoryChart } from "~/components/dashboard/score-history-chart";
import { Separator } from "~/components/ui/separator";

function filterSeries(
  series: MetricData["series"],
  range: TimeRange,
): MetricData["series"] {
  if (range === "all") return series;
  const yearsBack = range === "1Y" ? 1 : range === "5Y" ? 5 : 10;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - yearsBack);
  return series.filter((p) => new Date(p.date) >= cutoff);
}

function formatReplayDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}

export function DashboardView({ metrics, country }: { metrics: MetricData[]; country: CountryCode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [replayDate, setReplayDate] = useState<string | null>(null);
  const [showBands, setShowBands] = useState(false);

  const config = countries[country];
  const metricDefs = getMetricDefinitions(country);
  const heroMetricIds = getHeroMetricIds(country);
  const thresholds = getHealthThresholds(country);
  const metricInfoMap = getMetricInfo(country);

  // Pre-compute score history once (all GDP dates × all metrics)
  const scoreHistory = useMemo(
    () => computeScoreHistory(thresholds, metrics),
    // thresholds is a stable module-level reference; metrics changes only on data refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics],
  );

  // Slice every metric's series to the replay date (or use live data)
  const effectiveMetrics = useMemo(() => {
    if (!replayDate) return metrics;
    return metrics.map((m) => {
      const upTo = m.series.filter((p) => p.date <= replayDate);
      const latest = upTo[upTo.length - 1];
      if (!latest) return m;
      const value = latest.value;
      const prev = upTo.length >= 2 ? upTo[upTo.length - 2]!.value : value;
      const health = getHealthStatus(thresholds, m.id, value);
      return { ...m, currentValue: value, previousValue: prev, series: upTo, health };
    });
  }, [replayDate, metrics, thresholds]);

  const metricsMap = new Map(effectiveMetrics.map((m) => [m.id, m]));
  const heroMetrics = heroMetricIds
    .map((id) => metricsMap.get(id))
    .filter((m): m is MetricData => m !== undefined);

  const overallScore = getOverallScore(
    thresholds,
    effectiveMetrics.map((m) => ({ id: m.id, currentValue: m.currentValue, series: m.series })),
  );

  // Escape key clears replay
  useEffect(() => {
    if (!replayDate) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReplayDate(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [replayDate]);

  const heroSet = new Set(heroMetricIds);
  const otherDefinitions = metricDefs.filter((d) => !heroSet.has(d.id));

  // Group remaining metrics by section
  const otherSections = Array.from(
    otherDefinitions.reduce((map, def) => {
      if (!map.has(def.section)) map.set(def.section, []);
      map.get(def.section)!.push(def);
      return map;
    }, new Map<string, MetricDefinition[]>()),
  );

  const toSlug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const chapters = [
    { label: "Key Indicators", id: "key-indicators" },
    ...otherSections.map(([section]) => ({ label: section, id: toSlug(section) })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CountrySwitcher current={country} />
            <div>
              <h1 className="text-lg font-bold leading-tight">{config.name} Economy</h1>
              <p className="text-xs text-muted-foreground">Economic health dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TimeRangeTabs value={timeRange} onChange={setTimeRange} />
            <Button
              variant={showBands ? "default" : "outline"}
              size="sm"
              onClick={() => setShowBands((v) => !v)}
              aria-pressed={showBands}
            >
              Bands
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
        {/* Hero */}
        <section className="flex flex-col gap-6 items-center">
          <OverallHealth
            score={overallScore}
            metrics={effectiveMetrics.map((m) => ({ id: m.id, currentValue: m.currentValue, series: m.series }))}
            thresholds={thresholds}
            metricDefinitions={metricDefs}
          />
          <SummaryCards
            metrics={heroMetrics}
            metricDefinitions={metricDefs}
            metricInfo={metricInfoMap}
          />

          {/* Replay banner */}
          {replayDate && (
            <div className="flex w-full items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Viewing{" "}
                <span className="font-medium text-foreground">
                  {formatReplayDate(replayDate)}
                </span>{" "}
                — press <kbd className="rounded border px-1 text-xs">Esc</kbd> to return to live
              </span>
              <button
                onClick={() => setReplayDate(null)}
                className="ml-3 text-muted-foreground hover:text-foreground"
                aria-label="Return to live view"
              >
                ✕
              </button>
            </div>
          )}

          <ScoreHistoryChart
            data={scoreHistory}
            selectedDate={replayDate}
            onSelectDate={setReplayDate}
          />

          <div className="flex flex-wrap gap-2 justify-center">
            {chapters.map((ch) => (
              <a
                key={ch.id}
                href={`#${ch.id}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
              >
                {ch.label}
              </a>
            ))}
          </div>
        </section>

        <Separator />

        {/* Big 4 */}
        <section id="key-indicators" className="flex flex-col gap-4 scroll-mt-20">
          {heroMetricIds.map((id) => {
            const def = metricDefs.find((d) => d.id === id);
            const data = metricsMap.get(id);
            if (!def || !data) return null;
            return (
              <div key={id} id={id} className="scroll-mt-20">
                <MetricCard
                  data={data}
                  definition={def}
                  filteredSeries={filterSeries(data.series, timeRange)}
                  metricInfo={metricInfoMap}
                  locale={config.locale}
                  threshold={showBands ? thresholds[id] : undefined}
                />
              </div>
            );
          })}
        </section>

        <Separator />

        {/* Other metrics by section */}
        <section className="flex flex-col gap-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            More Indicators
          </h2>
          {otherSections.map(([section, defs]) => (
            <div key={section} id={toSlug(section)} className="flex flex-col gap-4 scroll-mt-20">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                {section}
              </h3>
              {defs.map((def) => {
                const data = metricsMap.get(def.id);
                if (!data) return null;
                return (
                  <div key={def.id} id={def.id} className="scroll-mt-20">
                    <MetricCard
                      data={data}
                      definition={def}
                      filteredSeries={filterSeries(data.series, timeRange)}
                      metricInfo={metricInfoMap}
                      locale={config.locale}
                      threshold={showBands ? thresholds[def.id] : undefined}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t mt-16">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 text-xs text-muted-foreground text-center">
          Data sourced from {config.dataSources}. Updated periodically.
        </div>
      </footer>
    </div>
  );
}
