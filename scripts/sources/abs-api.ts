import { getHealthStatus } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";

// ABS SDMX-JSON 2.0 REST API
// Base: https://data.api.abs.gov.au/rest/data/{agencyId},{dataflowId},{version}/{key}
const ABS_BASE = "https://data.api.abs.gov.au/rest/data";

interface AbsDimension {
  id: string;
  values: { id: string; name: string }[];
}

interface AbsResponse {
  data: {
    dataSets: Array<{
      series: Record<
        string,
        { observations: Record<string, [number | null]> }
      >;
    }>;
    structures: Array<{
      dimensions: {
        series: AbsDimension[];
        observation: AbsDimension[];
      };
    }>;
  };
}

function parseAbsDate(timeId: string): string {
  // Monthly: "2024-11" → "2024-11-01"
  // Quarterly: "2024-Q3" → "2024-07-01"
  if (timeId.includes("-Q")) {
    const [year, q] = timeId.split("-Q") as [string, string];
    const month = ((Number(q) - 1) * 3 + 1).toString().padStart(2, "0");
    return `${year}-${month}-01`;
  }
  return `${timeId}-01`;
}

async function fetchAbs(
  dataflow: string,
  key: string,
  startPeriod: string,
): Promise<AbsResponse> {
  const url = `${ABS_BASE}/${dataflow}/${key}?startPeriod=${startPeriod}&detail=dataonly&format=jsondata`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.sdmx.data+json;version=2.0" },
  });
  if (!res.ok)
    throw new Error(`ABS fetch failed: ${res.status} for ${dataflow}/${key}`);
  return (await res.json()) as AbsResponse;
}

function extractSeries(response: AbsResponse, seriesKey = "0"): MetricSeries[] {
  const structure = response.data.structures[0]!;
  const timeDim = structure.dimensions.observation[0]!;
  const dataset = response.data.dataSets[0]!;

  // Find the series matching seriesKey prefix (or use first series if "0")
  const matchedKey = Object.keys(dataset.series).find((k) =>
    seriesKey === "0" ? true : k.startsWith(seriesKey),
  );
  if (!matchedKey) throw new Error(`No series found matching "${seriesKey}"`);

  const obs = dataset.series[matchedKey]!.observations;
  return Object.entries(obs)
    .map(([idx, [value]]) => ({
      date: parseAbsDate(timeDim.values[Number(idx)]!.id),
      value: value ?? 0,
    }))
    .filter((p) => p.value !== 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Compute year-on-year % change from an index number series (4 quarters back for quarterly)
function toYoY(series: MetricSeries[], periodsPerYear: number): MetricSeries[] {
  return series.slice(periodsPerYear).map((p, i) => {
    const prev = series[i]!;
    const change = ((p.value - prev.value) / prev.value) * 100;
    return { date: p.date, value: Math.round(change * 10) / 10 };
  });
}

export async function fetchGdp(): Promise<MetricData> {
  // ANA_AGG: Australian National Accounts Key Aggregates
  // Key: MEASURE.DATA_ITEM.TSEST.REGION.FREQ
  // M1=Chain volume index, GPM=GDP, 20=Seasonally adjusted, AUS, Q=Quarterly
  // Compute YoY from index numbers (4 quarters back)
  const response = await fetchAbs(
    "ABS,ANA_AGG,1.0.0",
    "M1.GPM.20.AUS.Q",
    "2004-Q1",
  );
  const indexSeries = extractSeries(response);
  const series = toYoY(indexSeries, 4);
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  return {
    id: "gdp",
    name: "GDP Growth",
    lastUpdated: series.at(-1)!.date,
    source: "ABS",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus("gdp", currentValue),
    series,
  };
}

export async function fetchUnemployment(): Promise<MetricData> {
  // LF: Labour Force Survey
  // Key: MEASURE.SEX.AGE.TSEST.REGION.FREQ
  // M13=Unemployment rate (%), 3=Persons, 1599=All ages, 20=Seasonally adjusted, AUS, M=Monthly
  const response = await fetchAbs(
    "ABS,LF,1.0.0",
    "M13.3.1599.20.AUS.M",
    "2010-01",
  );
  const series = extractSeries(response);
  const currentValue = Math.round(series.at(-1)!.value * 10) / 10;
  const previousValue = Math.round(series.at(-2)!.value * 10) / 10;
  return {
    id: "unemployment",
    name: "Unemployment",
    lastUpdated: series.at(-1)!.date,
    source: "ABS",
    unit: "%",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus("unemployment", currentValue),
    series,
  };
}

export async function fetchWages(): Promise<MetricData> {
  // WPI: Wage Price Index
  // Key: MEASURE.INDEX.SECTOR.INDUSTRY.TSEST.REGION.FREQ
  // Fetch index numbers (measure 1), then compute YoY ourselves
  // THRPEB=Total hourly rates excl. bonuses, sector 7=Private+Public, INDUSTRY=TOT=All industries, seasonally adj, Australia, Quarterly
  const response = await fetchAbs(
    "ABS,WPI,1.2.0",
    "1.THRPEB.7.TOT.20.AUS.Q",
    "2009-Q1",
  );
  const indexSeries = extractSeries(response);
  const series = toYoY(indexSeries, 4); // 4 quarters back = 1 year
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  return {
    id: "wages",
    name: "Wage Growth",
    lastUpdated: series.at(-1)!.date,
    source: "ABS",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus("wages", currentValue),
    series,
  };
}

export async function fetchCpi(): Promise<MetricData> {
  // CPI: Consumer Price Index
  // Key: MEASURE.REGION.TSEST.FREQ
  // Fetch index numbers, compute YoY
  // CPI v2.0.0: MEASURE=1 (index numbers), INDEX=10001 (All groups), TSEST=wildcard, REGION=50 (Australia), FREQ=Q
  // Compute YoY from index numbers (TSEST wildcard because Original is the only option for All groups)
  const response = await fetchAbs(
    "ABS,CPI,2.0.0",
    "1.10001..50.Q",
    "2009-Q1",
  );
  const indexSeries = extractSeries(response);
  const series = toYoY(indexSeries, 4);
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  return {
    id: "cpi",
    name: "Inflation (CPI)",
    lastUpdated: series.at(-1)!.date,
    source: "ABS",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus("cpi", currentValue),
    series,
  };
}
