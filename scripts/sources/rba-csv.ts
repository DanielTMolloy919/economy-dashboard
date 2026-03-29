import { getHealthStatus } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";

const RBA_BASE = "https://www.rba.gov.au/statistics/tables/csv";

async function fetchCsv(table: string): Promise<string[][]> {
  const res = await fetch(`${RBA_BASE}/${table}-data.csv`);
  if (!res.ok) throw new Error(`RBA ${table} fetch failed: ${res.status}`);
  const text = await res.text();
  return text
    .split("\n")
    .map((row) =>
      row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
    );
}

// RBA CSVs: row 0 = sheet title, row 1 = column names, rows 2-4 = metadata, data starts at row 5
function parseRbaDate(dateStr: string): string | null {
  const match = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/.exec(dateStr.trim());
  if (!match) return null;
  const months: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };
  const [, , mon, year] = match;
  const m = months[mon!];
  if (!m) return null;
  return `${year}-${m}-01`;
}

function extractColumn(
  rows: string[][],
  colName: string,
): { date: string; value: number }[] {
  const headers = rows[1] ?? []; // row 0 is sheet title, row 1 is column names
  const colIdx = headers.findIndex((h) =>
    h.toLowerCase().includes(colName.toLowerCase()),
  );
  if (colIdx === -1) throw new Error(`Column "${colName}" not found in CSV`);

  const points: { date: string; value: number }[] = [];
  for (let i = 5; i < rows.length; i++) { // data starts at row 5
    const row = rows[i] ?? [];
    if (!row[0]) continue;
    const date = parseRbaDate(row[0]);
    if (!date) continue;
    const raw = row[colIdx] ?? "";
    const value = parseFloat(raw);
    if (!isNaN(value)) points.push({ date, value });
  }
  return points;
}

// Deduplicate daily data to monthly — keep last value per month
function toMonthly(
  points: { date: string; value: number }[],
): MetricSeries[] {
  const map = new Map<string, number>();
  for (const { date, value } of points) {
    map.set(date.slice(0, 7), value);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ date: `${month}-01`, value }));
}

export async function fetchCashRate(): Promise<MetricData> {
  const rows = await fetchCsv("f1");
  const points = extractColumn(rows, "Cash Rate Target");
  const series = toMonthly(points).filter((p) => p.date >= "2010-01-01");
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  return {
    id: "cash-rate",
    name: "Cash Rate",
    lastUpdated: series.at(-1)!.date,
    source: "RBA",
    unit: "%",
    frequency: "~8x/year",
    currentValue,
    previousValue,
    health: getHealthStatus("cash-rate", currentValue),
    series,
  };
}

export async function fetchAudUsd(): Promise<MetricData> {
  const rows = await fetchCsv("f11");
  // Column header is "A$1=USD"
  const points = extractColumn(rows, "A$1=USD");
  const series = points.filter((p) => p.date >= "2010-01-01");
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  return {
    id: "aud-usd",
    name: "AUD/USD",
    lastUpdated: series.at(-1)!.date,
    source: "RBA",
    unit: "USD",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus("aud-usd", currentValue),
    series,
  };
}
