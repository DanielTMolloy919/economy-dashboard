import { parse } from "node-html-parser";
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
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const [, , mon, year] = match;
  const m = months[mon!];
  if (!m) return null;
  return `${year}-${m}-01`;
}

// Parse "18 Mar 2026" → "2026-03-18"
function parseRbaDecisionDate(dateStr: string): string | null {
  const match = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(dateStr.trim());
  if (!match) return null;
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const [, day, mon, year] = match;
  const m = months[mon!];
  if (!m) return null;
  return `${year}-${m}-${day!.padStart(2, "0")}`;
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

// Scrape the cash rate decisions table from the RBA statistics page.
// Primary selector: table#datatable (stable id used by RBA for years).
// Fallback: any table whose header row contains "Effective Date" and "Cash rate".
// Each tbody row: th[scope=row]=date, td[0]=change, td[1]=rate.
async function scrapeDecisionsTable(): Promise<MetricSeries[]> {
  const res = await fetch("https://www.rba.gov.au/statistics/cash-rate/");
  if (!res.ok) throw new Error(`RBA cash rate page fetch failed: ${res.status}`);
  const html = await res.text();
  const root = parse(html);

  // Primary: find by id
  let table = root.querySelector("table#datatable");

  // Fallback: find by header content
  if (!table) {
    for (const t of root.querySelectorAll("table")) {
      const headerText = t.querySelector("thead")?.text ?? "";
      if (
        headerText.toLowerCase().includes("effective date") &&
        headerText.toLowerCase().includes("cash rate")
      ) {
        table = t;
        break;
      }
    }
  }

  if (!table) throw new Error("Could not find cash rate decisions table in RBA page");

  const points: MetricSeries[] = [];

  for (const row of table.querySelectorAll("tbody tr")) {
    // Date is in a th[scope=row], rate is in the 2nd td (index 1)
    const dateCell = row.querySelector("th[scope=row]") ?? row.querySelector("th");
    const tds = row.querySelectorAll("td");

    if (!dateCell || tds.length < 2) continue;

    const date = parseRbaDecisionDate(dateCell.text.trim());
    // td[0]=change, td[1]=rate — skip the links td (class="links")
    const rateTd = tds.find((td) => !td.classNames.includes("links") && tds.indexOf(td) === 1)
      ?? tds[1];
    if (!date || !rateTd) continue;

    const value = Math.round(parseFloat(rateTd.text.trim()) * 100) / 100;
    if (!isNaN(value)) points.push({ date, value });
  }

  if (points.length === 0) throw new Error("No data rows parsed from cash rate table");

  // Table is newest-first; reverse to chronological order
  points.reverse();
  return points;
}

export async function fetchCashRate(): Promise<MetricData> {
  // Primary: scrape the RBA decisions page — updates same day as each decision.
  // Fallback: F1 CSV (published with a ~2 week lag post-decision).
  let series: MetricSeries[];

  try {
    series = (await scrapeDecisionsTable()).filter((p) => p.date >= "2010-01-01");
    console.log(`    (cash rate: scraped ${series.length} decisions from RBA page)`);
  } catch (scrapeErr) {
    console.warn(`    (cash rate: page scrape failed — ${String(scrapeErr)}; falling back to F1 CSV)`);
    const rows = await fetchCsv("f1");
    const points = extractColumn(rows, "Cash Rate Target");
    series = toMonthly(points).filter((p) => p.date >= "2010-01-01");
  }

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
  const toMonthlyFiltered = toMonthly(
    series.map((p) => ({ date: p.date, value: p.value }))
  ).filter((p) => p.date >= "2010-01-01");
  const currentValue = toMonthlyFiltered.at(-1)!.value;
  const previousValue = toMonthlyFiltered.at(-2)!.value;
  return {
    id: "aud-usd",
    name: "AUD/USD",
    lastUpdated: toMonthlyFiltered.at(-1)!.date,
    source: "RBA",
    unit: "USD",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus("aud-usd", currentValue),
    series: toMonthlyFiltered,
  };
}
