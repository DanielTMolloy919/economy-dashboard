export type HealthStatus = "green" | "yellow" | "red";
export type ChartType = "line" | "bar" | "step" | "area";
export type TrendDirection = "up" | "down" | "neutral";
export type TrendPolarity = "positive" | "negative" | "neutral";
export type TrendSentiment = "good" | "bad" | "neutral";

export interface MetricSeries {
  date: string;
  value: number;
}

export interface MetricData {
  id: string;
  name: string;
  lastUpdated: string;
  nextExpectedUpdate: string | null;
  source: string;
  unit: string;
  frequency: string;
  currentValue: number;
  previousValue: number;
  health: HealthStatus;
  series: MetricSeries[];
}
