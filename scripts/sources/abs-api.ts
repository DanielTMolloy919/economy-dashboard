import { getHealthStatus, getHealthThresholds } from "~/config/health-thresholds";
import type { MetricData, MetricSeries } from "~/types/metrics";
import { nextAbsUpdate } from "./next-update";

const auThresholds = getHealthThresholds("au");

// ABS SDMX-JSON 2.0 REST API
// Base: https://data.api.abs.gov.au/rest/data/{agencyId},{dataflowId},{version}/{key}
const ABS_BASE = "https://data.api.abs.gov.au/rest/data";

interface AbsDimension {
  id: string;
  values: { id: string; name: string }[];
}

interface AbsResponse {
  data: {
    dataSets: Array<{
      series: Record<
        string,
        { observations: Record<string, [number | null]> }
      >;
    }>;
    structures: Array<{
      dimensions: {
        series: AbsDimension[];
        observation: AbsDimension[];
      };
    }>;
  };
}

function parseAbsDate(timeId: string): string {
  // Monthly: "2024-11" → "2024-11-01"
  // Quarterly: "2024-Q3" → last day of the quarter ("2024-09-30")
  if (timeId.includes("-Q")) {
    const [year, q] = timeId.split("-Q") as [string, string];
    const quarterEnds: Record<string, string> = { "1": "03-31", "2": "06-30", "3": "09-30", "4": "12-31" };
    return `${year}-${quarterEnds[q] ?? "12-31"}`;
  }
  return `${timeId}-01`;
}

async function fetchAbs(
  dataflow: string,
  key: string,
  startPeriod: string,
): Promise<AbsResponse> {
  const url = `${ABS_BASE}/${dataflow}/${key}?startPeriod=${startPeriod}&detail=dataonly&format=jsondata`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.sdmx.data+json;version=2.0" },
  });
  if (!res.ok)
    throw new Error(`ABS fetch failed: ${res.status} for ${dataflow}/${key}`);
  return (await res.json()) as AbsResponse;
}

function extractSeries(response: AbsResponse, seriesKey = "0"): MetricSeries[] {
  const structure = response.data.structures[0]!;
  const timeDim = structure.dimensions.observation[0]!;
  const dataset = response.data.dataSets[0]!;

  // Find the series matching seriesKey prefix (or use first series if "0")
  const matchedKey = Object.keys(dataset.series).find((k) =>
    seriesKey === "0" ? true : k.startsWith(seriesKey),
  );
  if (!matchedKey) throw new Error(`No series found matching "${seriesKey}"`);

  const obs = dataset.series[matchedKey]!.observations;
  return Object.entries(obs)
    .map(([idx, [value]]) => ({
      date: parseAbsDate(timeDim.values[Number(idx)]!.id),
      value: value ?? 0,
    }))
    .filter((p) => p.value !== 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Compute year-on-year % change from an index number series (4 quarters back for quarterly)
function toYoY(series: MetricSeries[], periodsPerYear: number): MetricSeries[] {
  return series.slice(periodsPerYear).map((p, i) => {
    const prev = series[i]!;
    const change = ((p.value - prev.value) / prev.value) * 100;
    return { date: p.date, value: Math.round(change * 10) / 10 };
  });
}

// Stitch a low-resolution series with a high-resolution one.
// Uses low-res for history, then switches to high-res for any dates
// beyond the last low-res point. If no high-res data exists beyond
// that cutoff, the low-res series is returned unchanged.
function stitchHighRes(lowRes: MetricSeries[], highRes: MetricSeries[]): MetricSeries[] {
  const cutoff = lowRes.at(-1)?.date;
  if (!cutoff) return lowRes;
  const extension = highRes.filter((p) => p.date > cutoff);
  return extension.length > 0 ? [...lowRes, ...extension] : lowRes;
}

export async function fetchGdp(): Promise<MetricData> {
  // ANA_AGG: Australian National Accounts Key Aggregates
  // Key: MEASURE.DATA_ITEM.TSEST.REGION.FREQ
  // M1=Chain volume index, GPM=GDP, 20=Seasonally adjusted, AUS, Q=Quarterly
  // Compute YoY from index numbers (4 quarters back)
  const response = await fetchAbs(
    "ABS,ANA_AGG,1.0.0",
    "M1.GPM.20.AUS.Q",
    "2004-Q1",
  );
  const indexSeries = extractSeries(response);
  const series = toYoY(indexSeries, 4);
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "gdp",
    name: "GDP Growth",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "quarterly"),
    source: "ABS",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "gdp", currentValue),
    series,
  };
}

