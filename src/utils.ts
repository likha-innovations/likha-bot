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
 * Current date/time in Philippine time (Asia/Manila, UTC+8), formatted as
 * "Day, Month 00, Year 00:00 AM/PM", e.g. "Monday, July 13, 2026 09:41 AM".
 * Used by templates whose date field is system-generated instead of
 * user-entered (scrum-ytb, scrum-mom).
 *
 * Explicitly pins the timezone via Intl.DateTimeFormat instead of using
 * Date's local getters (getHours(), getDay(), etc.), since those follow
 * whatever timezone the host machine/VPS is set to — often UTC — which
 * would silently shift these timestamps by 8 hours.
 */
export function formatNow(): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((p) => [p.type, p.value]),
  );

  return `${parts.weekday}, ${parts.month} ${parts.day}, ${parts.year} ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
}
