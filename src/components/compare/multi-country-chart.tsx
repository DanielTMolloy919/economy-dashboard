"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import type { CountryCode } from "~/config/countries";
import { countries, validCountryCodes } from "~/config/countries";
import {
  formatTooltipDate,
  makeTimeTickFormatter,
  makeYTickFormatter,
  timeTicks,
  toTime,
  yAxisScale,
} from "~/lib/chart-domain";

export type MultiCountryRow = { date: string } & Partial<
  Record<CountryCode, number>
>;

// Distinct hues per country. The project's shadcn --chart-* vars are all
// greyscale, so we hard-code colours here. Values chosen to read well in
// both light and dark modes (Tailwind 500-ish equivalents).
export const COUNTRY_COLORS: Record<CountryCode, string> = {
  au: "#3b82f6", // blue
  nz: "#22c55e", // green
  us: "#ef4444", // red
  uk: "#f59e0b", // amber
  ca: "#a855f7", // purple
};

interface MultiCountryChartProps {
  data: MultiCountryRow[];
  unit: string;
}

export function MultiCountryChart({ data, unit }: MultiCountryChartProps) {
  const chartConfig = validCountryCodes.reduce<ChartConfig>((acc, code) => {
    acc[code] = {
      label: `${countries[code].flag} ${countries[code].name}`,
      color: COUNTRY_COLORS[code],
    };
    return acc;
  }, {});

  // Collect every non-null value across all countries to compute a shared y-domain.
  const allValues: number[] = [];
  for (const row of data) {
    for (const code of validCountryCodes) {
      const v = row[code];
      if (typeof v === "number") allValues.push(v);
    }
  }

  const { domain: yDomain, ticks: yTicks } = yAxisScale(allValues);
  const yTickFormatter = makeYTickFormatter(yTicks);

  // Time-scaled x-axis: countries report on different date conventions
  // (quarter start vs quarter end, monthly vs quarterly), so position by date.
  const rows = data.map((r) => ({ ...r, t: toTime(r.date) }));
  const tMin = rows[0]?.t ?? 0;
  const tMax = rows.at(-1)?.t ?? 0;
  const xTicks = timeTicks(tMin, tMax);
  const xTickFormatter = makeTimeTickFormatter(tMin, tMax);

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={[tMin, tMax]}
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
        <CartesianGrid horizontal={true} vertical={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_, payload) => {
                const t = (payload?.[0]?.payload as { t?: number } | undefined)?.t;
                return t === undefined ? "" : formatTooltipDate(t);
              }}
              formatter={(value, name) => {
                const code = name as CountryCode;
                const cfg = countries[code];
                return `${cfg.flag} ${cfg.name}: ${(value as number).toLocaleString(
                  "en-AU",
                  { maximumFractionDigits: 2 },
                )} ${unit.split(" ")[0]}`;
              }}
            />
          }
        />
        {validCountryCodes.map((code) => (
          <Line
            key={code}
            type="monotone"
            dataKey={code}
            stroke={`var(--color-${code})`}
            strokeWidth={1.5}
            dot={false}
            connectNulls={true}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
