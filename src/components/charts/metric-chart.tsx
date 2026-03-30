"use client";
import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import type { ChartType, MetricSeries } from "~/types/metrics";

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-1)",
  },
  negative: {
    label: "Negative",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

interface MetricChartProps {
  series: MetricSeries[];
  chartType: ChartType;
  mini?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `'${d.getFullYear().toString().slice(2)}`;
}

export function MetricChart({ series, chartType, mini = false }: MetricChartProps) {
  const data = series.map((p) => ({ value: p.value, label: formatDate(p.date) }));
  const margin = mini
    ? { top: 2, right: 2, bottom: 0, left: 0 }
    : { top: 8, right: 8, bottom: 0, left: -20 };

  const axes = mini ? null : (
    <>
      <XAxis
        dataKey="label"
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        interval="preserveStartEnd"
      />
      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={38} />
      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
    </>
  );

  if (chartType === "bar") {
    return (
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart data={data} margin={margin}>
          {axes}
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
