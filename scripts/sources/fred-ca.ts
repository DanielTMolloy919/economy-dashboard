import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";
import { nextFredUpdate } from "./next-update";
import { fetchFredSeries, toYoY, round1 } from "./fred-api";

const caThresholds = getHealthThresholds("ca");

// --- GDP per Capita (quarterly index, YoY computed at runtime in data.ts) ---
export async function fetchCaGdpPerCapita(): Promise<MetricData> {
  // CANRGDPPCMEI: Real GDP per capita, chain volume index, quarterly SA (OECD MEI)
  const series = await fetchFredSeries("CANRGDPPCMEI", "2004-01-01");
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "gdp-per-capita",
    name: "GDP per Capita",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "quarterly"),
    source: "FRED",
    unit: "index",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: "yellow", // recomputed at runtime after YoY transform
    series,
  };
}

// --- GDP Growth (quarterly, already % YoY from FRED) ---
export async function fetchCaGdp(): Promise<MetricData> {
  // CANGDPRQPSMEI: GDP growth rate, same period previous year, quarterly
  const series = await fetchFredSeries("CANGDPRQPSMEI", "2005-01-01");
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
    health: getHealthStatus(caThresholds, "gdp", currentValue),
    series: rounded,
  };
}

// --- CPI (monthly, already % YoY from FRED) ---
export async function fetchCaCpi(): Promise<MetricData> {
  // CPALTT01CAM659N: CPI All Items, Total for Canada, growth rate same period previous year (YoY), monthly
  // Note: 657N is MoM % change; 659N is YoY % change
  const series = await fetchFredSeries("CPALTT01CAM659N", "2005-01-01");
  const rounded = series.map((p) => ({ ...p, value: round1(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "cpi",
    name: "Inflation (CPI)",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "% YoY",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(caThresholds, "cpi", currentValue),
    series: rounded,
  };
}

// --- Unemployment (monthly, already % rate) ---
export async function fetchCaUnemployment(): Promise<MetricData> {
  // LRUNTTTTCAM156S: Unemployment Rate, 15+ years, SA, monthly
  const series = await fetchFredSeries("LRUNTTTTCAM156S", "2005-01-01");
  const rounded = series.map((p) => ({ ...p, value: round1(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "unemployment",
    name: "Unemployment",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "%",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(caThresholds, "unemployment", currentValue),
    series: rounded,
  };
}

// --- Wages (quarterly, manufacturing hourly earnings YoY %) ---
export async function fetchCaWages(): Promise<MetricData> {
  // LCEAMN01CAQ659S: Manufacturing hourly earnings YoY % change, quarterly
  const series = await fetchFredSeries("LCEAMN01CAQ659S", "2009-01-01");
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
    health: getHealthStatus(caThresholds, "wages", currentValue),
    series: rounded,
  };
}

// --- Policy Rate proxy (monthly 3-month interbank rate, closest to BoC rate on FRED) ---
export async function fetchCaPolicyRate(): Promise<MetricData> {
  // IR3TIB01CAM156N: 3-Month Interbank Rate for Canada, monthly
  const series = await fetchFredSeries("IR3TIB01CAM156N", "2010-01-01");
  const rounded = series.map((p) => ({ ...p, value: Math.round(p.value * 100) / 100 }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "policy-rate",
    name: "Policy Rate",
    lastUpdated,
    nextExpectedUpdate: null,
    source: "FRED",
    unit: "%",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(caThresholds, "policy-rate", currentValue),
    series: rounded,
  };
}

// --- CAD/USD Exchange Rate (daily → monthly) ---
export async function fetchCaCadUsd(): Promise<MetricData> {
  // DEXCAUS: Canada / U.S. Foreign Exchange Rate (CAD per USD)
  // We invert to get USD per CAD (i.e. CAD/USD) for consistency with other country FX metrics
  const raw = await fetchFredSeries("DEXCAUS", "2010-01-01");
  // Deduplicate to monthly: keep last observation per YYYY-MM, invert
  const monthly = new Map<string, MetricSeries>();
  for (const p of raw) {
    const ym = p.date.slice(0, 7);
    monthly.set(ym, { date: `${ym}-01`, value: Math.round((1 / p.value) * 10000) / 10000 });
  }
  const series = Array.from(monthly.values()).sort((a, b) => a.date.localeCompare(b.date));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "cad-usd",
    name: "CAD/USD",
    lastUpdated,
    nextExpectedUpdate: null,
    source: "FRED",
    unit: "USD",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(caThresholds, "cad-usd", currentValue),
    series,
  };
}

// --- Trade Balance (monthly, CAD → C$B) ---
export async function fetchCaTrade(): Promise<MetricData> {
  // XTNTVA01CAM664S: Trade Balance: Goods, monthly, SA, CAD
  const raw = await fetchFredSeries("XTNTVA01CAM664S", "2005-01-01");
  // Values are in CAD (e.g. -1860000000) → convert to C$B
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
    unit: "C$B",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(caThresholds, "trade", currentValue),
    series,
  };
}

// --- Retail Sales (monthly, already % YoY from FRED) ---
export async function fetchCaRetailSales(): Promise<MetricData> {
  // CANSLRTTO01GYSAM: Retail Trade Volume, YoY % change, monthly, SA
  const series = await fetchFredSeries("CANSLRTTO01GYSAM", "2005-01-01");
  const rounded = series.map((p) => ({ ...p, value: round1(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "retail-sales",
    name: "Retail Sales",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "% YoY",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(caThresholds, "retail-sales", currentValue),
    series: rounded,
  };
}
