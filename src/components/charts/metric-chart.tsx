"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import type { ChartType, MetricSeries } from "~/types/metrics";

interface MetricChartProps {
  series: MetricSeries[];
  chartType: ChartType;
  name: string;
  unit: string;
  mini?: boolean;
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

export function MetricChart({ series, chartType, name, unit, mini = false }: MetricChartProps) {
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

  const spanYears =
    data.length >= 2
      ? (new Date(data.at(-1)!.date).getTime() - new Date(data[0]!.date).getTime()) /
        (1000 * 60 * 60 * 24 * 365)
      : 10;

  const tickFormatter = makeTickFormatter(spanYears);

  const margin = mini
    ? { top: 2, right: 2, bottom: 0, left: 0 }
    : { top: 8, right: 8, bottom: 0, left: -20 };

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
      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={38} />
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
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
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
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={1.5}
            fill="url(#fillValue)"
            dot={false}
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
        <Line
          type={chartType === "step" ? "stepAfter" : "monotone"}
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