export async function fetchUnemployment(): Promise<MetricData> {
  // LF: Labour Force Survey
  // Key: MEASURE.SEX.AGE.TSEST.REGION.FREQ
  // M13=Unemployment rate (%), 3=Persons, 1599=All ages, 20=Seasonally adjusted, AUS, M=Monthly
  const response = await fetchAbs(
    "ABS,LF,1.0.0",
    "M13.3.1599.20.AUS.M",
    "2010-01",
  );
  const series = extractSeries(response);
  const currentValue = Math.round(series.at(-1)!.value * 10) / 10;
  const previousValue = Math.round(series.at(-2)!.value * 10) / 10;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "unemployment",
    name: "Unemployment",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "monthly"),
    source: "ABS",
    unit: "%",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "unemployment", currentValue),
    series,
  };
}

export async function fetchWages(): Promise<MetricData> {
  // WPI: Wage Price Index
  // Key: MEASURE.INDEX.SECTOR.INDUSTRY.TSEST.REGION.FREQ
  // Fetch index numbers (measure 1), then compute YoY ourselves
  // THRPEB=Total hourly rates excl. bonuses, sector 7=Private+Public, INDUSTRY=TOT=All industries, seasonally adj, Australia, Quarterly
  const response = await fetchAbs(
    "ABS,WPI,1.2.0",
    "1.THRPEB.7.TOT.20.AUS.Q",
    "2009-Q1",
  );
  const indexSeries = extractSeries(response);
  const series = toYoY(indexSeries, 4); // 4 quarters back = 1 year
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "wages",
    name: "Wage Growth",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "quarterly"),
    source: "ABS",
    unit: "% YoY",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "wages", currentValue),
    series,
  };
}

export async function fetchUnderemployment(): Promise<MetricData> {
  // LF_UNDER: Labour Force Underemployment
  // Key: PARM_ITEM.SEX.AGE.TSEST.REGION.FREQ
  // M22=Underemployment ratio (share of employed), 3=Persons, 1599=All ages, 20=Seasonally adjusted, AUS, M=Monthly
  const response = await fetchAbs(
    "ABS,LF_UNDER,1.0.1",
    "M22.3.1599.20.AUS.M",
    "2010-01",
  );
  const series = extractSeries(response);
  const rounded = series.map((p) => ({ ...p, value: Math.round(p.value * 10) / 10 }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "underemployment",
    name: "Underemployment",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "monthly"),
    source: "ABS",
    unit: "%",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "underemployment", currentValue),
    series: rounded,
  };
}

export async function fetchHouseholdSpending(): Promise<MetricData> {
  // HSI_M: Monthly Household Spending Indicator
  // Key: MEASURE.CATEGORY.PRICE_ADJUSTMENT.TSEST.STATE.FREQ
  // 9=Through the year % change, TOT=Total, CUR=Current price, 20=Seasonally adjusted, AUS, M=Monthly
  const response = await fetchAbs(
    "ABS,HSI_M,1.6.0",
    "9.TOT.CUR.20.AUS.M",
    "2014-01",
  );
  const series = extractSeries(response).filter((p) => p.value !== 0);
  const currentValue = Math.round(series.at(-1)!.value * 10) / 10;
  const previousValue = Math.round(series.at(-2)!.value * 10) / 10;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "household-spending",
    name: "Household Spending",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "monthly"),
    source: "ABS",
    unit: "% YoY",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "household-spending", currentValue),
    series,
  };
}

export async function fetchJobVacancies(): Promise<MetricData> {
  // JV: Job Vacancies
  // Key: MEASURE.SECTOR.INDUSTRY.TSEST.REGION.FREQ
  // M1=Job vacancies (thousands), 7=Private+Public, TOT=All industries, 20=Seasonally adjusted, AUS, Q=Quarterly
  const response = await fetchAbs(
    "ABS,JV,1.0",
    "M1.7.TOT.20.AUS.Q",
    "2004-Q1",
  );
  const series = extractSeries(response);
  const rounded = series.map((p) => ({ ...p, value: Math.round(p.value * 10) / 10 }));
  const currentValue = rounded.at(-1)!.value;
  const previousValue = rounded.at(-2)!.value;
  const lastUpdated = rounded.at(-1)!.date;
  return {
    id: "job-vacancies",
    name: "Job Vacancies",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "quarterly"),
    source: "ABS",
    unit: "k",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "job-vacancies", currentValue),
    series: rounded,
  };
}

