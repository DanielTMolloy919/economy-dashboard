import type { HealthStatus } from "~/types/metrics";

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

export const healthThresholds: Record<string, MetricThreshold> = {
  gdp: {
    green: { min: 2.5, max: Infinity },
    yellow: [{ min: 0, max: 2.5 }],
    red: [{ min: -Infinity, max: 0 }],
    weight: 0.18,
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
  housing: {
    green: { min: 0, max: 5 },
    yellow: [
      { min: 5, max: 10 },
      { min: -5, max: 0 },
    ],
    red: [
      { min: 10, max: Infinity },
      { min: -Infinity, max: -5 },
    ],
    weight: 0.1,
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
};

export function getHealthStatus(
  metricId: string,
  value: number,
): HealthStatus {
  const threshold = healthThresholds[metricId];
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

export function getHealthScore(metricId: string, value: number): number {
  const status = getHealthStatus(metricId, value);
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
  metrics: { id: string; currentValue: number }[],
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const metric of metrics) {
    const threshold = healthThresholds[metric.id];
    if (!threshold) continue;
    const score = getHealthScore(metric.id, metric.currentValue);
    weightedScore += score * threshold.weight;
    totalWeight += threshold.weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedScore / totalWeight);
}
