import "server-only";
import { readFileSync } from "fs";
import { join } from "path";
import type { MetricData } from "~/types/metrics";
import { metricDefinitions } from "~/config/metrics";

function readMetricFile(id: string): MetricData {
  const filePath = join(process.cwd(), "data", `${id}.json`);
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as MetricData;
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
