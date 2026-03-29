"use client";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartType, MetricSeries } from "~/types/metrics";

const CHART_COLOR = "#3b82f6";
const NEGATIVE_COLOR = "#ef4444";

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
      <Tooltip
        contentStyle={{ fontSize: 11, borderRadius: 6 }}
        labelFormatter={(l) => `Year ${l}`}
      />
    </>
  );

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={margin}>
          {axes}
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? CHART_COLOR : NEGATIVE_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={margin}>
          {axes}
          <Area
            type="monotone"
            dataKey="value"
            stroke={CHART_COLOR}
            strokeWidth={1.5}
            fill={CHART_COLOR}
            fillOpacity={0.1}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={margin}>
        {axes}
        <Line
          type={chartType === "step" ? "stepAfter" : "monotone"}
          dataKey="value"
          stroke={CHART_COLOR}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
