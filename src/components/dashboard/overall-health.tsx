"use client";
import { Info } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { healthThresholds, getHealthScore, getHealthStatus } from "~/config/health-thresholds";
import { metricDefinitions } from "~/config/metrics";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "Mixed";
  return "At Risk";
}

export function OverallHealth({
  score,
  metrics,
}: {
  score: number;
  metrics?: { id: string; currentValue: number }[];
}) {
  const color = scoreColor(score);
  const data = [{ value: score }, { value: 100 - score }];
  const breakdown = (metrics ?? [])
    .map((m) => {
      const threshold = healthThresholds[m.id];
      if (!threshold) return null;
      const def = metricDefinitions.find((d) => d.id === m.id);
      const status = getHealthStatus(m.id, m.currentValue);
      const points = getHealthScore(m.id, m.currentValue); // 0/50/100
      const contribution = points * threshold.weight;
      return {
        id: m.id,
        name: def?.name ?? m.id,
        value: m.currentValue,
        weight: threshold.weight,
        status,
        points,
        contribution,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.weight - a.weight);

  return (
    <div className="flex flex-col items-center shrink-0">
      {/* cy=90 puts the gauge center at the bottom; outerRadius=80 fits within height=95 */}
      <div className="relative w-[180px] h-[95px]">
        <PieChart width={180} height={95}>
          <Pie
            data={data}
            startAngle={180}
            endAngle={0}
            cx={90}
            cy={90}
            innerRadius={58}
            outerRadius={82}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="oklch(0.922 0 0)" className="dark:fill-[oklch(0.269_0_0)]" />
          </Pie>
        </PieChart>
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center leading-tight">
          <span className="text-3xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-sm font-semibold">Economy Health</p>
        {breakdown.length > 0 && (
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground"
                />
              }
            >
              <Info data-icon />
            </PopoverTrigger>
            <PopoverContent side="bottom" align="center" className="w-96">
              <PopoverHeader>
                <PopoverTitle>How the score is calculated</PopoverTitle>
                <PopoverDescription>
                  Each metric is mapped to points (green=100, yellow=50, red=0), then averaged using
                  fixed weights.
                </PopoverDescription>
              </PopoverHeader>

              <div className="rounded-md border border-border">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span>Metric</span>
                  <span className="text-right">Weight</span>
                  <span className="text-right">Pts×W</span>
                </div>
                <div className="h-px bg-border" />
                <div className="max-h-56 overflow-auto">
                  {breakdown.map((b) => (
                    <div
                      key={b.id}
                      className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{b.name}</span>
                        <span className="text-muted-foreground">
                          {b.value} • {b.status} ({b.points})
                        </span>
                      </div>
                      <span className="tabular-nums text-right text-muted-foreground">
                        {(b.weight * 100).toFixed(0)}%
                      </span>
                      <span className="tabular-nums text-right font-medium">
                        {b.contribution.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-muted-foreground">
                    Final score = round(sum(points×weight) / sum(weights))
                  </span>
                  <span className="font-semibold tabular-nums">{score}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <p className="text-xs text-muted-foreground" style={{ color }}>
        {scoreLabel(score)}
      </p>
    </div>
  );
}
