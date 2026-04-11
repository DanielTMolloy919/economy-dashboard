import { parse } from "node-html-parser";
import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";
import { nextBoeUpdate, nextOnsUpdate } from "./next-update";

const ukThresholds = getHealthThresholds("uk");

const BOE_BASE = "https://www.bankofengland.co.uk/boeapps/database";

const BOE_MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04",
  May: "05", Jun: "06", Jul: "07", Aug: "08",
  Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

// Parse "DD Mon YY" → "20YY-MM-DD" (BoE uses 2-digit years)
function parseBoeDate(dateStr: string): string | null {
  const match = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})$/.exec(dateStr.trim());
  if (!match) return null;
  const [, day, mon, shortYear] = match;
  const m = BOE_MONTHS[mon!];
  if (!m) return null;
  const year = parseInt(shortYear!, 10) >= 50 ? `19${shortYear}` : `20${shortYear}`;
  return `${year}-${m}-${day!.padStart(2, "0")}`;
}

// Scrape the Bank Rate decisions table from the BoE Bank-Rate page.
// Table structure: <tr><td>date</td><td>rate</td></tr> (newest first)
async function scrapeBankRateTable(): Promise<MetricSeries[]> {
  const res = await fetch(`${BOE_BASE}/Bank-Rate.asp`);
  if (!res.ok) throw new Error(`BoE Bank Rate page fetch failed: ${res.status}`);
  const html = await res.text();
  const root = parse(html);

  const table = root.querySelector("table#stats-table");
  if (!table) throw new Error("Could not find Bank Rate table in BoE page");

  const points: MetricSeries[] = [];

  for (const row of table.querySelectorAll("tbody tr")) {
    const tds = row.querySelectorAll("td");
    if (tds.length < 2) continue;

    const date = parseBoeDate(tds[0]!.text.trim());
    const value = parseFloat(tds[1]!.text.trim());
    if (!date || isNaN(value)) continue;

    points.push({ date, value: Math.round(value * 100) / 100 });
  }

  if (points.length === 0) throw new Error("No data rows parsed from Bank Rate table");

  // Table is newest-first; reverse to chronological order
  points.reverse();
  return points;
}

export async function fetchUkBankRate(): Promise<MetricData> {
  const allPoints = await scrapeBankRateTable();
  const series = allPoints.filter((p) => p.date >= "2010-01-01");

  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  const nextExpectedUpdate = nextBoeUpdate(lastUpdated);
  return {
    id: "bank-rate",
    name: "Bank Rate",
    lastUpdated,
    nextExpectedUpdate,
    source: "BoE",
    unit: "%",
    frequency: "~8x/year",
    currentValue,
    previousValue,
    health: getHealthStatus(ukThresholds, "bank-rate", currentValue),
    series,
  };
}

// Fetch GBP/USD exchange rate from BoE Statistical Interactive Database.
// The endpoint returns HTML with a data table (not CSV despite the csv.x param).
// XUDLUSS: Spot exchange rate, US$ into Sterling (= GBP/USD)
async function scrapeBoeSeries(
  seriesCode: string,
  startDate: string,
): Promise<MetricSeries[]> {
  const fromDate = new Date(startDate);
  const fromStr = `01/${BOE_MONTHS[fromDate.toLocaleString("en-US", { month: "short" })] ? fromDate.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "/") : "Jan"}/${fromDate.getFullYear()}`;
  const url = `${BOE_BASE}/fromshowcolumns.asp?SeriesCodes=${seriesCode}&CSVF=TN&UsingCodes=Y&Datefrom=01/Jan/${fromDate.getFullYear()}&Dateto=01/Jan/2030&csv.x=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`BoE ${seriesCode} fetch failed: ${res.status}`);
  const html = await res.text();
  const root = parse(html);

  const table = root.querySelector("table#stats-table");
  if (!table) throw new Error(`Could not find data table for ${seriesCode}`);

  const points: MetricSeries[] = [];
  for (const row of table.querySelectorAll("tbody tr")) {
    const tds = row.querySelectorAll("td");
    if (tds.length < 2) continue;

    const date = parseBoeDate(tds[0]!.text.trim());
    const value = parseFloat(tds[1]!.text.trim());
    if (!date || isNaN(value)) continue;

    points.push({ date, value });
  }

  return points;
}

// Deduplicate daily data to monthly — keep last value per month
function toMonthly(points: MetricSeries[]): MetricSeries[] {
  const map = new Map<string, number>();
  for (const { date, value } of points) {
    map.set(date.slice(0, 7), value);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      date: `${month}-01`,
      value: Math.round(value * 10000) / 10000,
    }));
}

export async function fetchUkGbpUsd(): Promise<MetricData> {
  // XUDLUSS: Spot exchange rate, US$ into Sterling (daily)
  const raw = await scrapeBoeSeries("XUDLUSS", "2005-01-01");
  const series = toMonthly(raw).filter((p) => p.date >= "2005-01-01");

  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "gbp-usd",
    name: "GBP/USD",
    lastUpdated,
    nextExpectedUpdate: nextOnsUpdate(lastUpdated, "monthly"),
    source: "BoE",
    unit: "USD",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(ukThresholds, "gbp-usd", currentValue),
    series,
  };
}
