import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";
import { nextFredUpdate } from "./next-update";
import { fetchFredSeries, round1 } from "./fred-api";

const nzThresholds = getHealthThresholds("nz");

// --- GDP Growth (quarterly, already % YoY from FRED) ---
export async function fetchNzGdp(): Promise<MetricData> {
  // NZLGDPRQPSMEI: GDP growth rate, same period previous year, quarterly
  const series = await fetchFredSeries("NZLGDPRQPSMEI", "2005-01-01");
  const rounded = series.map((p) => ({ ...p, value: round1(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "gdp",
    name: "GDP Growth",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "quarterly"),
    source: "FRED",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "gdp", currentValue),
    series: rounded,
  };
}

// --- CPI (quarterly, already % YoY from FRED) ---
export async function fetchNzCpi(): Promise<MetricData> {
  // NZLCPALTT01CTGYQ: CPI All Items YoY % change, quarterly
  const series = await fetchFredSeries("NZLCPALTT01CTGYQ", "2009-01-01");
  const rounded = series.map((p) => ({ ...p, value: round1(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "cpi",
    name: "Inflation (CPI)",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "quarterly"),
    source: "FRED",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "cpi", currentValue),
    series: rounded,
  };
}

// --- Unemployment (quarterly, already % rate) ---
export async function fetchNzUnemployment(): Promise<MetricData> {
  // LRUNTTTTNZQ156S: Unemployment Rate, 15+ years, SA, quarterly
  const series = await fetchFredSeries("LRUNTTTTNZQ156S", "2005-01-01");
  const rounded = series.map((p) => ({ ...p, value: round1(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "unemployment",
    name: "Unemployment",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "quarterly"),
    source: "FRED",
    unit: "%",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "unemployment", currentValue),
    series: rounded,
  };
}

// --- Wages (quarterly, manufacturing hourly earnings YoY %) ---
export async function fetchNzWages(): Promise<MetricData> {
  // LCEAMN01NZQ659S: Manufacturing hourly earnings YoY % change, quarterly
  // Best available proxy for NZ wage growth — the Labour Cost Index is not on FRED.
  const series = await fetchFredSeries("LCEAMN01NZQ659S", "2009-01-01");
  const rounded = series.map((p) => ({ ...p, value: round1(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "wages",
    name: "Wage Growth",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "quarterly"),
    source: "FRED",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "wages", currentValue),
    series: rounded,
  };
}

// --- Trade Balance (monthly, NZD millions → NZ$B) ---
export async function fetchNzTrade(): Promise<MetricData> {
  // XTNTVA01NZM664S: Trade Balance: Commodities, monthly, SA, NZD
  const raw = await fetchFredSeries("XTNTVA01NZM664S", "2005-01-01");
  // Values are in NZD (e.g. -186000000) → convert to NZ$B
  const series = raw.map((p) => ({
    ...p,
    value: round1(p.value / 1e9),
  }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "trade",
    name: "Trade Balance",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "NZ$B",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "trade", currentValue),
    series,
  };
}

// --- Retail Trade (quarterly, already % YoY) ---
export async function fetchNzRetailTrade(): Promise<MetricData> {
  // SLRTTO01NZQ659S: Retail Trade Volume, YoY % change, quarterly
  const series = await fetchFredSeries("SLRTTO01NZQ659S", "2005-01-01");
  const rounded = series.map((p) => ({ ...p, value: round1(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "retail-trade",
    name: "Retail Trade",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "quarterly"),
    source: "FRED",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "retail-trade", currentValue),
    series: rounded,
  };
}

// --- NZD/USD Exchange Rate (daily → monthly, already a rate) ---
export async function fetchNzNzdUsd(): Promise<MetricData> {
  // DEXUSNZ: NZ Dollar to 1 USD (this IS NZD per USD — but actually it's USD per NZD)
  // FRED description: "New Zealand Dollars to One U.S. Dollar" but the values are < 1,
  // meaning it's actually "U.S. Dollars to One New Zealand Dollar" (i.e. NZD/USD)
  const raw = await fetchFredSeries("DEXUSNZ", "2010-01-01");
  // Deduplicate to monthly: keep last observation per YYYY-MM
  const monthly = new Map<string, MetricSeries>();
  for (const p of raw) {
    const ym = p.date.slice(0, 7);
    monthly.set(ym, { date: `${ym}-01`, value: Math.round(p.value * 10000) / 10000 });
  }
  const series = Array.from(monthly.values()).sort((a, b) => a.date.localeCompare(b.date));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "nzd-usd",
    name: "NZD/USD",
    lastUpdated,
    nextExpectedUpdate: null,
    source: "FRED",
    unit: "USD",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "nzd-usd", currentValue),
    series,
  };
}

// --- Cash Rate proxy (monthly 3-month interbank rate, closest to OCR on FRED) ---
export async function fetchNzCashRate(): Promise<MetricData> {
  // IR3TIB01NZM156N: 3-Month Interbank Rate for NZ, monthly
  // This tracks close to the OCR but is a market rate, not the policy rate itself.
  const series = await fetchFredSeries("IR3TIB01NZM156N", "2010-01-01");
  const rounded = series.map((p) => ({ ...p, value: Math.round(p.value * 100) / 100 }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "cash-rate",
    name: "Official Cash Rate",
    lastUpdated,
    nextExpectedUpdate: null,
    source: "FRED",
    unit: "%",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "cash-rate", currentValue),
    series: rounded,
  };
}
