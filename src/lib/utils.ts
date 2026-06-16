// Korea Standard Time (UTC+9). Published times are stored as UTC instants, but
// the site serves a Korean audience, so displayed dates must always be KST —
// independent of the runtime timezone. (The production server runs in UTC, so
// relying on Date.prototype.getHours()/getDate() would show UTC, not KST.)
const KST_TIME_ZONE = "Asia/Seoul";

function getKstParts(dateStr: string): Record<string, string> | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const out: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") out[part.type] = part.value;
  }
  return out;
}

export function formatDate(dateStr: string): string {
  const p = getKstParts(dateStr);
  if (!p) return "-";
  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
}

export function parsePageNumber(pageParam: string | undefined): number {
  if (!pageParam) return 1;

  const parsed = Number(pageParam);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return 1;

  return parsed;
}

export function formatDateShort(dateStr: string): string {
  const p = getKstParts(dateStr);
  if (!p) return "-";
  return `${p.month}.${p.day}`;
}

// KST calendar-day key as "YYYY-MM-DD" (Asia/Seoul), or "" for empty/invalid
// input. Use for day-boundary grouping/filtering instead of toISOString()
// .slice(0, 10), which buckets against the UTC day (9 hours off from KST).
export function kstDayKey(dateStr: string): string {
  const p = getKstParts(dateStr);
  if (!p) return "";
  return `${p.year}-${p.month}-${p.day}`;
}


export function hasImage(url: string | undefined | null): boolean {
  if (!url || url.trim().length === 0) return false;
  const trimmed = url.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}
