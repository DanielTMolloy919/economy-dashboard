import "server-only";
import { readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";
import { metricDefinitions } from "~/config/metrics";

// Runtime transforms applied after loading raw data.
// Keys are metric IDs; each entry describes a linear scale factor and updated unit.
const runtimeTransforms: Record<string, { factor: number; unit: string }> = {
  // Quarterly ABS data — divide by 3 to express as monthly rate
  "dwelling-completions": { factor: 1 / 3, unit: "k dwellings/mo" },
  // Already monthly — just standardise the unit label
  "building-approvals": { factor: 1, unit: "k dwellings/mo" },
};

function applyTransform(data: MetricData): MetricData {
  const t = runtimeTransforms[data.id];
  if (!t) return data;
  const round1 = (v: number) => Math.round(v * t.factor * 10) / 10;
  return {
    ...data,
    unit: t.unit,
    currentValue: round1(data.currentValue),
    previousValue: data.previousValue !== undefined ? round1(data.previousValue) : data.previousValue,
    series: data.series.map((p) => ({ ...p, value: round1(p.value) })),
  };
}

function readMetricFile(id: string): MetricData {
  const filePath = join(process.cwd(), "data", `${id}.json`);
  const raw = readFileSync(filePath, "utf-8");
  return applyTransform(JSON.parse(raw) as MetricData);
}

export function getAllMetrics(): MetricData[] {
  return metricDefinitions.map((def) => readMetricFile(def.id));
}

export function getMetricById(id: string): MetricData | null {
  try {
    return readMetricFile(id);
  } catch {
    return null;
  }
}

export function filterSeriesByRange(
  series: MetricData["series"],
  range: "1Y" | "5Y" | "10Y" | "all",
): MetricData["series"] {
  if (range === "all") return series;

  const now = new Date();
  const yearsBack = range === "1Y" ? 1 : range === "5Y" ? 5 : 10;
  const cutoff = new Date(now.getFullYear() - yearsBack, now.getMonth(), now.getDate());

  return series.filter((point) => new Date(point.date) >= cutoff);
}
