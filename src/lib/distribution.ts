export type Tier = { name: string; amount: number };
export type Vesting = {
  enabled: boolean;
  tge_percent: number;
  cliff_months: number;
  duration_months: number;
};

export const CHAINS = [
  { id: "arbitrum", label: "Arbitrum" },
  { id: "avalanche", label: "Avalanche" },
  { id: "base", label: "Base" },
  { id: "ethereum", label: "Ethereum" },
  { id: "fuse", label: "Fuse", usable: true },
  { id: "polygon", label: "Polygon" },
] as const;

export function isValidWallet(chain: string, wallet: string) {
  const w = wallet.trim();
  if (chain === "solana") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(w);
  return /^0x[a-fA-F0-9]{40}$/.test(w);
}

export function allocationFor(
  c: { distribution_mode: string; fixed_amount: number; tiers: Tier[] },
  tier: string | null | undefined,
) {
  if (c.distribution_mode === "tiers") {
    const t = c.tiers.find((x) => x.name === tier) ?? c.tiers[0];
    return t ? Number(t.amount) : 0;
  }
  return Number(c.fixed_amount);
}

/** Returns [month, cumulativePercent] points for a vesting schedule. */
export function vestingSchedule(v: Vesting): { month: number; unlocked: number }[] {
  if (!v.enabled) return [{ month: 0, unlocked: 100 }];
  const pts = [{ month: 0, unlocked: v.tge_percent }];
  const rest = 100 - v.tge_percent;
  const dur = Math.max(1, v.duration_months);
  for (let m = 1; m <= dur; m++) {
    pts.push({ month: v.cliff_months + m, unlocked: +(v.tge_percent + (rest * m) / dur).toFixed(2) });
  }
  return pts;
}

/** Minimal CSV parser with quote support. First row = headers. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cur += ch;
  }
  row.push(cur);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0]!.map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
}

export function toCsv(rows: (string | number)[][]) {
  return rows
    .map((r) => r.map((c) => (/[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : String(c))).join(","))
    .join("\n");
}

export function downloadFile(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
