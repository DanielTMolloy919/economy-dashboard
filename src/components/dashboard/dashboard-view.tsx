"use client";
import { useState } from "react";
import type { MetricData } from "~/types/metrics";
import type { MetricDefinition } from "~/config/metrics";
import { metricDefinitions, heroMetricIds } from "~/config/metrics";
import { getOverallScore } from "~/config/health-thresholds";
import { TimeRangeTabs, type TimeRange } from "~/components/dashboard/time-range-tabs";
import { OverallHealth } from "~/components/dashboard/overall-health";
import { SummaryCards } from "~/components/dashboard/summary-cards";
import { MetricCard } from "~/components/dashboard/metric-card";
import { ThemeToggle } from "~/components/dashboard/theme-toggle";
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

export function DashboardView({ metrics }: { metrics: MetricData[] }) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const metricsMap = new Map(metrics.map((m) => [m.id, m]));
  const heroMetrics = heroMetricIds
    .map((id) => metricsMap.get(id))
    .filter((m): m is MetricData => m !== undefined);
  const overallScore = getOverallScore(
    metrics.map((m) => ({ id: m.id, currentValue: m.currentValue })),
  );

  const heroSet = new Set(heroMetricIds);
  const otherDefinitions = metricDefinitions.filter((d) => !heroSet.has(d.id));

  // Group remaining metrics by section
  const otherSections = Array.from(
    otherDefinitions.reduce((map, def) => {
      if (!map.has(def.section)) map.set(def.section, []);
      map.get(def.section)!.push(def);
      return map;
    }, new Map<string, MetricDefinition[]>()),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold leading-tight">🇦🇺 Australian Economy</h1>
            <p className="text-xs text-muted-foreground">Economic health dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <TimeRangeTabs value={timeRange} onChange={setTimeRange} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
        {/* Hero */}
        <section className="flex flex-col gap-6 items-center">
          <OverallHealth score={overallScore} />
          <SummaryCards metrics={heroMetrics} />
        </section>

        <Separator />

        {/* Big 4 */}
        <section className="flex flex-col gap-4">
          {heroMetricIds.map((id) => {
            const def = metricDefinitions.find((d) => d.id === id);
            const data = metricsMap.get(id);
            if (!def || !data) return null;
            return (
              <div key={id} id={id} className="scroll-mt-20">
                <MetricCard
                  data={data}
                  definition={def}
                  filteredSeries={filterSeries(data.series, timeRange)}
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
            <div key={section} className="flex flex-col gap-4">
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
          Data sourced from World Bank, RBA, and ABS. Updated periodically.
        </div>
      </footer>
    </div>
  );
}
