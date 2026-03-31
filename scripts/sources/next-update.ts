import { parse } from "node-html-parser";

// Formula-based next expected update for ABS series.
// Logic: advance lastUpdated by one period to get the end of the next reference period,
// then add a release lag. ABS typically publishes:
//   Monthly series: ~5 weeks after the reference month ends
//   Quarterly series: ~7 weeks after the reference quarter ends
export function nextAbsUpdate(lastUpdated: string, frequency: "monthly" | "quarterly"): string {
  const last = new Date(lastUpdated);

  let nextPeriodEnd: Date;
  if (frequency === "quarterly") {
    // Advance by 3 months to get the end of the next quarter
    nextPeriodEnd = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 3 + 1, 0));
  } else {
    // Advance by 1 month to get the end of the next month
    nextPeriodEnd = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 2, 0));
  }

  const offsetDays = frequency === "monthly" ? 35 : 49;
  const releaseDate = new Date(nextPeriodEnd);
  releaseDate.setUTCDate(releaseDate.getUTCDate() + offsetDays);

  return releaseDate.toISOString().slice(0, 10);
}

// Scrape the RBA board meeting schedule page to get the next decision date
// after today. Decision day is the second day of the two-day meeting.
// Page: https://www.rba.gov.au/schedules-events/board-meeting-schedules.html
// Table structure: th[scope=row]=month, td[0]=meeting date range (e.g. "4–5 May"), td[1]=SoMP date
export async function nextRbaMeetingDate(): Promise<string | null> {
  const res = await fetch("https://www.rba.gov.au/schedules-events/board-meeting-schedules.html");
  if (!res.ok) return null;

  const root = parse(await res.text());
  const today = new Date();
  const currentYear = today.getFullYear();

  const months: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3,
    May: 4, June: 5, July: 6, August: 7,
    September: 8, October: 9, November: 10, December: 11,
  };

  // Find the table captioned with the current year
  let targetTable = null;
  for (const table of root.querySelectorAll("table")) {
    const caption = table.querySelector("caption")?.text ?? "";
    if (caption.includes(String(currentYear))) {
      targetTable = table;
      break;
    }
  }
  if (!targetTable) return null;

  let currentMonth = "";
  for (const row of targetTable.querySelectorAll("tbody tr")) {
    // Month rows have a th[scope=row]
    const monthCell = row.querySelector("th[scope=row]");
    if (monthCell) currentMonth = monthCell.text.trim();

    const tds = row.querySelectorAll("td");
    if (tds.length === 0) continue;

    // First td contains the meeting date range e.g. "4–5 May" or "4-5 May"
    // node-html-parser may leave &ndash; as-is, so match any non-digit separator
    const rangeText = tds[0]?.text.trim() ?? "";
    // Extract all digit sequences — last one before the month name is the decision day
    const allNumbers = rangeText.match(/\d+/g);
    if (!allNumbers || allNumbers.length < 2) continue;

    // First number = start day, second number = decision day (day 2 of 2-day meeting)
    const decisionDay = parseInt(allNumbers[1]!, 10);
    const monthIndex = months[currentMonth];
    if (monthIndex === undefined) continue;

    const decisionDate = new Date(Date.UTC(currentYear, monthIndex, decisionDay));
    if (decisionDate > today) {
      return `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(decisionDay).padStart(2, "0")}`;
    }
  }

  // If nothing found in current year's table, try next year
  return null;
}
