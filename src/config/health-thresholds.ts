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
  gdp: {
    green: { min: 2.5, max: Infinity },
    yellow: [{ min: 0, max: 2.5 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0.18,
  },
  "gdp-per-capita": {
    green: { min: 1.5, max: Infinity },
    yellow: [{ min: 0, max: 1.5 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0,
  },
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
  unemployment: {
    green: { min: -Infinity, max: 4.5 },
    yellow: [{ min: 4.5, max: 6 }],
    red: [{ min: 6, max: Infinity }],
    weight: 0.18,
  },
  "cash-rate": {
    green: { min: 2, max: 3.5 },
    yellow: [
      { min: 1, max: 2 },
      { min: 3.5, max: 4.5 },
    ],
    red: [
      { min: -Infinity, max: 1 },
      { min: 4.5, max: Infinity },
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
  "dwelling-completions": {
    green: { min: 50, max: Infinity },
    yellow: [{ min: 40, max: 50 }],
    red: [{ min: -Infinity, max: 40 }],
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
  gdp: {
    green: { min: 2, max: Infinity },
    yellow: [{ min: 0, max: 2 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0.18,
  },
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
  unemployment: {
    green: { min: -Infinity, max: 4.5 },
    yellow: [{ min: 4.5, max: 6 }],
    red: [{ min: 6, max: Infinity }],
    weight: 0.18,
  },
  "cash-rate": {
    green: { min: 2, max: 3.5 },
    yellow: [
      { min: 1, max: 2 },
      { min: 3.5, max: 4.5 },
    ],
    red: [
      { min: -Infinity, max: 1 },
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
  underutilisation: {
    green: { min: -Infinity, max: 10 },
    yellow: [{ min: 10, max: 13 }],
    red: [{ min: 13, max: Infinity }],
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
  "job-vacancies": {
    green: { min: 50, max: Infinity },
    yellow: [{ min: 30, max: 50 }],
    red: [{ min: -Infinity, max: 30 }],
    weight: 0.06,
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
  "building-consents": {
    green: { min: 3, max: Infinity },
    yellow: [{ min: 2, max: 3 }],
    red: [{ min: -Infinity, max: 2 }],
    weight: 0,
  },
  "fiscal-balance": {
    green: { min: 0, max: Infinity },
    yellow: [{ min: -10, max: 0 }],
    red: [{ min: -Infinity, max: -10 }],
    weight: 0.06,
  },
};

const usHealthThresholds: Record<string, MetricThreshold> = {
  gdp: {
    green: { min: 2, max: Infinity },
    yellow: [{ min: 0, max: 2 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0.15,
  },
  "gdp-per-capita": {
    green: { min: 1.5, max: Infinity },
    yellow: [{ min: 0, max: 1.5 }],
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
  unemployment: {
    green: { min: -Infinity, max: 4.5 },
    yellow: [{ min: 4.5, max: 6 }],
    red: [{ min: 6, max: Infinity }],
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
  "fed-funds-rate": {
    green: { min: 2, max: 3.5 },
    yellow: [
      { min: 1, max: 2 },
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

const allHealthThresholds: Record<CountryCode, Record<string, MetricThreshold>> = {
  au: auHealthThresholds,
  nz: nzHealthThresholds,
  us: usHealthThresholds,
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

export function getOverallScore(
  thresholds: Record<string, MetricThreshold>,
  metrics: { id: string; currentValue: number }[],
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const metric of metrics) {
    const threshold = thresholds[metric.id];
    if (!threshold) continue;
    const score = getHealthScore(thresholds, metric.id, metric.currentValue);
    weightedScore += score * threshold.weight;
    totalWeight += threshold.weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedScore / totalWeight);
}
