import * as XLSX from "xlsx";
import { getHealthStatus } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";
import { nextAbsUpdate } from "./next-update";

const ABS_GFS_BASE =
  "https://www.abs.gov.au/statistics/economy/government/government-finance-statistics-australia";

const QUARTER_MONTHS: Record<string, string> = {
  Mar: "03",
  Jun: "06",
  Sep: "09",
  Dec: "12",
};

// "Dec Qtr 2025" → "2025-12-01"
function parseGfsDate(label: string): string | null {
  const match = /^(Mar|Jun|Sep|Dec) Qtr (\d{4})$/.exec(label.trim());
  if (!match) return null;
  const m = QUARTER_MONTHS[match[1]!];
  return m ? `${match[2]}-${m}-01` : null;
}

async function fetchGfsXlsx(
  mon: string,
  year: number,
  label: string,
): Promise<ArrayBuffer | null> {
  const url = `${ABS_GFS_BASE}/${mon}-${year}/${label}%20Quarter%20${year}.xlsx`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.arrayBuffer();
}

// Extract Net Operating Balance series from Table 15 of the GFS XLSX.
// Table 15 has date headers in row 6 (col B onward) and the NOB row is searched
// by the label "Net operating balance" in column A. Values are in $m.
function parseTable15(buf: ArrayBuffer): Map<string, number> {
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets["Table 15"];
  if (!sheet?.["!ref"]) return new Map();

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  let headerRow = -1;
  let nobRow = -1;

  for (let r = range.s.r; r <= range.e.r; r++) {
    const cellA = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    const cellB = sheet[XLSX.utils.encode_cell({ r, c: 1 })];
    const aVal = String(cellA?.v ?? "");
    const bVal = String(cellB?.v ?? "");

    if (/net operating balance/i.test(aVal)) {
      nobRow = r;
    }
    if (headerRow === -1 && /Qtr/.test(bVal)) {
      headerRow = r;
    }
    if (headerRow !== -1 && nobRow !== -1) break;
  }

  if (headerRow === -1 || nobRow === -1) return new Map();

  const result = new Map<string, number>();
  for (let c = 1; c <= range.e.c; c++) {
    const headerCell = sheet[XLSX.utils.encode_cell({ r: headerRow, c })];
    const nobCell = sheet[XLSX.utils.encode_cell({ r: nobRow, c })];
    if (!headerCell || !nobCell) continue;

    const date = parseGfsDate(String(headerCell.v ?? ""));
    const raw = nobCell.v;
    const value =
      typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));

    if (date && !isNaN(value)) {
      result.set(date, value);
    }
  }

  return result;
}

// Generate recent quarters newest-first to try as the "latest" file.
// GFS has ~2 month publication lag, so start from current quarter.
function latestQuarters(count: number): Array<{ mon: string; year: number; label: string }> {
  const Q = [
    { mon: "mar", label: "Mar" },
    { mon: "jun", label: "Jun" },
    { mon: "sep", label: "Sep" },
    { mon: "dec", label: "Dec" },
  ];
  const now = new Date();
  let qi = Math.floor(now.getMonth() / 3); // 0=Q1(Jan-Mar)...3=Q4(Oct-Dec)
  let year = now.getFullYear();

  const results: Array<{ mon: string; year: number; label: string }> = [];
  for (let i = 0; i < count; i++) {
    results.push({ ...Q[qi]!, year });
    if (--qi < 0) { qi = 3; year--; }
  }
  return results;
}

export async function fetchFiscalBalance(): Promise<MetricData> {
  const allData = new Map<string, number>();

  // Anchor files to build history back to Sep 2018.
  // Sep 2021 covers Sep 2018–Sep 2021; Sep 2022 covers Sep 2019–Sep 2022 (fills gap to Dec 2025).
  const anchors = [
    { mon: "sep", year: 2021, label: "Sep" },
    { mon: "sep", year: 2022, label: "Sep" },
  ];

  for (const anchor of anchors) {
    const buf = await fetchGfsXlsx(anchor.mon, anchor.year, anchor.label);
    if (buf) {
      for (const [date, value] of parseTable15(buf)) {
        allData.set(date, value);
      }
    }
  }

  // Latest available quarterly file — try newest quarters first.
  let latestFetched = false;
  for (const q of latestQuarters(8)) {
    const buf = await fetchGfsXlsx(q.mon, q.year, q.label);
    if (buf) {
      for (const [date, value] of parseTable15(buf)) {
        allData.set(date, value); // overwrite anchors with newest data
      }
      latestFetched = true;
      break;
    }
  }

  if (!latestFetched && allData.size === 0) {
    throw new Error("Could not fetch any GFS data");
  }

  // $m → A$B (1 decimal place), quarterly series sorted chronologically
  const series: MetricSeries[] = Array.from(allData.entries())
    .filter(([date]) => date >= "2018-01-01")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      value: Math.round((value / 1000) * 10) / 10,
    }));

  if (series.length < 2) throw new Error("Insufficient GFS data");

  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;

  return {
    id: "fiscal-balance",
    name: "Fiscal Balance",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "quarterly"),
    source: "ABS",
    unit: "A$B",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus("fiscal-balance", currentValue),
    series,
  };
}
