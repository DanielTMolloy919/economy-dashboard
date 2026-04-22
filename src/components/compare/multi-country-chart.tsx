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
import { clampedDomain } from "~/lib/chart-domain";

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

function makeTickFormatter(spanYears: number) {
  return (dateStr: string) => {
    const d = new Date(dateStr);
    if (spanYears <= 1) {
      return d.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
    }
    return `'${d.getFullYear().toString().slice(2)}`;
  };
}

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

  const domain = clampedDomain(allValues);

  const spanYears =
    data.length >= 2
      ? (new Date(data.at(-1)!.date).getTime() -
          new Date(data[0]!.date).getTime()) /
        (1000 * 60 * 60 * 24 * 365)
      : 10;

  const tickFormatter = makeTickFormatter(spanYears);
  const yTickFormatter = (v: number) => {
    const rounded = Math.round(v * 10) / 10;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
        <CartesianGrid horizontal={true} vertical={false} />
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
