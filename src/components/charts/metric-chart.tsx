"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceArea, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import type { ChartType, MetricSeries } from "~/types/metrics";
import type { MetricThreshold, ThresholdRange } from "~/config/health-thresholds";
import { clampedDomain, numericBounds } from "~/lib/chart-domain";

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

function makeTickFormatter(spanYears: number) {
  return (dateStr: string) => {
    const d = new Date(dateStr);
    if (spanYears <= 1) {
      return d.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
    }
    return `'${d.getFullYear().toString().slice(2)}`;
  };
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
  const data = series.map((p) => ({ value: p.value, date: p.date }));
  const values = data.map((d) => d.value);
  const domain = clampedDomain(values);
  const [loY, hiY] = numericBounds(values, domain);
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

  const spanYears =
    data.length >= 2
      ? (new Date(data.at(-1)!.date).getTime() - new Date(data[0]!.date).getTime()) /
        (1000 * 60 * 60 * 24 * 365)
      : 10;

  const tickFormatter = makeTickFormatter(spanYears);

  const yTickFormatter = (v: number) => {
    const rounded = Math.round(v * 10) / 10;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  };

  const margin = mini
    ? { top: 2, right: 2, bottom: 0, left: 0 }
    : { top: 8, right: 8, bottom: 0, left: 0 };

  const axes = mini ? null : (
    <>
      <XAxis
        dataKey="date"
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        interval="preserveStartEnd"
        minTickGap={32}
        tickFormatter={tickFormatter}
      />
      <YAxis
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        width="auto"
        domain={domain}
        allowDataOverflow
        tickFormatter={yTickFormatter}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            indicator="dot"
            labelFormatter={(value) =>
              new Date(value as string).toLocaleDateString("en-AU", {
                month: "short",
                year: "numeric",
              })
            }
            formatter={(value) =>
              `${(value as number).toLocaleString("en-AU", { maximumFractionDigits: 2 })} ${unit.split(" ")[0]}`
            }
          />
        }
      />
    </>
  );

  if (chartType === "bar") {
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

  if (chartType === "area") {
    return (
      <ChartContainer config={chartConfig} className="h-full w-full">
        <AreaChart data={data} margin={margin}>
          <defs>
            <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
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
            fill="url(#fillValue)"
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
          type={chartType === "step" ? "stepAfter" : "monotone"}
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
