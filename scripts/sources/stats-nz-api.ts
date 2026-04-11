import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";

// Stats NZ Aotearoa Data Explorer (SDMX REST API)
// Base: https://api.data.stats.govt.nz/rest/data/{agencyId},{dataflowId},{version}/{key}
// Requires API key via Ocp-Apim-Subscription-Key header.
// Register at: https://portal.apis.stats.govt.nz/
const SNZ_BASE = "https://api.data.stats.govt.nz/rest/data";

const nzThresholds = getHealthThresholds("nz");

function getApiKey(): string {
  const key = process.env.STATS_NZ_API_KEY;
  if (!key) throw new Error("STATS_NZ_API_KEY environment variable is required. Register at https://portal.apis.stats.govt.nz/");
  return key;
}

// Stats NZ SDMX response follows the same general shape as ABS
interface SnzDimension {
  id: string;
  values: { id: string; name: string }[];
}

interface SnzResponse {
  data: {
    dataSets: Array<{
      series: Record<string, { observations: Record<string, [number | null]> }>;
    }>;
    structures: Array<{
      dimensions: {
        series: SnzDimension[];
        observation: SnzDimension[];
      };
    }>;
  };
}

function parseSnzDate(timeId: string): string {
  // Quarterly: "2024-Q3" → "2024-09-30"
  if (timeId.includes("-Q")) {
    const [year, q] = timeId.split("-Q") as [string, string];
    const quarterEnds: Record<string, string> = { "1": "03-31", "2": "06-30", "3": "09-30", "4": "12-31" };
    return `${year}-${quarterEnds[q] ?? "12-31"}`;
  }
  // Monthly: "2024-11" → "2024-11-01"
  if (/^\d{4}-\d{2}$/.test(timeId)) {
    return `${timeId}-01`;
  }
  return timeId;
}

async function fetchSnz(
  dataflow: string,
  key: string,
  startPeriod: string,
): Promise<SnzResponse> {
  const apiKey = getApiKey();
  const url = `${SNZ_BASE}/${dataflow}/${key}?startPeriod=${startPeriod}&detail=dataonly&format=jsondata`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.sdmx.data+json;version=2.0",
      "Ocp-Apim-Subscription-Key": apiKey,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Stats NZ fetch failed: ${res.status} for ${dataflow}/${key}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as SnzResponse;
}

function extractSeries(response: SnzResponse, seriesKey = "0"): MetricSeries[] {
  const structure = response.data.structures[0]!;
  const timeDim = structure.dimensions.observation[0]!;
  const dataset = response.data.dataSets[0]!;

  const matchedKey = Object.keys(dataset.series).find((k) =>
    seriesKey === "0" ? true : k.startsWith(seriesKey),
  );
  if (!matchedKey) throw new Error(`No series found matching "${seriesKey}"`);

  const obs = dataset.series[matchedKey]!.observations;
  return Object.entries(obs)
    .map(([idx, [value]]) => ({
      date: parseSnzDate(timeDim.values[Number(idx)]!.id),
      value: value ?? 0,
    }))
    .filter((p) => p.value !== 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function toYoY(series: MetricSeries[], periodsPerYear: number): MetricSeries[] {
  return series.slice(periodsPerYear).map((p, i) => {
    const prev = series[i]!;
    const change = ((p.value - prev.value) / prev.value) * 100;
    return { date: p.date, value: Math.round(change * 10) / 10 };
  });
}

function nextSnzUpdate(lastUpdated: string, frequency: "monthly" | "quarterly"): string {
  const last = new Date(lastUpdated);
  let nextPeriodEnd: Date;
  if (frequency === "quarterly") {
    nextPeriodEnd = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 3 + 1, 0));
  } else {
    nextPeriodEnd = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 2, 0));
  }
  // Stats NZ typically publishes ~6-8 weeks after period end
  const offsetDays = frequency === "monthly" ? 42 : 56;
  const releaseDate = new Date(nextPeriodEnd);
  releaseDate.setUTCDate(releaseDate.getUTCDate() + offsetDays);
  return releaseDate.toISOString().slice(0, 10);
}

// --- Individual metric fetchers ---

export async function fetchNzGdp(): Promise<MetricData> {
  // SNE: System of National Accounts — GDP production measure
  // Dataflow and key to be confirmed once API key is available.
  // SNZ dataflow ID for GDP: SNEC.S6A (or similar)
  const response = await fetchSnz(
    "SNZ,SNE,1.0",
    "CPQA.S6A..Q",
    "2004-Q1",
  );
  const indexSeries = extractSeries(response);
  const series = toYoY(indexSeries, 4);
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "gdp",
    name: "GDP Growth",
    lastUpdated,
    nextExpectedUpdate: nextSnzUpdate(lastUpdated, "quarterly"),
    source: "Stats NZ",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "gdp", currentValue),
    series,
  };
}

