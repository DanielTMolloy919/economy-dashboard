/**
 * Generates a human-readable commit message from staged data/ changes.
 * Usage: pnpm tsx scripts/generate-commit-message.ts
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const COUNTRY_NAMES: Record<string, string> = {
  au: "Australia",
  us: "United States",
  uk: "United Kingdom",
  nz: "New Zealand",
  ca: "Canada",
};

type Dir = "up" | "down";

interface Change {
  id: string;
  country: string;
  from: number;
  to: number;
  unit: string;
}

const CENTRAL_BANKS: Record<string, string> = {
  au: "RBA",
  nz: "RBNZ",
  us: "Fed",
  uk: "Bank of England",
  ca: "Bank of Canada",
};

function pct(v: number) {
  return `${v}%`;
}

// Formats units like "A$B", "$B", "£B", "NZ$B", "C$B" → "A$1.8B"
function fmtCurrency(value: number, unit: string): string {
  if (unit.endsWith("B")) {
    const prefix = unit.slice(0, -1); // e.g. "A$"
    return `${prefix}${value}B`;
  }
  return `${value}${unit}`;
}

function describe(change: Change): string {
  const { id, country, from, to, unit } = change;
  const dir: Dir = to > from ? "up" : "down";
  const bank = CENTRAL_BANKS[country] ?? "Central bank";

  switch (id) {
    case "cash-rate":
    case "fed-funds-rate":
    case "bank-rate":
    case "policy-rate": {
      const action = dir === "up" ? "hiked" : "cut";
      const rateName =
        id === "fed-funds-rate" ? "rates" :
        id === "bank-rate" ? "the Bank Rate" :
        "the cash rate";
      return `${bank} ${action} ${rateName} to ${pct(to)}`;
    }

    case "cpi":
      return dir === "up"
        ? `Inflation ticked up to ${pct(to)}`
        : `Inflation eased to ${pct(to)}`;

    case "unemployment":
      return dir === "up"
        ? `Unemployment rose to ${pct(to)}`
        : `Unemployment fell to ${pct(to)}`;
    case "underemployment":
      return dir === "up"
        ? `Underemployment ticked up to ${pct(to)}`
        : `Underemployment eased to ${pct(to)}`;
    case "economic-inactivity":
      return dir === "up"
        ? `Economic inactivity rose to ${pct(to)}`
        : `Economic inactivity fell to ${pct(to)}`;
    case "job-vacancies":
      return dir === "up" ? `Job vacancies rose to ${to}k` : `Job vacancies fell to ${to}k`;
    case "job-openings":
      return dir === "up" ? `Job openings rose to ${to}k` : `Job openings fell to ${to}k`;

    case "wages":
      return dir === "up"
        ? `Wages growth picked up to ${pct(to)}`
        : `Wages growth slowed to ${pct(to)}`;
    case "real-wages":
      if (to < 0) {
        return dir === "down"
          ? `Real wages fell further to ${pct(to)}`
          : `Real wages improved to ${pct(to)} but remain negative`;
      }
      return dir === "up"
        ? `Real wages grew to ${pct(to)}`
        : `Real wages slipped to ${pct(to)}`;

    case "gdp":
      return dir === "up"
        ? `GDP growth picked up to ${pct(to)}`
        : `GDP growth slowed to ${pct(to)}`;
    case "gdp-per-capita":
      return dir === "up"
        ? `GDP per capita edged up to ${to}`
        : `GDP per capita dipped to ${to}`;

    case "household-spending":
      return dir === "up"
        ? `Household spending accelerated to ${pct(to)}`
        : `Household spending cooled to ${pct(to)}`;
    case "personal-consumption":
      return dir === "up"
        ? `Personal consumption grew to ${pct(to)}`
        : `Personal consumption slowed to ${pct(to)}`;
    case "retail-sales":
    case "retail-trade": {
      const noun = id === "retail-trade" ? "trade" : "sales";
      return dir === "up" ? `Retail ${noun} rose to ${pct(to)}` : `Retail ${noun} fell to ${pct(to)}`;
    }

    case "productivity":
      return dir === "up"
        ? `Labour productivity improved to ${to}`
        : `Labour productivity declined to ${to}`;

    case "fiscal-balance":
      return `Fiscal balance ${to > from ? "improved" : "worsened"} to ${fmtCurrency(to, unit)}`;

    case "trade": {
      const wasNeg = from < 0;
      const nowPos = to > 0;
      if (wasNeg && nowPos) return `Trade flipped to a ${fmtCurrency(to, unit)} surplus`;
      if (!wasNeg && to < 0) return `Trade flipped to a ${fmtCurrency(Math.abs(to), unit)} deficit`;
      return dir === "up"
        ? `Trade balance improved to ${fmtCurrency(to, unit)}`
        : `Trade balance worsened to ${fmtCurrency(to, unit)}`;
    }

    case "aud-usd":
      return dir === "up" ? `AUD strengthened to ${to} against USD` : `AUD weakened to ${to} against USD`;
    case "nzd-usd":
      return dir === "up" ? `NZD strengthened to ${to} against USD` : `NZD weakened to ${to} against USD`;
    case "gbp-usd":
      return dir === "up" ? `GBP strengthened to ${to} against USD` : `GBP weakened to ${to} against USD`;
    case "cad-usd":
      return dir === "up" ? `CAD strengthened to ${to} against USD` : `CAD weakened to ${to} against USD`;
    case "usd-index":
      return dir === "up" ? `USD strengthened (index: ${to})` : `USD weakened (index: ${to})`;

    case "building-approvals":
      return dir === "up" ? `Building approvals rose to ${pct(to)}` : `Building approvals fell to ${pct(to)}`;
    case "dwelling-completions":
      return dir === "up" ? `Dwelling completions rose to ${to}k` : `Dwelling completions fell to ${to}k`;
    case "building-permits":
      return dir === "up" ? `Building permits rose to ${to}k` : `Building permits fell to ${to}k`;
    case "housing-starts":
      return dir === "up" ? `Housing starts rose to ${to}k` : `Housing starts fell to ${to}k`;

    default:
      return dir === "up" ? `${id} rose to ${to}${unit}` : `${id} fell to ${to}${unit}`;
  }
}

function parseCurrentValue(block: string, sign: "+" | "-"): number | null {
  const regex = new RegExp(`^\\${sign}\\s*"currentValue":\\s*([\\d.eE+\\-]+)`, "m");
  const match = block.match(regex);
  return match ? parseFloat(match[1]) : null;
}

function main() {
  const diff = execSync("git diff --staged -- 'data/**/*.json'", { encoding: "utf-8" });

  if (!diff.trim()) {
    process.stdout.write("chore: update economic data [skip ci]\n");
    return;
  }

  const fileBlocks = diff.split(/^diff --git /m).slice(1);
  const changesByCountry: Record<string, Change[]> = {};

  for (const block of fileBlocks) {
    const fileMatch = block.match(/^a\/data\/(\w+)\/(.+?)\.json\s/);
    if (!fileMatch) continue;

    const country = fileMatch[1];
    const id = fileMatch[2];
    if (!COUNTRY_NAMES[country]) continue;

    const oldValue = parseCurrentValue(block, "-");
    const newValue = parseCurrentValue(block, "+");

    if (oldValue === null || newValue === null || oldValue === newValue) continue;

    try {
      const filePath = join(process.cwd(), "data", country, `${id}.json`);
      const json = JSON.parse(readFileSync(filePath, "utf-8"));

      if (!changesByCountry[country]) changesByCountry[country] = [];
      changesByCountry[country].push({ id, country, unit: json.unit, from: oldValue, to: newValue });
    } catch {
      // skip if file unreadable
    }
  }

  const countries = Object.keys(changesByCountry);
  if (countries.length === 0) {
    process.stdout.write("chore: update economic data [skip ci]\n");
    return;
  }

  const today = new Date().toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  const lines: string[] = [`chore: update economic data [skip ci]`, ``, `Data refresh — ${today}`];

  for (const country of countries) {
    lines.push(``, COUNTRY_NAMES[country]);
    for (const change of changesByCountry[country]) {
      lines.push(`- ${describe(change)}`);
    }
  }

  process.stdout.write(lines.join("\n") + "\n");
}

try {
  main();
} catch (err) {
  console.error("Error generating commit message:", err);
  process.stdout.write("chore: update economic data [skip ci]\n");
  process.exit(0);
}