export async function fetchTrade(): Promise<MetricData> {
  // ITGS: International Trade in Goods
  // Key: MEASURE.DATA_ITEM.TSEST.REGION.FREQ
  // M1=Current prices, 170=Balance on goods, 20=Seasonally adjusted, AUS, M=Monthly
  // Values are in A$M — divide by 1000 for A$B
  const response = await fetchAbs(
    "ABS,ITGS,1.2.0",
    "M1.170.20.AUS.M",
    "2004-01",
  );
  const raw = extractSeries(response);
  const series = raw.map((p) => ({ ...p, value: Math.round((p.value / 1000) * 10) / 10 }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "trade",
    name: "Trade Balance",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "monthly"),
    source: "ABS",
    unit: "A$B",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "trade", currentValue),
    series,
  };
}

export async function fetchBuildingApprovals(): Promise<MetricData> {
  // BA_GCCSA: Building Approvals by GCCSA
  // Key: MEASURE.VALUE.SECTOR.WORK_TYPE.BUILDING_TYPE.TSEST.REGION.FREQ
  // 1=Number of dwelling units, 1=Total, 9=Total Sectors, 1=New, 100=Total Residential, 10=Original, AUS, M=Monthly
  // Values are unit counts — divide by 1000 for thousands
  const response = await fetchAbs(
    "ABS,BA_GCCSA,1.0.0",
    "1.1.9.1.100.10.AUS.M",
    "2004-01",
  );
  const raw = extractSeries(response);
  const series = raw.map((p) => ({ ...p, value: Math.round((p.value / 1000) * 10) / 10 }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "building-approvals",
    name: "Building Approvals",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "monthly"),
    source: "ABS",
    unit: "k dwellings",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "building-approvals", currentValue),
    series,
  };
}

export async function fetchDwellingCompletions(): Promise<MetricData> {
  // BUILDING_ACTIVITY: Building Activity
  // Key: MEASURE.REGION.PRICE_ADJ.BLD_WORK_TYPE.SECTOR_OWN.TYPE_BLDG.TSEST.FREQ
  // M7=Dwelling units completed, AUS, CUR, 1=New, 9=Total Sectors, 100=Total Residential, 20=Seasonally Adjusted, Q=Quarterly
  // Values are unit counts — divide by 1000 for thousands
  const response = await fetchAbs(
    "ABS,BUILDING_ACTIVITY,1.0.0",
    "M7.AUS.CUR.1.9.100.20.Q",
    "2004-Q1",
  );
  const raw = extractSeries(response);
  const series = raw.map((p) => ({ ...p, value: Math.round((p.value / 1000) * 10) / 10 }));
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "dwelling-completions",
    name: "Dwelling Completions",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "quarterly"),
    source: "ABS",
    unit: "k dwellings",
    frequency: "Quarterly",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "dwelling-completions", currentValue),
    series,
  };
}

export async function fetchCpi(): Promise<MetricData> {
  // CPI: Consumer Price Index — quarterly history stitched with monthly recent data.
  // Quarterly (2009–): CPI 2.0.0, key 1.10001..50.Q → toYoY(4)
  // Monthly (Apr 2024–): CPI 2.0.0, key 1.10001.10.50.M → toYoY(12)
  // Monthly YoY points beyond the last quarterly print are appended via stitchHighRes.

  const [quarterlyResponse, monthlyResponse] = await Promise.all([
    fetchAbs("ABS,CPI,2.0.0", "1.10001..50.Q", "2009-Q1"),
    fetchAbs("ABS,CPI,2.0.0", "1.10001.10.50.M", "2024-04"),
  ]);

  const series = stitchHighRes(
    toYoY(extractSeries(quarterlyResponse), 4),
    toYoY(extractSeries(monthlyResponse), 12),
  );
  const currentValue = series.at(-1)!.value;
  const previousValue = series.at(-2)!.value;
  const lastUpdated = series.at(-1)!.date;
  return {
    id: "cpi",
    name: "Inflation (CPI)",
    lastUpdated,
    nextExpectedUpdate: nextAbsUpdate(lastUpdated, "monthly"),
    source: "ABS",
    unit: "% YoY",
    frequency: "Monthly",
    currentValue,
    previousValue,
    health: getHealthStatus(auThresholds, "cpi", currentValue),
    series,
  };
}
