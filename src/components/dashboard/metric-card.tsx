"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { HealthBadge } from "~/components/dashboard/health-badge";
import {
  TrendArrow,
  getTrendDirection,
  getTrendSentiment,
} from "~/components/dashboard/trend-arrow";
import { MetricChart } from "~/components/charts/metric-chart";
import { MetricInfoPopover } from "~/components/dashboard/metric-info-popover";
import type { MetricData } from "~/types/metrics";
import type { MetricDefinition } from "~/config/metrics";
import { metricInfo } from "~/config/metric-info";

interface MetricCardProps {
  data: MetricData;
  definition: MetricDefinition;
  filteredSeries: MetricData["series"];
}

export function MetricCard({ data, definition, filteredSeries }: MetricCardProps) {
  const trend = getTrendDirection(data.currentValue, data.previousValue);
  const sentiment = getTrendSentiment(trend, definition.trendPolarity);
  const { decimals } = definition;
  const change = data.currentValue - data.previousValue;
  const changeStr = `${change >= 0 ? "+" : ""}${change.toFixed(decimals)}`;
  const info = metricInfo[definition.id];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <HealthBadge status={data.health} />
              {info && <MetricInfoPopover info={info} name={data.name} />}
            </div>
            <p className="text-base font-semibold leading-tight">{data.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums">{data.currentValue.toFixed(decimals)}</span>
              <span className="text-sm text-muted-foreground">{data.unit}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendArrow direction={trend} sentiment={sentiment} />
              <span className="text-xs text-muted-foreground">{changeStr} vs prev</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="h-44">
          <MetricChart
            series={filteredSeries}
            chartType={definition.chartType}
            name={data.name}
            unit={data.unit}
          />
        </div>
      </CardContent>
      <CardFooter className="py-2">
        <p className="text-xs text-muted-foreground">
          {data.source} · Updated{" "}
          {new Date(data.lastUpdated).toLocaleDateString("en-AU", {
            month: "short",
            year: "numeric",
          })}
          {data.nextExpectedUpdate && (
            <>
              {" "}· Next{" "}
              {new Date(data.nextExpectedUpdate).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
              })}
            </>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}
