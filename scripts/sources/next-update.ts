import { parse } from "node-html-parser";

// Formula-based next expected update for ABS series.
// Offsets are conservative estimates based on ABS release patterns:
//   Monthly series: ~5 weeks after reference month end
//   Quarterly series: ~7 weeks after quarter end
export function nextAbsUpdate(lastUpdated: string, frequency: "monthly" | "quarterly"): string {
  const last = new Date(lastUpdated);
  const offsetDays = frequency === "monthly" ? 35 : 49;
  const next = new Date(last);
  next.setDate(next.getDate() + offsetDays);
  return next.toISOString().slice(0, 10);
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
