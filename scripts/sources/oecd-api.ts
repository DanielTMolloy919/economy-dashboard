/**
 * OECD Data Explorer (SDMX) — replaces the OECD "Main Economic Indicators" series
 * that FRED stopped updating (e.g. CPALTT01CAM659N ended Mar 2025, NZLRGDPPCMEI
 * was removed). No API key required.
 *
 * Browse series at https://data-explorer.oecd.org
 */

import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { CountryCode } from "~/config/countries";
import type { MetricData, MetricSeries } from "~/types/metrics";
import { nextFredUpdate } from "./next-update";

const OECD_BASE = "https://sdmx.oecd.org/public/rest/data";

type OecdCountry = Extract<CountryCode, "nz" | "ca">;

const REF_AREA: Record<OecdCountry, string> = { nz: "NZL", ca: "CAN" };

// Convert an SDMX TIME_PERIOD ("2025-Q2", "2025-04", "2025") to a first-of-period
// ISO date, matching the FRED convention used by the rest of the NZ/CA data.
function periodToDate(period: string): string {
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q) return `${q[1]}-${String((Number(q[2]) - 1) * 3 + 1).padStart(2, "0")}-01`;
  if (/^\d{4}-\d{2}$/.test(period)) return `${period}-01`;
  if (/^\d{4}$/.test(period)) return `${period}-01-01`;
  throw new Error(`Unrecognised OECD period: ${period}`);
}

export async function fetchOecdSeries(
  dataflow: string,
  key: string,
  startPeriod: string,
): Promise<MetricSeries[]> {
  const url = `${OECD_BASE}/${dataflow}/${key}?startPeriod=${startPeriod}`;
  // The OECD API intermittently returns 5xx/429 under load, so retry a few times.
  let res: Response | undefined;
  for (let attempt = 1; attempt <= 4; attempt++) {
    res = await fetch(url, { headers: { Accept: "application/vnd.sdmx.data+csv; charset=utf-8" } });
    if (res.ok || (res.status < 500 && res.status !== 429)) break;
    await new Promise((r) => setTimeout(r, attempt * 10_000));
  }
  if (!res?.ok) throw new Error(`OECD fetch failed: ${res?.status} for ${dataflow}/${key}`);
  const lines = (await res.text()).trim().split(/\r?\n/);
  const header = lines[0]!.split(",");
  const timeIdx = header.indexOf("TIME_PERIOD");
  const valueIdx = header.indexOf("OBS_VALUE");
  if (timeIdx === -1 || valueIdx === -1) throw new Error(`Unexpected OECD CSV header for ${key}`);

  const series = lines
    .slice(1)
    .map((line) => line.split(","))
    .filter((cols) => cols[valueIdx] !== "" && cols[valueIdx] !== undefined)
    .map((cols) => ({ date: periodToDate(cols[timeIdx]!), value: parseFloat(cols[valueIdx]!) }))
    .filter((p) => Number.isFinite(p.value))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (series.length < 2) throw new Error(`OECD returned too little data for ${key}`);
  return series;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

// --- CPI inflation (% change on same period previous year) ---
// NZ publishes CPI quarterly; Canada monthly.
export async function fetchOecdCpi(country: OecdCountry): Promise<MetricData> {
  const freq = country === "nz" ? "Q" : "M";
  const raw = await fetchOecdSeries(
    "OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0",
    `${REF_AREA[country]}.${freq}.N.CPI.PA._T.N.GY`,
    freq === "Q" ? "2005-Q1" : "2005-01",
  );
  const series = raw.map((p) => ({ ...p, value: round1(p.value) }));
  const currentValue = series.at(-1)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "cpi",
    name: "Inflation (CPI)",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, freq === "Q" ? "quarterly" : "monthly"),
    source: "OECD",
    unit: "% YoY",
    frequency: freq === "Q" ? "Quarterly" : "Monthly",
    currentValue,
    previousValue: series.at(-2)!.value,
    health: getHealthStatus(getHealthThresholds(country), "cpi", currentValue),
    series,
  };
}

// --- Real GDP per capita (level; YoY computed at runtime in data.ts) ---
// B1GQ_POP = GDP per head, USD PPP, chain-linked volume (LR), seasonally adjusted.
export async function fetchOecdGdpPerCapita(country: OecdCountry): Promise<MetricData> {
  const series = await fetchOecdSeries(
    "OECD.SDD.NAD,DSD_NAMAIN1@DF_QNA,1.1",
    `Q.Y.${REF_AREA[country]}.S1.S1.B1GQ_POP._Z._Z._Z.USD_PPP_PS.LR.LA.T0102`,
    "2004-Q1",
  );
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "gdp-per-capita",
    name: "GDP per Capita",
    lastUpdated,
    nextExpectedUpdate: nextFredUpdate(lastUpdated, "quarterly"),
    source: "OECD",
    unit: "index",
    frequency: "Quarterly",
    currentValue: series.at(-1)!.value,
    previousValue: series.at(-2)!.value,
    health: "yellow", // recomputed at runtime after YoY transform
    series,
  };
}
