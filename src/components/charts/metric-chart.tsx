"use client";
import { useId } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceArea, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import type { ChartType, MetricSeries } from "~/types/metrics";
import type { MetricThreshold, ThresholdRange } from "~/config/health-thresholds";
import {
  formatTooltipDate,
  makeTimeTickFormatter,
  makeYTickFormatter,
  timeTicks,
  toTime,
  yAxisScale,
} from "~/lib/chart-domain";

interface MetricChartProps {
  series: MetricSeries[];
  chartType: ChartType;
  name: string;
  unit: string;
  mini?: boolean;
  threshold?: MetricThreshold;
}

const BAND_COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
} as const;
const BAND_OPACITY = 0.18;

// Clip a threshold range to the visible y-domain. Returns null if the range
// falls entirely outside the chart, so we don't render invisible ReferenceAreas.
function clipRange(range: ThresholdRange, loY: number, hiY: number): [number, number] | null {
  const lo = Math.max(range.min, loY);
  const hi = Math.min(range.max, hiY);
  if (hi <= lo) return null;
  return [lo, hi];
}

function buildBands(threshold: MetricThreshold, loY: number, hiY: number) {
  const bands: Array<{ color: keyof typeof BAND_COLORS; y1: number; y2: number }> = [];
  const push = (color: keyof typeof BAND_COLORS, ranges: ThresholdRange[]) => {
    for (const r of ranges) {
      const clipped = clipRange(r, loY, hiY);
      if (clipped) bands.push({ color, y1: clipped[0], y2: clipped[1] });
    }
  };
  push("green", [threshold.green]);
  push("yellow", threshold.yellow);
  push("red", threshold.red);
  return bands;
}

// Bar charts with more points than this become an unreadable comb of
// sub-pixel bars (e.g. 20 years of monthly data), so draw them as an area.
const MAX_BARS = 130;

function medianGap(times: number[]): number {
  if (times.length < 2) return 30 * 24 * 60 * 60 * 1000;
  const gaps = times.slice(1).map((t, i) => t - times[i]!).sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)]!;
}

export function MetricChart({ series, chartType, name, unit, mini = false, threshold }: MetricChartProps) {
  const chartConfig = {
    value: {
      label: name,
      color: "var(--chart-1)",
    },
    negative: {
      label: "Negative",
      color: "var(--chart-5)",
    },
  } satisfies ChartConfig;
  const gradientId = `fill-${useId().replace(/:/g, "")}`;
  const data = series.map((p) => ({ value: p.value, t: toTime(p.date) }));
  const values = data.map((d) => d.value);
  const { domain: yDomain, ticks: yTicks } = yAxisScale(values);
  const [loY, hiY] = yDomain;
  const bands = !mini && threshold ? buildBands(threshold, loY, hiY) : [];
  const bandElements = bands.map((b, i) => (
    <ReferenceArea
      key={`${b.color}-${i}`}
      y1={b.y1}
      y2={b.y2}
      fill={BAND_COLORS[b.color]}
      fillOpacity={BAND_OPACITY}
      stroke="none"
      ifOverflow="hidden"
    />
  ));

  const effectiveType: ChartType = chartType === "bar" && data.length > MAX_BARS ? "area" : chartType;

  // Time-scaled x-axis so irregular dates (e.g. central-bank decision dates) and
  // gaps in the data are spaced correctly. Bars get half a period of padding on
  // each side so the first and last bars aren't cut in half.
  const times = data.map((d) => d.t);
  const tMin = times[0] ?? 0;
  const tMax = times.at(-1) ?? 0;
  const xPad = effectiveType === "bar" ? medianGap(times) / 2 : 0;
  const xDomain: [number, number] = [tMin - xPad, tMax + xPad];
  const xTicks = timeTicks(tMin, tMax);
  const xTickFormatter = makeTimeTickFormatter(tMin, tMax);
  const yTickFormatter = makeYTickFormatter(yTicks);

  const margin = mini
    ? { top: 2, right: 2, bottom: 0, left: 0 }
    : { top: 8, right: 8, bottom: 0, left: 0 };

  const axes = mini ? null : (
    <>
      <XAxis
        dataKey="t"
        type="number"
        scale="time"
        domain={xDomain}
        ticks={xTicks}
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        tickFormatter={xTickFormatter}
      />
      <YAxis
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        width="auto"
        domain={yDomain}
        ticks={yTicks}
        allowDataOverflow
        tickFormatter={yTickFormatter}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            indicator="dot"
            labelFormatter={(_, payload) => {
              const t = (payload?.[0]?.payload as { t?: number } | undefined)?.t;
              return t === undefined ? "" : formatTooltipDate(t);
            }}
            formatter={(value) =>
              `${(value as number).toLocaleString("en-AU", { maximumFractionDigits: 2 })} ${unit.split(" ")[0]}`
            }
          />
        }
      />
    </>
  );

  if (effectiveType === "bar") {
    return (
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart data={data} margin={margin}>
          {axes}
          <CartesianGrid horizontal={true} vertical={false} />
          {bandElements}
          <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value >= 0 ? "var(--color-value)" : "var(--color-negative)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    );
  }

  if (effectiveType === "area") {
    return (
      <ChartContainer config={chartConfig} className="h-full w-full">
        <AreaChart data={data} margin={margin}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          {axes}
          <CartesianGrid horizontal={true} vertical={false} />
          {bandElements}
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart data={data} margin={margin}>
        {axes}
        <CartesianGrid horizontal={true} vertical={false} />
        {bandElements}
        <Line
          type={effectiveType === "step" ? "stepAfter" : "monotone"}
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
