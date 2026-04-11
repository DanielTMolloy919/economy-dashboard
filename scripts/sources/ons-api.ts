import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";
import { nextOnsUpdate } from "./next-update";

const ukThresholds = getHealthThresholds("uk");

// ONS time series endpoint — public, no API key required.
// Returns JSON with years/quarters/months arrays depending on the series frequency.
// Date formats: "2025 Q4" for quarterly, "2025 JAN" for monthly.
// Values are strings.
const ONS_BASE = "https://www.ons.gov.uk";

interface OnsDataPoint {
  date: string;
  value: string;
  year: string;
  quarter: string;
  month: string;
}

interface OnsResponse {
  years: OnsDataPoint[];
  quarters: OnsDataPoint[];
  months: OnsDataPoint[];
}

const ONS_MONTHS: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04",
  MAY: "05", JUN: "06", JUL: "07", AUG: "08",
  SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};

const ONS_QUARTERS: Record<string, string> = {
  Q1: "01", Q2: "04", Q3: "07", Q4: "10",
};

function parseOnsDate(raw: string): string | null {
  // Quarterly: "2025 Q4"
  const qMatch = /^(\d{4})\s+(Q[1-4])$/.exec(raw.trim());
  if (qMatch) {
    const m = ONS_QUARTERS[qMatch[2]!];
    return m ? `${qMatch[1]}-${m}-01` : null;
  }
  // Monthly: "2025 JAN"
  const mMatch = /^(\d{4})\s+([A-Z]{3})$/.exec(raw.trim());
  if (mMatch) {
    const m = ONS_MONTHS[mMatch[2]!];
    return m ? `${mMatch[1]}-${m}-01` : null;
  }
  return null;
}

