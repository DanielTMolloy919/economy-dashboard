import { Card, CardContent } from "~/components/ui/card";
import { HealthBadge } from "~/components/dashboard/health-badge";
import {
  TrendArrow,
  getTrendDirection,
  getTrendSentiment,
} from "~/components/dashboard/trend-arrow";
import { metricDefinitions } from "~/config/metrics";
import { metricInfo } from "~/config/metric-info";
import { MetricInfoPopover } from "~/components/dashboard/metric-info-popover";
import type { MetricData } from "~/types/metrics";

export function SummaryCards({ metrics }: { metrics: MetricData[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
      {metrics.map((m) => {
        const definition = metricDefinitions.find((d) => d.id === m.id);
        const trend = getTrendDirection(m.currentValue, m.previousValue);
        const polarity = definition?.trendPolarity ?? "neutral";
        const sentiment = getTrendSentiment(trend, polarity);
        const decimals = definition?.decimals ?? 1;
        const info = metricInfo[m.id];
        return (
          <a key={m.id} href={`#${m.id}`} className="block group">
            <Card className="transition-colors group-hover:bg-muted/50">
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HealthBadge status={m.health} />
                    {info && (
                      <span onClick={(e) => e.preventDefault()}>
                        <MetricInfoPopover info={info} name={m.name} />
                      </span>
                    )}
                  </div>
                  <TrendArrow direction={trend} sentiment={sentiment} />
                </div>
                <p className="text-xs text-muted-foreground">{m.name}</p>
                <p className="text-xl font-bold mt-0.5">
                  {m.currentValue.toFixed(decimals)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {m.unit}
                  </span>
                </p>
              </CardContent>
            </Card>
          </a>
        );
      })}
    </div>
  );
}
