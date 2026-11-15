// Axis helpers shared by single- and multi-series charts.

export interface YAxisScale {
  domain: [number, number];
  ticks: number[];
}

const NICE_MULTIPLIERS = [1, 2, 2.5, 5];

// "Nice" steps (1, 2, 2.5, 5 × 10^n) in ascending order, starting at the
// largest one that is <= `from`.
function* niceSteps(from: number): Generator<number> {
  let mag = Math.pow(10, Math.floor(Math.log10(from)));
  for (; ;) {
    for (const m of NICE_MULTIPLIERS) yield m * mag;
    mag *= 10;
  }
}

// Avoid floating-point noise like 0.30000000000000004 in tick values.
function clean(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

// Y-axis domain + evenly spaced tick values.
//
// - Clamps to the P2–P98 range + 10% padding so extreme outliers (e.g. COVID-era
//   swings) don't squash the normal range. Short series use the full min/max.
// - Never crosses zero when the data doesn't (rates and levels stay >= 0,
//   always-negative balances stay <= 0).
// - Snaps both bounds to a multiple of a "nice" step and returns explicit ticks,
//   so every tick lands on a round number at an even interval.
export function yAxisScale(
  values: number[],
  { includeZero = false, maxTicks = 6 }: { includeZero?: boolean; maxTicks?: number } = {},
): YAxisScale {
  if (values.length === 0) return { domain: [0, 1], ticks: [0, 1] };

  const sorted = [...values].sort((a, b) => a - b);
  const clamp = values.length >= 10;
  let lo = clamp ? sorted[Math.floor(sorted.length * 0.02)]! : sorted[0]!;
  let hi = clamp ? sorted[Math.floor(sorted.length * 0.98)]! : sorted.at(-1)!;
  // Bar length encodes the value, so bars must be measured from zero.
  if (includeZero) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }

  let rawLo: number;
  let rawHi: number;
  if (hi === lo) {
    const pad = Math.abs(lo) * 0.1 || 1;
    rawLo = lo - pad;
    rawHi = hi + pad;
  } else {
    const pad = (hi - lo) * 0.1;
    rawLo = lo - pad;
    rawHi = hi + pad;
  }
  if (sorted[0]! >= 0 && rawLo < 0) rawLo = 0;
  if (sorted.at(-1)! <= 0 && rawHi > 0) rawHi = 0;

  // Smallest nice step whose outward-snapped bounds fit in maxTicks ticks.
  let step = 1, dLo = 0, dHi = 1;
  for (const s of niceSteps((rawHi - rawLo) / (maxTicks - 1))) {
    step = s;
    dLo = Math.floor(rawLo / s) * s;
    dHi = Math.ceil(rawHi / s) * s;
    if (Math.round((dHi - dLo) / s) <= maxTicks - 1) break;
  }

  const ticks: number[] = [];
  for (let v = dLo; v <= dHi + step / 2; v += step) ticks.push(clean(v));
  return { domain: [clean(dLo), clean(dHi)], ticks };
}

// Format a y tick using only as many decimals as the step needs.
export function makeYTickFormatter(ticks: number[]) {
  const step = ticks.length >= 2 ? Math.abs(ticks[1]! - ticks[0]!) : 1;
  let decimals = 0;
  while (decimals < 4 && Math.abs(Math.round(step * 10 ** decimals) - step * 10 ** decimals) > 1e-6) decimals++;
  return (v: number) => {
    const s = v.toLocaleString("en-AU", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return s === "-0" ? "0" : s;
  };
}

// ---------------------------------------------------------------------------
// Time (x) axis

export function toTime(date: string): number {
  // Parse as UTC midnight so the same date maps to the same instant everywhere.
  return Date.parse(date.length === 10 ? `${date}T00:00:00Z` : date);
}

const DAY = 24 * 60 * 60 * 1000;
const YEAR = 365.25 * DAY;

// Tick positions on calendar boundaries: Jan 1 every N years for long spans,
// or the 1st of every N months for spans of about two years or less.
export function timeTicks(min: number, max: number, maxTicks = 8): number[] {
  if (!(max > min)) return [min];
  const spanYears = (max - min) / YEAR;
  const start = new Date(min);
  const ticks: number[] = [];

  if (spanYears > 2) {
    const yearStep = [1, 2, 5, 10].find((s) => spanYears / s <= maxTicks) ?? 10;
    let y = start.getUTCFullYear() + (start.getUTCMonth() === 0 && start.getUTCDate() === 1 ? 0 : 1);
    y = Math.ceil(y / yearStep) * yearStep;
    for (; ; y += yearStep) {
      const t = Date.UTC(y, 0, 1);
      if (t > max) break;
      ticks.push(t);
    }
    return ticks;
  }

  const spanMonths = spanYears * 12;
  const monthStep = [1, 2, 3, 6].find((s) => spanMonths / s <= maxTicks) ?? 6;
  const y = start.getUTCFullYear(); // Date.UTC rolls months >11 into later years
  let m = start.getUTCMonth() + (start.getUTCDate() === 1 ? 0 : 1);
  m = Math.ceil(m / monthStep) * monthStep;
  for (; ;) {
    const t = Date.UTC(y, m, 1);
    if (t > max) break;
    ticks.push(t);
    m += monthStep;
  }
  return ticks;
}

export function makeTimeTickFormatter(min: number, max: number) {
  const spanYears = (max - min) / YEAR;
  return (t: number) => {
    const d = new Date(t);
    if (spanYears > 2) return String(d.getUTCFullYear());
    return d.toLocaleDateString("en-AU", { month: "short", year: "2-digit", timeZone: "UTC" });
  };
}

export function formatTooltipDate(t: number): string {
  return new Date(t).toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
