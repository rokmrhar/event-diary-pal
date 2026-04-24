/**
 * Format an ISO date string (YYYY-MM-DD) or full ISO timestamp
 * to Slovenian dd.mm.yyyy format.
 */
export function formatDateSI(value: string | Date | null | undefined): string {
  if (!value) return "—";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return String(value);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return String(value);
  }
}

/**
 * Format a HH:MM:SS or HH:MM time string to 24h HH:MM.
 */
export function formatTime24(t: string | null | undefined): string {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

/**
 * Format an ISO timestamp to "dd.mm.yyyy HH:MM" (24h).
 */
export function formatDateTimeSI(value: string | Date | null | undefined): string {
  if (!value) return "—";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return String(value);
    const date = formatDateSI(d);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${date} ${hh}:${mm}`;
  } catch {
    return String(value);
  }
}