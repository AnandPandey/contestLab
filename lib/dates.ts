/** Date -> value for <input type="datetime-local"> in the browser's timezone. */
export function toLocalInput(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value -> ISO string (or null when empty). */
export function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export type ContestPhase = "upcoming" | "live" | "ended" | "undated";

export function contestPhase(start: Date | null, end: Date | null, now: number): ContestPhase {
  if (!start && !end) return "undated";
  if (start && now < start.getTime()) return "upcoming";
  if (end && now > end.getTime()) return "ended";
  return start ? "live" : "ended";
}
