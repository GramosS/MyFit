// Lokalt datum YYYY-MM-DD (inte UTC).
export function localYmd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Sista 7 dagarna inkl. idag.
// Äldst först (för graf).
export function last7DaysYmd(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    out.push(localYmd(dt));
  }
  return out;
}

// Sista 14 dagarna inkl. idag.
// Äldst först.
export function last14DaysYmd(): string[] {
  const out: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    out.push(localYmd(dt));
  }
  return out;
}

// Kort datumformat, t.ex. 23/03.
export function formatShortDate(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${d}/${m}`;
}

export function shortWeekdaySv(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const map = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];
  return map[dt.getDay()] ?? "";
}
