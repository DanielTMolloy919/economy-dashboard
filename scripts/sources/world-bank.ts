import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";

const auThresholds = getHealthThresholds("au");

const WB_BASE = "https://api.worldbank.org/v2/country/AUS/indicator";

interface WbRecord {
  date: string;
  value: number | null;
}

async function fetchIndicator(
  indicator: string,
  years = 20,
): Promise<WbRecord[]> {
  const url = `${WB_BASE}/${indicator}?format=json&mrv=${years}&per_page=${years}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank fetch failed: ${res.status} ${url}`);
  const json = (await res.json()) as [unknown, WbRecord[]];
  return json[1].filter((r) => r.value !== null);
}

function toAnnualSeries(records: WbRecord[]): MetricSeries[] {
  return records
    .map((r) => ({ date: `${r.date}-01-01`, value: r.value! }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchGdp(): Promise<MetricData> {
  // NY.GDP.MKTP.KD.ZG = GDP growth (annual %)
  const records = await fetchIndicator("NY.GDP.MKTP.KD.ZG");
  const series = toAnnualSeries(records);
  const currentValue = Math.round(series.at(-1)!.value * 10) / 10;
  const previousValue = Math.round(series.at(-2)!.value * 10) / 10;
  return {
    id: "gdp",
    name: "GDP Growth",
    lastUpdated: series.at(-1)!.date,
    nextExpectedUpdate: null,
    source: "World Bank",
    unit: "% YoY",
    frequency: "Annual",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "gdp", currentValue),
    series,
  };
}

export async function fetchTrade(): Promise<MetricData> {
  // BN.GSR.MRCH.CD = Net trade in goods (BoP, current USD)
  // Convert to AUD billions using approximate factor (~1.55 USD/AUD)
  const records = await fetchIndicator("BN.GSR.MRCH.CD");
  const AUD_FACTOR = 1.55;
  const series = toAnnualSeries(records).map((p) => ({
    ...p,
    value: Math.round((p.value / 1e9 / AUD_FACTOR) * 10) / 10,
  }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  return {
    id: "trade",
    name: "Trade Balance",
    lastUpdated: series.at(-1)!.date,
    nextExpectedUpdate: null,
    source: "World Bank",
    unit: "A$B",
    frequency: "Annual",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "trade", currentValue),
    series,
  };
}