export async function fetchNzCpi(): Promise<MetricData> {
  // CPI: Consumer Price Index — quarterly only in NZ
  const response = await fetchSnz(
    "SNZ,CPI,1.0",
    "CPI.SE9A..Q",
    "2009-Q1",
  );
  const indexSeries = extractSeries(response);
  const series = toYoY(indexSeries, 4);
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "cpi",
    name: "Inflation (CPI)",
    lastUpdated,
    nextExpectedUpdate: nextSnzUpdate(lastUpdated, "quarterly"),
    source: "Stats NZ",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "cpi", currentValue),
    series,
  };
}

export async function fetchNzUnemployment(): Promise<MetricData> {
  // HLFS: Household Labour Force Survey — quarterly
  const response = await fetchSnz(
    "SNZ,HLFS,1.0",
    "HLFQ.S3AZ..Q",
    "2010-Q1",
  );
  const series = extractSeries(response).map((p) => ({
    ...p,
    value: Math.round(p.value * 10) / 10,
  }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "unemployment",
    name: "Unemployment",
    lastUpdated,
    nextExpectedUpdate: nextSnzUpdate(lastUpdated, "quarterly"),
    source: "Stats NZ",
    unit: "%",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "unemployment", currentValue),
    series,
  };
}

export async function fetchNzWages(): Promise<MetricData> {
  // LCI: Labour Cost Index — quarterly
  const response = await fetchSnz(
    "SNZ,LCI,1.0",
    "LCIQ.S4AA..Q",
    "2009-Q1",
  );
  const indexSeries = extractSeries(response);
  const series = toYoY(indexSeries, 4);
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "wages",
    name: "Labour Cost Index",
    lastUpdated,
    nextExpectedUpdate: nextSnzUpdate(lastUpdated, "quarterly"),
    source: "Stats NZ",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "wages", currentValue),
    series,
  };
}

export async function fetchNzTrade(): Promise<MetricData> {
  // Overseas Merchandise Trade — monthly, balance in NZ$M
  const response = await fetchSnz(
    "SNZ,OMT,1.0",
    "OMTQ.SBA..M",
    "2004-01",
  );
  const raw = extractSeries(response);
  const series = raw.map((p) => ({
    ...p,
    value: Math.round((p.value / 1000) * 10) / 10,
  }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "trade",
    name: "Trade Balance",
    lastUpdated,
    nextExpectedUpdate: nextSnzUpdate(lastUpdated, "monthly"),
    source: "Stats NZ",
    unit: "NZ$B",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "trade", currentValue),
    series,
  };
}

export async function fetchNzUnderutilisation(): Promise<MetricData> {
  // HLFS underutilisation rate — quarterly
  const response = await fetchSnz(
    "SNZ,HLFS,1.0",
    "HLFQ.S4CZ..Q",
    "2010-Q1",
  );
  const series = extractSeries(response).map((p) => ({
    ...p,
    value: Math.round(p.value * 10) / 10,
  }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "underutilisation",
    name: "Underutilisation",
    lastUpdated,
    nextExpectedUpdate: nextSnzUpdate(lastUpdated, "quarterly"),
    source: "Stats NZ",
    unit: "%",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "underutilisation", currentValue),
    series,
  };
}

export async function fetchNzRetailTrade(): Promise<MetricData> {
  // Retail Trade Survey — monthly, compute YoY
  const response = await fetchSnz(
    "SNZ,RTS,1.0",
    "RTSQ.S1A..M",
    "2014-01",
  );
  const indexSeries = extractSeries(response);
  const series = toYoY(indexSeries, 12);
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "retail-trade",
    name: "Retail Trade",
    lastUpdated,
    nextExpectedUpdate: nextSnzUpdate(lastUpdated, "monthly"),
    source: "Stats NZ",
    unit: "% YoY",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "retail-trade", currentValue),
    series,
  };
}

export async function fetchNzJobVacancies(): Promise<MetricData> {
  // Job Vacancy Monitor — quarterly, thousands
  const response = await fetchSnz(
    "SNZ,JVM,1.0",
    "JVMQ.S1A..Q",
    "2004-Q1",
  );
  const series = extractSeries(response).map((p) => ({
    ...p,
    value: Math.round(p.value * 10) / 10,
  }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "job-vacancies",
    name: "Job Vacancies",
    lastUpdated,
    nextExpectedUpdate: nextSnzUpdate(lastUpdated, "quarterly"),
    source: "Stats NZ",
    unit: "k",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "job-vacancies", currentValue),
    series,
  };
}

export async function fetchNzBuildingConsents(): Promise<MetricData> {
  // Building Consents — monthly, number of new dwellings
  const response = await fetchSnz(
    "SNZ,BCS,1.0",
    "BCSQ.S1D..M",
    "2004-01",
  );
  const raw = extractSeries(response);
  const series = raw.map((p) => ({
    ...p,
    value: Math.round((p.value / 1000) * 10) / 10,
  }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "building-consents",
    name: "Building Consents",
    lastUpdated,
    nextExpectedUpdate: nextSnzUpdate(lastUpdated, "monthly"),
    source: "Stats NZ",
    unit: "k dwellings",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "building-consents", currentValue),
    series,
  };
}
