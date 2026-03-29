import { Card, CardContent } from "~/components/ui/card";
import { HealthBadge } from "~/components/dashboard/health-badge";
import { TrendArrow, getTrendDirection } from "~/components/dashboard/trend-arrow";
import type { MetricData } from "~/types/metrics";

export function SummaryCards({ metrics }: { metrics: MetricData[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
      {metrics.map((m) => {
        const trend = getTrendDirection(m.currentValue, m.previousValue);
        return (
          <Card key={m.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <HealthBadge status={m.health} />
                <TrendArrow direction={trend} />
              </div>
              <p className="text-xs text-muted-foreground">{m.name}</p>
              <p className="text-xl font-bold mt-0.5">
                {m.currentValue}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {m.unit}
                </span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