async function fetchOnsSeries(
  path: string,
  frequency: "quarters" | "months",
  startDate = "2005-01-01",
): Promise<MetricSeries[]> {
  const url = `${ONS_BASE}${path}/data`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ONS fetch failed: ${res.status} for ${path}`);
  const data = (await res.json()) as OnsResponse;
  const points = data[frequency];

  return points
    .map((p) => {
      const date = parseOnsDate(p.date);
      const value = parseFloat(p.value);
      if (!date || isNaN(value)) return null;
      return { date, value };
    })
    .filter((p): p is MetricSeries => p !== null && p.date >= startDate);
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function toYoY(series: MetricSeries[], periodsPerYear: number): MetricSeries[] {
  return series.slice(periodsPerYear).map((p, i) => {
    const prev = series[i]!;
    const change = ((p.value - prev.value) / prev.value) * 100;
    return { date: p.date, value: round1(change) };
  });
}

// --- GDP Growth (quarterly index → YoY %) ---
export async function fetchUkGdp(): Promise<MetricData> {
  // ABMI: GDP at market prices, chained volume measure, SA (index)
  const raw = await fetchOnsSeries(
    "/economy/grossdomesticproductgdp/timeseries/abmi/pn2",
    "quarters",
    "2004-01-01",
  );
  const series = toYoY(raw, 4);
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "gdp",
    name: "GDP Growth",
    lastUpdated,
    nextExpectedUpdate: nextOnsUpdate(lastUpdated, "quarterly"),
    source: "ONS",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(ukThresholds, "gdp", currentValue),
    series,
  };
}

// --- GDP per Capita (quarterly index, YoY computed at runtime in data.ts) ---
export async function fetchUkGdpPerCapita(): Promise<MetricData> {
  // IHXW: GDP per head, CVM market prices, SA (index)
  const series = await fetchOnsSeries(
    "/economy/grossdomesticproductgdp/timeseries/ihxw/pn2",
    "quarters",
    "2004-01-01",
  );
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "gdp-per-capita",
    name: "GDP per Capita",
    lastUpdated,
    nextExpectedUpdate: nextOnsUpdate(lastUpdated, "quarterly"),
    source: "ONS",
    unit: "index",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: "yellow", // recomputed at runtime after YoY transform
    series,
  };
}

// --- Retail Sales (monthly index → YoY %) ---
export async function fetchUkRetailSales(): Promise<MetricData> {
  // J5EK: All retailing including automotive fuel, volume SA (index, 2019=100)
  const raw = await fetchOnsSeries(
    "/businessindustryandtrade/retailindustry/timeseries/j5ek/drsi",
    "months",
    "2004-01-01",
  );
  const series = toYoY(raw, 12);
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "retail-sales",
    name: "Retail Sales",
    lastUpdated,
    nextExpectedUpdate: nextOnsUpdate(lastUpdated, "monthly"),
    source: "ONS",
    unit: "% YoY",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(ukThresholds, "retail-sales", currentValue),
    series,
  };
}

// --- CPI (monthly, already % YoY) ---
export async function fetchUkCpi(): Promise<MetricData> {
  // D7G7: CPI annual rate (%)
  const series = await fetchOnsSeries(
    "/economy/inflationandpriceindices/timeseries/d7g7/mm23",
    "months",
  );
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "cpi",
    name: "Inflation (CPI)",
    lastUpdated,
    nextExpectedUpdate: nextOnsUpdate(lastUpdated, "monthly"),
    source: "ONS",
    unit: "% YoY",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(ukThresholds, "cpi", currentValue),
    series: series.map((p) => ({ ...p, value: round1(p.value) })),
  };
}

// --- Wage Growth AWE (monthly, already % YoY 3-month average) ---
export async function fetchUkWages(): Promise<MetricData> {
  // KAC3: AWE whole economy YoY 3-month average growth (%), total pay excl arrears, SA
  const series = await fetchOnsSeries(
    "/employmentandlabourmarket/peopleinwork/earningsandworkinghours/timeseries/kac3/lms",
    "months",
  );
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "wages",
    name: "Wage Growth (AWE)",
    lastUpdated,
    nextExpectedUpdate: nextOnsUpdate(lastUpdated, "monthly"),
    source: "ONS",
    unit: "% YoY",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(ukThresholds, "wages", currentValue),
    series: series.map((p) => ({ ...p, value: round1(p.value) })),
  };
}

// --- Unemployment (monthly, already %, 3-month average) ---
export async function fetchUkUnemployment(): Promise<MetricData> {
  // MGSX: Unemployment rate (%), 3-month rolling average, SA
  const series = await fetchOnsSeries(
    "/employmentandlabourmarket/peoplenotinwork/unemployment/timeseries/mgsx/lms",
    "months",
  );
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "unemployment",
    name: "Unemployment",
    lastUpdated,
    nextExpectedUpdate: nextOnsUpdate(lastUpdated, "monthly"),
    source: "ONS",
    unit: "%",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(ukThresholds, "unemployment", currentValue),
    series: series.map((p) => ({ ...p, value: round1(p.value) })),
  };
}

// --- Economic Inactivity (monthly, already %, 3-month average) ---
export async function fetchUkEconomicInactivity(): Promise<MetricData> {
  // LF2S: Economic inactivity rate (%), 16-64, SA
  const series = await fetchOnsSeries(
    "/employmentandlabourmarket/peoplenotinwork/economicinactivity/timeseries/lf2s/lms",
    "months",
  );
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "economic-inactivity",
    name: "Economic Inactivity",
    lastUpdated,
    nextExpectedUpdate: nextOnsUpdate(lastUpdated, "monthly"),
    source: "ONS",
    unit: "%",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(ukThresholds, "economic-inactivity", currentValue),
    series: series.map((p) => ({ ...p, value: round1(p.value) })),
  };
}

// --- Job Vacancies (monthly, thousands, 3-month average) ---
export async function fetchUkJobVacancies(): Promise<MetricData> {
  // AP2Y: UK vacancies total (thousands), 3-month average
  const series = await fetchOnsSeries(
    "/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/timeseries/ap2y/unem",
    "months",
  );
  const rounded = series.map((p) => ({ ...p, value: Math.round(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "job-vacancies",
    name: "Job Vacancies",
    lastUpdated,
    nextExpectedUpdate: nextOnsUpdate(lastUpdated, "monthly"),
    source: "ONS",
    unit: "k",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(ukThresholds, "job-vacancies", currentValue),
    series: rounded,
  };
}

// --- Trade Balance (monthly, £M → £B) ---
export async function fetchUkTrade(): Promise<MetricData> {
  // BOKI: Trade in goods balance (£ millions), SA
  const raw = await fetchOnsSeries(
    "/economy/nationalaccounts/balanceofpayments/timeseries/boki/mret",
    "months",
  );
  const series = raw.map((p) => ({ ...p, value: round1(p.value / 1000) }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "trade",
    name: "Trade Balance",
    lastUpdated,
    nextExpectedUpdate: nextOnsUpdate(lastUpdated, "monthly"),
    source: "ONS",
    unit: "£B",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(ukThresholds, "trade", currentValue),
    series,
  };
}
