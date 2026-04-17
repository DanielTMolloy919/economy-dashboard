import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";
import { nextFredUpdate } from "./next-update";

const usThresholds = getHealthThresholds("us");

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredObservation[];
}

function getApiKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY env var is required — get one free at https://fred.stlouisfed.org/docs/api/api_key.html");
  return key;
}

export async function fetchFredSeries(
  seriesId: string,
  startDate = "2005-01-01",
): Promise<MetricSeries[]> {
  const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${getApiKey()}&file_type=json&observation_start=${startDate}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED fetch failed: ${res.status} for ${seriesId}`);
  const data = (await res.json()) as FredResponse;
  return data.observations
    .filter((obs) => obs.value !== ".")
    .map((obs) => ({ date: obs.date, value: parseFloat(obs.value) }));
}

export function toYoY(series: MetricSeries[], periodsPerYear: number): MetricSeries[] {
  return series.slice(periodsPerYear).map((p, i) => {
    const prev = series[i]!;
    const change = ((p.value - prev.value) / prev.value) * 100;
    return { date: p.date, value: Math.round(change * 10) / 10 };
  });
}

function toTrailing12MonthSum(series: MetricSeries[]): MetricSeries[] {
  return series.slice(11).map((p, i) => {
    let sum = 0;
    for (let j = 0; j < 12; j++) {
      sum += series[i + j]!.value;
    }
    return { date: p.date, value: Math.round(sum * 10) / 10 };
  });
}

export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

// --- GDP Growth (quarterly, already a % change) ---
export async function fetchUsGdp(): Promise<MetricData> {
  // A191RL1Q225SBEA: Real GDP growth rate (percent change from preceding period, SAAR)
  const series = await fetchFredSeries("A191RL1Q225SBEA", "2005-01-01");
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
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
    health: getHealthStatus(usThresholds, "gdp", currentValue),
    series: series.map((p) => ({ ...p, value: round1(p.value) })),
  };
}

// --- GDP per Capita (quarterly index, YoY computed at runtime in data.ts) ---
export async function fetchUsGdpPerCapita(): Promise<MetricData> {
  // A939RX0Q048SBEA: Real GDP per capita (chained 2017 dollars)
  const series = await fetchFredSeries("A939RX0Q048SBEA", "2004-01-01");
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

// --- Labour Productivity (quarterly index, YoY computed at runtime in data.ts) ---
export async function fetchUsProductivity(): Promise<MetricData> {
  // OPHNFB: Nonfarm Business Sector — Labor Productivity (Output per Hour), index 2017=100
  const series = await fetchFredSeries("OPHNFB", "2004-01-01");
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "productivity",
    name: "Labour Productivity",
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

// --- CPI (monthly index → YoY %) ---
export async function fetchUsCpi(): Promise<MetricData> {
  // CPIAUCSL: Consumer Price Index for All Urban Consumers (SA)
  const raw = await fetchFredSeries("CPIAUCSL", "2004-01-01");
  const series = toYoY(raw, 12); // 12 months back
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
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
    health: getHealthStatus(usThresholds, "cpi", currentValue),
    series,
  };
}

// --- Wage Growth (monthly level → YoY %) ---
export async function fetchUsWages(): Promise<MetricData> {
  // CES0500000003: Average Hourly Earnings, Total Private (SA)
  const raw = await fetchFredSeries("CES0500000003", "2004-01-01");
  const series = toYoY(raw, 12);
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "wages",
    name: "Wage Growth",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "% YoY",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(usThresholds, "wages", currentValue),
    series,
  };
}

// --- Unemployment (monthly, already %) ---
export async function fetchUsUnemployment(): Promise<MetricData> {
  // UNRATE: Civilian Unemployment Rate (SA)
  const series = await fetchFredSeries("UNRATE", "2005-01-01");
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
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
    health: getHealthStatus(usThresholds, "unemployment", currentValue),
    series: series.map((p) => ({ ...p, value: round1(p.value) })),
  };
}

// --- Underemployment U-6 (monthly, already %) ---
export async function fetchUsUnderemployment(): Promise<MetricData> {
  // U6RATE: Total Unemployed + Marginally Attached + Part-Time for Economic Reasons (SA)
  const series = await fetchFredSeries("U6RATE", "2005-01-01");
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "underemployment",
    name: "Underemployment (U-6)",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "%",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(usThresholds, "underemployment", currentValue),
    series: series.map((p) => ({ ...p, value: round1(p.value) })),
  };
}

// --- Job Openings JOLTS (monthly, thousands) ---
export async function fetchUsJobOpenings(): Promise<MetricData> {
  // JTSJOL: Job Openings: Total Nonfarm (SA, thousands)
  const series = await fetchFredSeries("JTSJOL", "2005-01-01");
  const currentValue = Math.round(series.at(-1)!.value);
  const previousValue = Math.round(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "job-openings",
    name: "Job Openings",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "k",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(usThresholds, "job-openings", currentValue),
    series: series.map((p) => ({ ...p, value: Math.round(p.value) })),
  };
}

// --- Federal Funds Rate (monthly average, already %) ---
export async function fetchUsFedFundsRate(): Promise<MetricData> {
  // FEDFUNDS: Effective Federal Funds Rate (monthly average)
  const series = await fetchFredSeries("FEDFUNDS", "2005-01-01");
  const currentValue = Math.round(series.at(-1)!.value * 100) / 100;
  const previousValue = Math.round(series.at(-2)!.value * 100) / 100;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "fed-funds-rate",
    name: "Federal Funds Rate",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "%",
    frequency: "~8x/year",
    currentValue,
    previousValue,
    health: getHealthStatus(usThresholds, "fed-funds-rate", currentValue),
    series: series.map((p) => ({ ...p, value: Math.round(p.value * 100) / 100 })),
  };
}

// --- Trade Balance (monthly, millions → $B) ---
export async function fetchUsTrade(): Promise<MetricData> {
  // BOPGSTB: Trade Balance: Goods and Services, Balance of Payments Basis (SA, millions)
  const raw = await fetchFredSeries("BOPGSTB", "2005-01-01");
  const series = raw.map((p) => ({ ...p, value: round1(p.value / 1000) }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "trade",
    name: "Trade Balance",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "$B",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(usThresholds, "trade", currentValue),
    series,
  };
}

// --- USD Index (monthly) ---
export async function fetchUsUsdIndex(): Promise<MetricData> {
  // DTWEXBGS: Nominal Broad U.S. Dollar Index (daily → take last value per month)
  const raw = await fetchFredSeries("DTWEXBGS", "2005-01-01");
  // Deduplicate to monthly: take the last observation per YYYY-MM
  const monthly = new Map<string, MetricSeries>();
  for (const p of raw) {
    const ym = p.date.slice(0, 7);
    monthly.set(ym, { date: `${ym}-01`, value: round1(p.value) });
  }
  const series = Array.from(monthly.values()).sort((a, b) => a.date.localeCompare(b.date));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "usd-index",
    name: "USD Index",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "index",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(usThresholds, "usd-index", currentValue),
    series,
  };
}

// --- Building Permits (monthly, thousands SAAR) ---
export async function fetchUsBuildingPermits(): Promise<MetricData> {
  // PERMIT: New Privately-Owned Housing Units Authorized (SA, thousands, SAAR)
  const series = await fetchFredSeries("PERMIT", "2005-01-01");
  const rounded = series.map((p) => ({ ...p, value: Math.round(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "building-permits",
    name: "Building Permits",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "k",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(usThresholds, "building-permits", currentValue),
    series: rounded,
  };
}

// --- Housing Starts (monthly, thousands SAAR) ---
export async function fetchUsHousingStarts(): Promise<MetricData> {
  // HOUST: Housing Starts: Total (SA, thousands, SAAR)
  const series = await fetchFredSeries("HOUST", "2005-01-01");
  const rounded = series.map((p) => ({ ...p, value: Math.round(p.value) }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "housing-starts",
    name: "Housing Starts",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "k",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(usThresholds, "housing-starts", currentValue),
    series: rounded,
  };
}

// --- Federal Surplus/Deficit (monthly, millions → $B, trailing 12-month sum) ---
export async function fetchUsFiscalBalance(): Promise<MetricData> {
  // MTSDS133FMS: Federal Surplus or Deficit (millions)
  const raw = await fetchFredSeries("MTSDS133FMS", "2004-01-01");
  // Convert to $B
  const inBillions = raw.map((p) => ({ ...p, value: round1(p.value / 1000) }));
  // Pre-compute trailing 12-month sum
  const series = toTrailing12MonthSum(inBillions);
  const currentValue = Math.round(series.at(-1)!.value);
  const previousValue = Math.round(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "fiscal-balance",
    name: "Federal Surplus/Deficit",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "$B",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(usThresholds, "fiscal-balance", currentValue),
    series,
  };
}

// --- Personal Consumption Expenditures (monthly index → YoY %) ---
export async function fetchUsPersonalConsumption(): Promise<MetricData> {
  // PCEC96: Real Personal Consumption Expenditures (chained 2017 dollars, SA)
  const raw = await fetchFredSeries("PCEC96", "2004-01-01");
  const series = toYoY(raw, 12);
  const currentValue = round1(series.at(-1)!.value);
  const previousValue = round1(series.at(-2)!.value);
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "personal-consumption",
    name: "Personal Consumption",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "monthly"),
    source: "FRED",
    unit: "% YoY",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(usThresholds, "personal-consumption", currentValue),
    series,
  };
}
