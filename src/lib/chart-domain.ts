// Y-axis domain helpers shared by single- and multi-series charts.

// Clamp the y-axis to the P2–P98 range + 10% padding so that extreme
// outliers (e.g. COVID-era monthly swings) don't squash the normal range.
// Snaps bounds to "nice" numbers so Recharts generates clean tick labels.
export function clampedDomain(
  values: number[],
): [number, number] | ["auto", "auto"] {
  if (values.length < 10) return ["auto", "auto"];
  const sorted = [...values].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.02)]!;
  const hi = sorted[Math.floor(sorted.length * 0.98)]!;
  const range = hi - lo;
  if (range === 0) return ["auto", "auto"];
  const pad = range * 0.1;
  const rawLo = lo - pad;
  const rawHi = hi + pad;
  // Snap to a "nice" step so ticks land on round numbers
  const roughStep = (rawHi - rawLo) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const step = Math.ceil(roughStep / mag) * mag;
  return [Math.floor(rawLo / step) * step, Math.ceil(rawHi / step) * step];
}

// Concrete numeric y-bounds for band clipping. Falls back to data min/max when
// clampedDomain returned "auto" (short series or zero-range data).
export function numericBounds(
  values: number[],
  domain: [number, number] | ["auto", "auto"],
): [number, number] {
  if (typeof domain[0] === "number" && typeof domain[1] === "number")
    return [domain[0], domain[1]];
  if (values.length === 0) return [0, 1];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (hi === lo) return [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.1;
  return [lo - pad, hi + pad];
}
