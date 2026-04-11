import * as XLSX from "xlsx";
import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";

// RBNZ publishes Excel files for exchange rates (B1) and interest rates (B2).
// The site is behind Cloudflare, so direct fetches may be blocked.
// If blocked, manually download the files and place them in data/nz/rbnz-cache/.
//
// B1 Monthly: https://www.rbnz.govt.nz/-/media/project/sites/rbnz/files/statistics/series/b/b1/hb1-monthly.xlsx
// B2 Daily:   https://www.rbnz.govt.nz/-/media/project/sites/rbnz/files/statistics/series/b2/hb2-daily.xlsx

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const nzThresholds = getHealthThresholds("nz");

const RBNZ_URLS = {
  b1Monthly: "https://www.rbnz.govt.nz/-/media/project/sites/rbnz/files/statistics/series/b/b1/hb1-monthly.xlsx",
  b2Daily: "https://www.rbnz.govt.nz/-/media/project/sites/rbnz/files/statistics/series/b2/hb2-daily.xlsx",
};

const CACHE_DIR = join(process.cwd(), "data", "nz", "rbnz-cache");

async function fetchRbnzXlsx(url: string, cacheFile: string): Promise<ArrayBuffer> {
  // Try live download first
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*",
      },
    });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      // Verify it's actually an XLSX (not an HTML challenge page)
      const header = new Uint8Array(buf.slice(0, 4));
      if (header[0] === 0x50 && header[1] === 0x4b) {
        // PK header = valid ZIP/XLSX
        return buf;
      }
    }
  } catch {
    // Fetch failed, try cache
  }

  // Fallback: read from local cache
  const cachePath = join(CACHE_DIR, cacheFile);
  if (existsSync(cachePath)) {
    console.log(`    (using cached ${cacheFile})`);
    const buf = readFileSync(cachePath);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }

  throw new Error(
    `RBNZ download blocked by Cloudflare and no cache found.\n` +
    `    Download manually from ${url}\n` +
    `    and save to ${cachePath}`,
  );
}

// Parse Excel serial date number to ISO date string
function excelDateToIso(serial: number): string {
  // Excel epoch: 1900-01-01 (with the Lotus 1-2-3 bug where 1900 is treated as leap year)
  const utcDays = serial - 25569; // 25569 = days from 1900-01-01 to 1970-01-01
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().slice(0, 10);
}

function parseB2ForOcr(buf: ArrayBuffer): MetricSeries[] {
  const wb = XLSX.read(buf, { type: "array" });
  // B2 contains wholesale interest rates; OCR is typically in the first or second column
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  if (!sheet?.["!ref"]) throw new Error("Empty B2 sheet");

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Find the OCR column by scanning headers
  let dateCol = -1;
  let ocrCol = -1;
  let headerRow = -1;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r] as (string | number | undefined)[];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] ?? "").toLowerCase();
      if (cell.includes("date")) dateCol = c;
      if (cell.includes("official cash rate") || cell === "ocr") ocrCol = c;
    }
    if (dateCol >= 0 && ocrCol >= 0) {
      headerRow = r;
      break;
    }
  }

  if (headerRow === -1 || ocrCol === -1) {
    throw new Error("Could not find OCR column in B2 spreadsheet");
  }

  const points: MetricSeries[] = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] as (string | number | undefined)[];
    if (!row[dateCol]) continue;

    let date: string;
    const dateVal = row[dateCol];
    if (typeof dateVal === "number") {
      date = excelDateToIso(dateVal);
    } else {
      const d = String(dateVal);
      // Try DD/MM/YYYY or YYYY-MM-DD
      const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);
      if (match) {
        date = `${match[3]}-${match[2]!.padStart(2, "0")}-${match[1]!.padStart(2, "0")}`;
      } else {
        date = d;
      }
    }

    const value = parseFloat(String(row[ocrCol] ?? ""));
    if (!isNaN(value) && date.length === 10) {
      points.push({ date, value });
    }
  }

  if (points.length === 0) throw new Error("No OCR data points parsed from B2");

  // Deduplicate — keep last value per date, sort chronologically
  const seen = new Map<string, number>();
  for (const p of points) seen.set(p.date, p.value);
  return Array.from(seen.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }));
}

function parseB1ForNzdUsd(buf: ArrayBuffer): MetricSeries[] {
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  if (!sheet?.["!ref"]) throw new Error("Empty B1 sheet");

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let dateCol = -1;
  let usdCol = -1;
  let headerRow = -1;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r] as (string | number | undefined)[];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] ?? "").toLowerCase();
      if (cell.includes("date")) dateCol = c;
      if (cell.includes("usd") || cell.includes("united states")) usdCol = c;
    }
    if (dateCol >= 0 && usdCol >= 0) {
      headerRow = r;
      break;
    }
  }

  if (headerRow === -1 || usdCol === -1) {
    throw new Error("Could not find NZD/USD column in B1 spreadsheet");
  }

  const points: MetricSeries[] = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] as (string | number | undefined)[];
    if (!row[dateCol]) continue;

    let date: string;
    const dateVal = row[dateCol];
    if (typeof dateVal === "number") {
      date = excelDateToIso(dateVal);
      // Convert to month start for monthly data
      date = date.slice(0, 7) + "-01";
    } else {
      const d = String(dateVal);
      const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);
      if (match) {
        date = `${match[3]}-${match[2]!.padStart(2, "0")}-01`;
      } else {
        date = d.slice(0, 7) + "-01";
      }
    }

    const value = parseFloat(String(row[usdCol] ?? ""));
    if (!isNaN(value) && date.length === 10) {
      points.push({ date, value: Math.round(value * 10000) / 10000 });
    }
  }

  if (points.length === 0) throw new Error("No NZD/USD data points parsed from B1");

  // Deduplicate by month — keep last value
  const seen = new Map<string, number>();
  for (const p of points) seen.set(p.date, p.value);
  return Array.from(seen.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

export async function fetchNzOcr(): Promise<MetricData> {
  const buf = await fetchRbnzXlsx(RBNZ_URLS.b2Daily, "hb2-daily.xlsx");
  const allPoints = parseB2ForOcr(buf);
  const series = allPoints.filter((p) => p.date >= "2010-01-01");
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "cash-rate",
    name: "Official Cash Rate",
    lastUpdated,
    nextExpectedUpdate: null, // RBNZ meeting schedule not scraped yet
    source: "RBNZ",
    unit: "%",
    frequency: "~7x/year",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "cash-rate", currentValue),
    series,
  };
}

export async function fetchNzNzdUsd(): Promise<MetricData> {
  const buf = await fetchRbnzXlsx(RBNZ_URLS.b1Monthly, "hb1-monthly.xlsx");
  const allPoints = parseB1ForNzdUsd(buf);
  const series = allPoints.filter((p) => p.date >= "2010-01-01");
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "nzd-usd",
    name: "NZD/USD",
    lastUpdated,
    nextExpectedUpdate: null,
    source: "RBNZ",
    unit: "USD",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "nzd-usd", currentValue),
    series,
  };
}
