import type { HealthStatus } from "~/types/metrics";
import type { CountryCode } from "~/config/countries";

export interface ThresholdRange {
  min: number;
  max: number;
}

export interface MetricThreshold {
  green: ThresholdRange;
  yellow: ThresholdRange[];
  red: ThresholdRange[];
  weight: number; // weight in overall score (0-1, sum = 1)
}

const auHealthThresholds: Record<string, MetricThreshold> = {
  // GDP — lower bound: RBA potential output growth estimate ~2.25% (SMP Nov 2024)
  // https://www.rba.gov.au/publications/smp/2024/nov/outlook.html
  // Upper bound: sustained growth >5.5% signals overheating for a mature developed economy.
  gdp: {
    green: { min: 2.25, max: 5.5 },
    yellow: [{ min: 0, max: 2.25 }, { min: 5.5, max: 7.5 }],
    red: [{ min: -Infinity, max: 0 }, { min: 7.5, max: Infinity }],
    weight: 0.18,
  },
  "gdp-per-capita": {
    green: { min: 1.5, max: Infinity },
    yellow: [{ min: 0, max: 1.5 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0,
  },
  // Labour productivity — trend rate for developed economies is ~1%/yr
  productivity: {
    green: { min: 1.0, max: Infinity },
    yellow: [{ min: 0, max: 1.0 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0,
  },
  // CPI — RBA formal 2–3% target band
  // https://www.rba.gov.au/inflation/
  cpi: {
    green: { min: 2, max: 3 },
    yellow: [
      { min: 1, max: 2 },
      { min: 3, max: 4 },
    ],
    red: [
      { min: -Infinity, max: 1 },
      { min: 4, max: Infinity },
    ],
    weight: 0.18,
  },
  // Unemployment — NAIRU: RBA estimate ~4.25–4.5% (SMP Nov 2024)
  // https://www.rba.gov.au/publications/smp/2024/nov/outlook.html
  unemployment: {
    green: { min: -Infinity, max: 4.5 },
    yellow: [{ min: 4.5, max: 6 }],
    red: [{ min: 6, max: Infinity }],
    weight: 0.18,
  },
  // Cash rate — neutral range: RBA estimate ~2.5–3.5% nominal (Speech by Kent, Jun 2024)
  // https://www.rba.gov.au/speeches/2024/sp-ag-2024-06-26.html
  "cash-rate": {
    green: { min: 2.5, max: 3.5 },
    yellow: [
      { min: 1, max: 2.5 },
      { min: 3.5, max: 5 },
    ],
    red: [
      { min: -Infinity, max: 1 },
      { min: 5, max: Infinity },
    ],
    weight: 0.13,
  },
  wages: {
    green: { min: 3.5, max: Infinity },
    yellow: [{ min: 2, max: 3.5 }],
    red: [{ min: -Infinity, max: 2 }],
    weight: 0.13,
  },
  "real-wages": {
    green: { min: 0.5, max: Infinity },
    yellow: [{ min: -0.5, max: 0.5 }],
    red: [{ min: -Infinity, max: -0.5 }],
    weight: 0.08,
  },
  underemployment: {
    green: { min: -Infinity, max: 7 },
    yellow: [{ min: 7, max: 9 }],
    red: [{ min: 9, max: Infinity }],
    weight: 0.08,
  },
  "household-spending": {
    green: { min: 2, max: 7 },
    yellow: [
      { min: 0, max: 2 },
      { min: 7, max: 10 },
    ],
    red: [
      { min: -Infinity, max: 0 },
      { min: 10, max: Infinity },
    ],
    weight: 0.08,
  },
  "job-vacancies": {
    green: { min: 250, max: Infinity },
    yellow: [{ min: 150, max: 250 }],
    red: [{ min: -Infinity, max: 150 }],
    weight: 0.06,
  },
  "aud-usd": {
    green: { min: 0.65, max: 0.8 },
    yellow: [
      { min: 0.6, max: 0.65 },
      { min: 0.8, max: 0.85 },
    ],
    red: [
      { min: -Infinity, max: 0.6 },
      { min: 0.85, max: Infinity },
    ],
    weight: 0.05,
  },
  trade: {
    green: { min: 5, max: Infinity },
    yellow: [{ min: 0, max: 5 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0.05,
  },
  "building-approvals": {
    green: { min: 15, max: Infinity },
    yellow: [{ min: 10, max: 15 }],
    red: [{ min: -Infinity, max: 10 }],
    weight: 0,
  },
  // Thresholds in k dwellings/mo (post runtime ÷3 transform — raw data is quarterly)
  "dwelling-completions": {
    green: { min: 16.7, max: Infinity },
    yellow: [{ min: 13.3, max: 16.7 }],
    red: [{ min: -Infinity, max: 13.3 }],
    weight: 0,
  },
  "fiscal-balance": {
    green: { min: 0, max: Infinity },
    yellow: [{ min: -40, max: 0 }],
    red: [{ min: -Infinity, max: -40 }],
    weight: 0.06,
  },
};

const nzHealthThresholds: Record<string, MetricThreshold> = {
  // GDP — lower bound: RBNZ potential output growth estimate ~2.0% (Monetary Policy Statement)
  // https://www.rbnz.govt.nz/monetary-policy/monetary-policy-statement
  // Upper bound: sustained growth >5.5% signals overheating for a mature developed economy.
  gdp: {
    green: { min: 2.0, max: 5.5 },
    yellow: [{ min: 0, max: 2.0 }, { min: 5.5, max: 7.5 }],
    red: [{ min: -Infinity, max: 0 }, { min: 7.5, max: Infinity }],
    weight: 0.18,
  },
  "gdp-per-capita": {
    green: { min: 1.5, max: Infinity },
    yellow: [{ min: 0, max: 1.5 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0,
  },
  // CPI — RBNZ 1–3% target band with 2% midpoint (Policy Targets Agreement / Monetary Policy Remit)
  // https://www.rbnz.govt.nz/monetary-policy/about-monetary-policy/the-monetary-policy-remit
  cpi: {
    green: { min: 1, max: 3 },
    yellow: [
      { min: 0, max: 1 },
      { min: 3, max: 5 },
    ],
    red: [
      { min: -Infinity, max: 0 },
      { min: 5, max: Infinity },
    ],
    weight: 0.18,
  },
  // Unemployment — NAIRU: RBNZ estimate ~4–4.5% (Monetary Policy Statement)
  // https://www.rbnz.govt.nz/monetary-policy/monetary-policy-statement
  unemployment: {
    green: { min: -Infinity, max: 4.5 },
    yellow: [{ min: 4.5, max: 6 }],
    red: [{ min: 6, max: Infinity }],
    weight: 0.18,
  },
  // Cash rate — neutral OCR: RBNZ estimate ~2.5–2.75% nominal (Finding Neutral, Apr 2024)
  // https://www.rbnz.govt.nz/hub/news/2024/04/finding-neutral
  "cash-rate": {
    green: { min: 2.25, max: 3.0 },
    yellow: [
      { min: 0.75, max: 2.25 },
      { min: 3.0, max: 4.5 },
    ],
    red: [
      { min: -Infinity, max: 0.75 },
      { min: 4.5, max: Infinity },
    ],
    weight: 0.13,
  },
  wages: {
    green: { min: 3, max: Infinity },
    yellow: [{ min: 2, max: 3 }],
    red: [{ min: -Infinity, max: 2 }],
    weight: 0.13,
  },
  "real-wages": {
    green: { min: 0.5, max: Infinity },
    yellow: [{ min: -0.5, max: 0.5 }],
    red: [{ min: -Infinity, max: -0.5 }],
    weight: 0.08,
  },
  "retail-trade": {
    green: { min: 2, max: 6 },
    yellow: [
      { min: 0, max: 2 },
      { min: 6, max: 9 },
    ],
    red: [
      { min: -Infinity, max: 0 },
      { min: 9, max: Infinity },
    ],
    weight: 0.08,
  },
  "nzd-usd": {
    green: { min: 0.58, max: 0.72 },
    yellow: [
      { min: 0.52, max: 0.58 },
      { min: 0.72, max: 0.78 },
    ],
    red: [
      { min: -Infinity, max: 0.52 },
      { min: 0.78, max: Infinity },
    ],
    weight: 0.05,
  },
  trade: {
    green: { min: 0, max: Infinity },
    yellow: [{ min: -2, max: 0 }],
    red: [{ min: -Infinity, max: -2 }],
    weight: 0.05,
  },
  "fiscal-balance": {
    green: { min: 0, max: Infinity },
    yellow: [{ min: -10, max: 0 }],
    red: [{ min: -Infinity, max: -10 }],
    weight: 0.06,
  },
};

const usHealthThresholds: Record<string, MetricThreshold> = {
  // GDP — lower bound: Fed SEP longer-run real GDP growth ~1.8% (Dec 2024)
  // https://www.federalreserve.gov/monetarypolicy/fomcprojtabl20241218.htm
  // Upper bound: sustained growth >5.0% signals overheating for the US economy.
  gdp: {
    green: { min: 1.8, max: 5.0 },
    yellow: [{ min: 0, max: 1.8 }, { min: 5.0, max: 7.0 }],
    red: [{ min: -Infinity, max: 0 }, { min: 7.0, max: Infinity }],
    weight: 0.15,
  },
  "gdp-per-capita": {
    green: { min: 1.5, max: Infinity },
    yellow: [{ min: 0, max: 1.5 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0,
  },
  // Labour productivity — trend rate for developed economies is ~1%/yr
  productivity: {
    green: { min: 1.0, max: Infinity },
    yellow: [{ min: 0, max: 1.0 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0,
  },
  "personal-consumption": {
    green: { min: 2, max: 7 },
    yellow: [
      { min: 0, max: 2 },
      { min: 7, max: 10 },
    ],
    red: [
      { min: -Infinity, max: 0 },
      { min: 10, max: Infinity },
    ],
    weight: 0.06,
  },
  "fiscal-balance": {
    green: { min: -500, max: Infinity },
    yellow: [{ min: -1000, max: -500 }],
    red: [{ min: -Infinity, max: -1000 }],
    weight: 0.04,
  },
  // CPI — symmetric ±0.5pp around Fed's 2% PCE target (CPI runs ~0.3pp above PCE)
  // https://www.federalreserve.gov/monetarypolicy/files/FOMC_LongerRunGoals.pdf
  cpi: {
    green: { min: 1.5, max: 2.5 },
    yellow: [
      { min: 0.5, max: 1.5 },
      { min: 2.5, max: 4 },
    ],
    red: [
      { min: -Infinity, max: 0.5 },
      { min: 4, max: Infinity },
    ],
    weight: 0.15,
  },
  wages: {
    green: { min: 3.5, max: Infinity },
    yellow: [{ min: 2, max: 3.5 }],
    red: [{ min: -Infinity, max: 2 }],
    weight: 0.10,
  },
  "real-wages": {
    green: { min: 0.5, max: Infinity },
    yellow: [{ min: -0.5, max: 0.5 }],
    red: [{ min: -Infinity, max: -0.5 }],
    weight: 0.06,
  },
  // Unemployment — NAIRU: Fed SEP longer-run unemployment ~4.1% median (Dec 2024)
  // https://www.federalreserve.gov/monetarypolicy/fomcprojtabl20241218.htm
  unemployment: {
    green: { min: -Infinity, max: 4.0 },
    yellow: [{ min: 4.0, max: 5.5 }],
    red: [{ min: 5.5, max: Infinity }],
    weight: 0.15,
  },
  underemployment: {
    green: { min: -Infinity, max: 8 },
    yellow: [{ min: 8, max: 10 }],
    red: [{ min: 10, max: Infinity }],
    weight: 0.06,
  },
  "job-openings": {
    green: { min: 8000, max: Infinity },
    yellow: [{ min: 5000, max: 8000 }],
    red: [{ min: -Infinity, max: 5000 }],
    weight: 0.04,
  },
  // Fed funds rate — neutral rate: Fed SEP longer-run FFR median ~3.0% (Dec 2024)
  // https://www.federalreserve.gov/monetarypolicy/fomcprojtabl20241218.htm
  "fed-funds-rate": {
    green: { min: 2.5, max: 3.5 },
    yellow: [
      { min: 1, max: 2.5 },
      { min: 3.5, max: 5 },
    ],
    red: [
      { min: -Infinity, max: 1 },
      { min: 5, max: Infinity },
    ],
    weight: 0.10,
  },
  "usd-index": {
    green: { min: 95, max: 115 },
    yellow: [
      { min: 85, max: 95 },
      { min: 115, max: 125 },
    ],
    red: [
      { min: -Infinity, max: 85 },
      { min: 125, max: Infinity },
    ],
    weight: 0.04,
  },
  trade: {
    green: { min: -50, max: Infinity },
    yellow: [{ min: -80, max: -50 }],
    red: [{ min: -Infinity, max: -80 }],
    weight: 0.05,
  },
  "building-permits": {
    green: { min: 1400, max: Infinity },
    yellow: [{ min: 1000, max: 1400 }],
    red: [{ min: -Infinity, max: 1000 }],
    weight: 0,
  },
  "housing-starts": {
    green: { min: 1400, max: Infinity },
    yellow: [{ min: 1000, max: 1400 }],
    red: [{ min: -Infinity, max: 1000 }],
    weight: 0,
  },
};

const ukHealthThresholds: Record<string, MetricThreshold> = {
  // GDP — lower bound: OBR potential output growth avg ~1⅔% (EFO Oct 2024)
  // https://obr.uk/efo/economic-and-fiscal-outlook-october-2024/
  // Upper bound: sustained growth >4.5% signals overheating for the UK economy.
  gdp: {
    green: { min: 1.5, max: 4.5 },
    yellow: [{ min: 0, max: 1.5 }, { min: 4.5, max: 6.0 }],
    red: [{ min: -Infinity, max: 0 }, { min: 6.0, max: Infinity }],
    weight: 0.18,
  },
  "gdp-per-capita": {
    green: { min: 1.5, max: Infinity },
    yellow: [{ min: 0, max: 1.5 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0,
  },
  // Labour productivity — trend rate for developed economies is ~1%/yr
  productivity: {
    green: { min: 1.0, max: Infinity },
    yellow: [{ min: 0, max: 1.0 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0,
  },
  "retail-sales": {
    green: { min: 2, max: 6 },
    yellow: [
      { min: 0, max: 2 },
      { min: 6, max: 9 },
    ],
    red: [
      { min: -Infinity, max: 0 },
      { min: 9, max: Infinity },
    ],
    weight: 0.08,
  },
  // CPI — symmetric ±0.5pp around BoE's 2% CPI target (mandated by HM Treasury)
  // https://www.bankofengland.co.uk/monetary-policy/inflation
  cpi: {
    green: { min: 1.5, max: 2.5 },
    yellow: [
      { min: 0.5, max: 1.5 },
      { min: 2.5, max: 4 },
    ],
    red: [
      { min: -Infinity, max: 0.5 },
      { min: 4, max: Infinity },
    ],
    weight: 0.18,
  },
  wages: {
    green: { min: 3.5, max: Infinity },
    yellow: [{ min: 2, max: 3.5 }],
    red: [{ min: -Infinity, max: 2 }],
    weight: 0.13,
  },
  "real-wages": {
    green: { min: 0.5, max: Infinity },
    yellow: [{ min: -0.5, max: 0.5 }],
    red: [{ min: -Infinity, max: -0.5 }],
    weight: 0.08,
  },
  // Unemployment — NAIRU: OBR/BoE estimate ~4–4.5% (EFO Oct 2024, MPR Nov 2024)
  // https://obr.uk/efo/economic-and-fiscal-outlook-october-2024/
  unemployment: {
    green: { min: -Infinity, max: 4.5 },
    yellow: [{ min: 4.5, max: 6 }],
    red: [{ min: 6, max: Infinity }],
    weight: 0.18,
  },
  "economic-inactivity": {
    green: { min: -Infinity, max: 21 },
    yellow: [{ min: 21, max: 22.5 }],
    red: [{ min: 22.5, max: Infinity }],
    weight: 0.08,
  },
  "job-vacancies": {
    green: { min: 800, max: Infinity },
    yellow: [{ min: 600, max: 800 }],
    red: [{ min: -Infinity, max: 600 }],
    weight: 0.06,
  },
  // Bank rate — neutral rate: BoE r* estimate ~3–3.5% (MPR Nov 2024 + market participants survey)
  // https://www.bankofengland.co.uk/monetary-policy-report/2024/november-2024
  "bank-rate": {
    green: { min: 2.5, max: 3.5 },
    yellow: [
      { min: 1, max: 2.5 },
      { min: 3.5, max: 5 },
    ],
    red: [
      { min: -Infinity, max: 1 },
      { min: 5, max: Infinity },
    ],
    weight: 0.13,
  },
  "gbp-usd": {
    green: { min: 1.2, max: 1.4 },
    yellow: [
      { min: 1.1, max: 1.2 },
      { min: 1.4, max: 1.5 },
    ],
    red: [
      { min: -Infinity, max: 1.1 },
      { min: 1.5, max: Infinity },
    ],
    weight: 0.05,
  },
  trade: {
    green: { min: -5, max: Infinity },
    yellow: [{ min: -10, max: -5 }],
    red: [{ min: -Infinity, max: -10 }],
    weight: 0.05,
  },
};

const caHealthThresholds: Record<string, MetricThreshold> = {
  // GDP — lower bound: BoC potential output growth estimate ~2.0% (Monetary Policy Report)
  // https://www.bankofcanada.ca/publications/mpr/
  // Upper bound: sustained growth >5.5% signals overheating for the Canadian economy.
  gdp: {
    green: { min: 2.0, max: 5.5 },
    yellow: [{ min: 0, max: 2.0 }, { min: 5.5, max: 7.5 }],
    red: [{ min: -Infinity, max: 0 }, { min: 7.5, max: Infinity }],
    weight: 0.18,
  },
  "gdp-per-capita": {
    green: { min: 1.5, max: Infinity },
    yellow: [{ min: 0, max: 1.5 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0,
  },
  "retail-sales": {
    green: { min: 2, max: 6 },
    yellow: [
      { min: 0, max: 2 },
      { min: 6, max: 9 },
    ],
    red: [
      { min: -Infinity, max: 0 },
      { min: 9, max: Infinity },
    ],
    weight: 0.08,
  },
  // CPI — BoC 1–3% control range with 2% target midpoint
  // https://www.bankofcanada.ca/core-functions/monetary-policy/inflation/
  cpi: {
    green: { min: 1, max: 3 },
    yellow: [
      { min: 0, max: 1 },
      { min: 3, max: 4 },
    ],
    red: [
      { min: -Infinity, max: 0 },
      { min: 4, max: Infinity },
    ],
    weight: 0.18,
  },
  wages: {
    green: { min: 3, max: Infinity },
    yellow: [{ min: 2, max: 3 }],
    red: [{ min: -Infinity, max: 2 }],
    weight: 0.13,
  },
  "real-wages": {
    green: { min: 0.5, max: Infinity },
    yellow: [{ min: -0.5, max: 0.5 }],
    red: [{ min: -Infinity, max: -0.5 }],
    weight: 0.08,
  },
  // Unemployment — NAIRU: BoC estimate ~5.5–6% (structurally higher than peers)
  // https://www.bankofcanada.ca/publications/mpr/
  unemployment: {
    green: { min: -Infinity, max: 5.5 },
    yellow: [{ min: 5.5, max: 7 }],
    red: [{ min: 7, max: Infinity }],
    weight: 0.18,
  },
  // Policy rate — neutral rate: BoC estimate 2.25–3.25% nominal (Staff Analytical Note 2024-9)
  // https://www.bankofcanada.ca/2024/04/staff-analytical-note-2024-9/
  "policy-rate": {
    green: { min: 2.25, max: 3.25 },
    yellow: [
      { min: 1, max: 2.25 },
      { min: 3.25, max: 4.5 },
    ],
    red: [
      { min: -Infinity, max: 1 },
      { min: 4.5, max: Infinity },
    ],
    weight: 0.13,
  },
  "cad-usd": {
    green: { min: 0.72, max: 0.82 },
    yellow: [
      { min: 0.65, max: 0.72 },
      { min: 0.82, max: 0.88 },
    ],
    red: [
      { min: -Infinity, max: 0.65 },
      { min: 0.88, max: Infinity },
    ],
    weight: 0.05,
  },
  trade: {
    green: { min: 0, max: Infinity },
    yellow: [{ min: -5, max: 0 }],
    red: [{ min: -Infinity, max: -5 }],
    weight: 0.05,
  },
};

const allHealthThresholds: Record<CountryCode, Record<string, MetricThreshold>> = {
  au: auHealthThresholds,
  nz: nzHealthThresholds,
  us: usHealthThresholds,
  uk: ukHealthThresholds,
  ca: caHealthThresholds,
};

export function getHealthThresholds(country: CountryCode): Record<string, MetricThreshold> {
  return allHealthThresholds[country];
}

export function getHealthStatus(
  thresholds: Record<string, MetricThreshold>,
  metricId: string,
  value: number,
): HealthStatus {
  const threshold = thresholds[metricId];
  if (!threshold) return "yellow";

  if (value >= threshold.green.min && value <= threshold.green.max) {
    return "green";
  }

  for (const range of threshold.red) {
    if (value >= range.min && value <= range.max) {
      return "red";
    }
  }

  return "yellow";
}

export function getHealthScore(
  thresholds: Record<string, MetricThreshold>,
  metricId: string,
  value: number,
): number {
  const status = getHealthStatus(thresholds, metricId, value);
  switch (status) {
    case "green":
      return 100;
    case "yellow":
      return 50;
    case "red":
      return 0;
  }
}

// How far outside the green zone a value is (0 if inside).
function distanceFromGreen(threshold: MetricThreshold, value: number): number {
  const { min, max } = threshold.green;
  if (value >= min && value <= max) return 0;
  if (min !== -Infinity && value < min) return min - value;
  if (max !== Infinity && value > max) return value - max;
  return 0;
}

// Compare average distance-from-green over the last 6 periods vs the 6 before that.
// Returns +10 (improving), 0 (flat), or -10 (deteriorating).
export function getTrendModifier(
  threshold: MetricThreshold,
  series: { value: number }[],
): -10 | 0 | 10 {
  if (series.length < 4) return 0;
  const N = Math.min(6, Math.floor(series.length / 2));
  const recent = series.slice(-N);
  const older = series.slice(-2 * N, -N);
  if (older.length === 0) return 0;

  const avgDistRecent = recent.reduce((s, p) => s + distanceFromGreen(threshold, p.value), 0) / recent.length;
  const avgDistOlder = older.reduce((s, p) => s + distanceFromGreen(threshold, p.value), 0) / older.length;

  // Normalise by the green zone width so the threshold is scale-independent.
  const { min, max } = threshold.green;
  const greenWidth =
    min !== -Infinity && max !== Infinity
      ? max - min
      : Math.max(avgDistOlder, avgDistRecent, 0.5) * 2;

  const normalised = (avgDistOlder - avgDistRecent) / (greenWidth / 2);
  // positive = distance shrank (improving), negative = distance grew (deteriorating)
  if (normalised > 0.2) return 10;
  if (normalised < -0.2) return -10;
  return 0;
}

export function getOverallScore(
  thresholds: Record<string, MetricThreshold>,
  metrics: { id: string; currentValue: number; series?: { value: number }[] }[],
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const metric of metrics) {
    const threshold = thresholds[metric.id];
    if (!threshold) continue;
    const base = getHealthScore(thresholds, metric.id, metric.currentValue);
    const trend = metric.series ? getTrendModifier(threshold, metric.series) : 0;
    const score = Math.max(0, Math.min(100, base + trend));
    weightedScore += score * threshold.weight;
    totalWeight += threshold.weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedScore / totalWeight);
}
