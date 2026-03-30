"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { HealthBadge } from "~/components/dashboard/health-badge";
import { TrendArrow, getTrendDirection } from "~/components/dashboard/trend-arrow";
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
  const info = metricInfo[definition.id];
  const change = data.currentValue - data.previousValue;
  const changeStr = `${change >= 0 ? "+" : ""}${change.toFixed(2)}`;

  return (
    <Card>
      <CardHeader className="pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <HealthBadge status={data.health} />
          <div className="flex items-center gap-1">
            <TrendArrow direction={trend} />
            {info && <MetricInfoPopover info={info} name={data.name} />}
          </div>
        </div>
        <p className="text-sm font-medium leading-tight">{data.name}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold">{data.currentValue}</span>
          <span className="text-xs text-muted-foreground">{data.unit}</span>
        </div>
        <p className="text-xs text-muted-foreground">{changeStr} vs prev</p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="h-20">
          <MetricChart
            series={filteredSeries}
            chartType={definition.chartType}
            name={data.name}
            unit={data.unit}
          />
        </div>
      </CardContent>
      <CardFooter className="py-1">
        <p className="text-xs text-muted-foreground">
          {data.source} ·{" "}
          {new Date(data.lastUpdated).toLocaleDateString("en-AU", {
            month: "short",
            year: "numeric",
          })}
        </p>
      </CardFooter>
    </Card>
  );
}
