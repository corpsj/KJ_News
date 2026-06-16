import { describe, it, expect } from "vitest";
import { formatDate, formatDateShort, kstDayKey } from "@/lib/utils";

// Published times are stored as UTC instants (new Date().toISOString()).
// The site serves a Korean audience, so displayed times must always be
// Korea Standard Time (Asia/Seoul, UTC+9) regardless of the server timezone.
// In production the Next.js server runs in UTC, so these must NOT depend on
// the runtime timezone. Run under `TZ=UTC` to prove timezone independence.
describe("formatDate / formatDateShort render in KST (Asia/Seoul)", () => {
  it("renders a UTC instant as KST (UTC+9)", () => {
    // 2026-06-10 00:00 UTC === 2026-06-10 09:00 KST
    expect(formatDate("2026-06-10T00:00:00Z")).toBe("2026.06.10 09:00");
  });

  it("rolls the date forward when KST crosses midnight", () => {
    // 2026-06-10 20:00 UTC === 2026-06-11 05:00 KST (next day)
    expect(formatDate("2026-06-10T20:00:00Z")).toBe("2026.06.11 05:00");
  });

  it("formatDateShort also uses KST", () => {
    // 2026-06-10 20:00 UTC === 06.11 in KST
    expect(formatDateShort("2026-06-10T20:00:00Z")).toBe("06.11");
  });

  it("handles midnight KST boundary (15:00 UTC -> 00:00 KST next day)", () => {
    // 2026-06-10 15:00 UTC === 2026-06-11 00:00 KST
    expect(formatDate("2026-06-10T15:00:00Z")).toBe("2026.06.11 00:00");
  });

  it("returns '-' for empty or invalid input", () => {
    expect(formatDate("")).toBe("-");
    expect(formatDate("not-a-date")).toBe("-");
    expect(formatDateShort("")).toBe("-");
    expect(formatDateShort("not-a-date")).toBe("-");
  });
});

describe("kstDayKey buckets by the KST calendar day", () => {
  it("uses the KST day, not the UTC day", () => {
    // 15:00 UTC === 00:00 KST next day -> belongs to 2026-06-11 in KST
    expect(kstDayKey("2026-06-10T15:00:00Z")).toBe("2026-06-11");
    // 14:59 UTC === 23:59 KST same day
    expect(kstDayKey("2026-06-10T14:59:00Z")).toBe("2026-06-10");
    // an article published 07:00 KST (22:00 UTC previous day) is "today" in KST
    expect(kstDayKey("2026-06-15T22:00:00Z")).toBe("2026-06-16");
  });

  it("returns '' for empty or invalid input", () => {
    expect(kstDayKey("")).toBe("");
    expect(kstDayKey("not-a-date")).toBe("");
  });
});
