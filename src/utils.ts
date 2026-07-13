// ---------------------------------------------------------------------------
// Small formatting helpers shared by templates.ts
// ---------------------------------------------------------------------------

/**
 * Splits a multiline textarea value into a Markdown bullet list, one `*` per
 * non-empty line. Used for any field the user wants to be able to enter
 * multiple entries into (WHO, Assigned To, Agenda, Goals, etc.).
 */
export function bulletList(text: string, fallback = "None"): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return `* ${fallback}`;
  return lines.map((line) => `* ${line}`).join("\n");
}

/**
 * Current date/time formatted as "Day, Month 00, Year 00:00 AM/PM",
 * e.g. "Monday, July 13, 2026 09:41 AM". Used by templates whose date field
 * is system-generated instead of user-entered (scrum-ytb, scrum-mom).
 */
export function formatNow(): string {
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const now = new Date();
  const day = DAYS[now.getDay()];
  const month = MONTHS[now.getMonth()];
  const date = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}, ${month} ${date}, ${year} ${hours}:${minutes} ${period}`;
}