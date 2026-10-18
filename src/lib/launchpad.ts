export const ASSETS = [
  { id: "stETH", label: "stETH", chain: "ethereum", apr: 3.2 },
  { id: "wstETH", label: "wstETH", chain: "ethereum", apr: 3.2 },
  { id: "rETH", label: "rETH", chain: "ethereum", apr: 3.0 },
  { id: "SOL", label: "Staked SOL", chain: "solana", apr: 7.0 },
  { id: "ATOM", label: "Staked ATOM", chain: "cosmos", apr: 15.0 },
] as const;

const YEAR_MS = 365 * 24 * 3600 * 1000;

export type PositionLike = { principal: number; deposited_at: string; withdrawn_at: string | null };

/** Yield a position has produced for the treasury up to `now` (stops at withdrawal or campaign end). */
export function accruedYield(p: PositionLike, apr: number, endsAt: string, now = Date.now()) {
  const start = new Date(p.deposited_at).getTime();
  const stop = Math.min(now, new Date(endsAt).getTime(), p.withdrawn_at ? new Date(p.withdrawn_at).getTime() : Infinity);
  return Math.max(0, stop - start) / YEAR_MS * (apr / 100) * p.principal;
}

export function isValidAddress(asset: string, w: string) {
  const a = ASSETS.find((x) => x.id === asset);
  if (a?.chain === "solana") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(w);
  if (a?.chain === "cosmos") return /^cosmos1[0-9a-z]{38}$/.test(w);
  return /^0x[a-fA-F0-9]{40}$/.test(w);
}

export function fmt(n: number, d = 4) {
  return n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: Math.min(d, 2) });
}
