import * as XLSX from "xlsx";
import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";

// NZ Treasury publishes historical fiscal data as an XLSX file.
// The "Fiscal Time Series" workbook contains OBEGAL back to 1994.
// Published at: https://www.treasury.govt.nz/publications/information-release/data-fiscal-time-series-historical-fiscal-indicators
// or via Budget Data Library: https://budget.govt.nz/budget/2025/data-library.htm
//
// Note: This gives annual data only. NZ does not publish standardised quarterly fiscal data
// like Australia's GFS. For more granular data, the Crown Financial Statements
// (published irregularly as PDFs) would need to be parsed.

const nzThresholds = getHealthThresholds("nz");

// Try multiple known URLs for the fiscal time series XLSX
const FISCAL_URLS = [
  "https://www.treasury.govt.nz/sites/default/files/2025-05/fiscal-time-series-2025.xlsx",
  "https://www.treasury.govt.nz/sites/default/files/2024-10/fiscal-time-series-2024.xlsx",
];

async function fetchFiscalXlsx(): Promise<ArrayBuffer> {
  for (const url of FISCAL_URLS) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        // Verify it's an XLSX
        const header = new Uint8Array(buf.slice(0, 4));
        if (header[0] === 0x50 && header[1] === 0x4b) return buf;
      }
    } catch {
      continue;
    }
  }
  throw new Error(
    "Could not fetch NZ Treasury fiscal time series XLSX from any known URL.\n" +
    "    Check https://www.treasury.govt.nz/publications/information-release/data-fiscal-time-series-historical-fiscal-indicators"
  );
}

// Parse the fiscal time series XLSX for OBEGAL data.
// The workbook contains various tabs; we look for one containing "OBEGAL"
// in a header row, with fiscal years as column headers (e.g. "2023/24", "2024/25").
function parseFiscalTimeSeriesForObegal(buf: ArrayBuffer): MetricSeries[] {
  const wb = XLSX.read(buf, { type: "array" });

  // Look for a sheet that contains OBEGAL data
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]!;
    if (!sheet["!ref"]) continue;

    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Find the OBEGAL row
    let obegalRow = -1;
    let headerRow = -1;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] as (string | number | undefined)[];
      const firstCell = String(row[0] ?? "").toLowerCase();

      // Identify year headers (e.g. "2023/24" or "2024")
      if (headerRow === -1) {
        for (let c = 1; c < row.length; c++) {
          const val = String(row[c] ?? "");
          if (/^\d{4}(\/\d{2})?$/.test(val)) {
            headerRow = r;
            break;
          }
        }
      }

      if (firstCell.includes("obegal") || firstCell.includes("operating balance excluding")) {
        obegalRow = r;
      }
    }

    if (obegalRow === -1 || headerRow === -1) continue;

    const headerCells = rows[headerRow] as (string | number | undefined)[];
    const obegalCells = rows[obegalRow] as (string | number | undefined)[];
    const points: MetricSeries[] = [];

    for (let c = 1; c < headerCells.length; c++) {
      const yearStr = String(headerCells[c] ?? "");
      const raw = obegalCells[c];
      const value = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));

      if (isNaN(value)) continue;

      // Parse fiscal year: "2023/24" → "2024-06-30" (end of NZ fiscal year)
      // or plain year "2024" → "2024-06-30"
      let date: string;
      const fyMatch = /^(\d{4})\/(\d{2})$/.exec(yearStr);
      if (fyMatch) {
        const endYear = parseInt(fyMatch[1]!) + 1;
        date = `${endYear}-06-30`;
      } else if (/^\d{4}$/.test(yearStr)) {
        date = `${yearStr}-06-30`;
      } else {
        continue;
      }

      // Values may be in $M — convert to NZ$B
      const valueInB = Math.round((value / 1000) * 10) / 10;
      points.push({ date, value: valueInB });
    }

    if (points.length > 0) {
      return points.sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  throw new Error("Could not find OBEGAL data in fiscal time series XLSX");
}

export async function fetchNzFiscalBalance(): Promise<MetricData> {
  const buf = await fetchFiscalXlsx();
  const allPoints = parseFiscalTimeSeriesForObegal(buf);
  const series = allPoints.filter((p) => p.date >= "2005-01-01");

  if (series.length < 2) throw new Error("Insufficient NZ fiscal data");

  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;

  return {
    id: "fiscal-balance",
    name: "Fiscal Balance (OBEGAL)",
    lastUpdated,
    nextExpectedUpdate: null,
    source: "NZ Treasury",
    unit: "NZ$B",
    frequency: "Annual",
    currentValue,
    previousValue,
    health: getHealthStatus(nzThresholds, "fiscal-balance", currentValue),
    series,
  };
}
