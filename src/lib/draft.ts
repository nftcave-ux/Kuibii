import { useEffect, useRef, useState } from "react";

/** Saves a form snapshot in the browser after hydration; restore() is called once with any saved draft. */
export function useDraft<T>(key: string, value: T, restore: (saved: T) => void) {
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const restoreRef = useRef(restore);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const d = JSON.parse(raw) as { v: T; at: number };
        restoreRef.current(d.v);
        setSavedAt(d.at);
      }
    } catch { /* ignore corrupt drafts */ }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const at = Date.now();
      try { localStorage.setItem(key, JSON.stringify({ v: value, at })); setSavedAt(at); } catch { /* storage full */ }
    }, 600);
    return () => clearTimeout(t);
  }, [key, value, ready]);
  const clear = () => { localStorage.removeItem(key); setSavedAt(null); };
  return { savedAt, clear };
}

export type CreateCheck = {
  total_supply: number;
  distribution_mode: "fixed" | "tiers";
  fixed_amount: number;
  tiers: { name: string; amount: number }[];
  vesting: { enabled: boolean; tge_percent: number; cliff_months: number; duration_months: number };
};

/** Pre-flight warnings for the token creator. Returns human-readable problems (empty = OK). */
export function createWarnings(c: CreateCheck): string[] {
  const w: string[] = [];
  if (!(c.total_supply > 0)) w.push("Total supply must be greater than 0.");
  if (c.distribution_mode === "fixed" && c.fixed_amount > c.total_supply) w.push("Amount per recipient is larger than the total supply.");
  if (c.distribution_mode === "tiers") {
    if (c.tiers.some((t) => t.amount > c.total_supply)) w.push("A group's amount is larger than the total supply.");
    if (c.tiers.some((t) => !t.name.trim())) w.push("Every group needs a name.");
  }
  if (c.vesting.enabled) {
    if (c.vesting.tge_percent < 0 || c.vesting.tge_percent > 100) w.push("Unlock at start must be between 0% and 100%.");
    if (c.vesting.cliff_months > c.vesting.duration_months) w.push("The waiting period is longer than the whole unlock time.");
  }
  return w;
}
