import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { accruedYield, isValidAddress } from "./launchpad";
import { tokenConfigSchema } from "./token-config-schema";
import type { TokenConfig } from "./token-utility";

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type LaunchRow = { id: string; name: string; symbol: string; description: string; asset: string; apr: number; yield_goal: number; token_pool: number; ends_at: string; created_at: string; token_config: Partial<TokenConfig> };
type PosRow = { id: string; wallet: string; principal: number; deposited_at: string; withdrawn_at: string | null; claimed_at: string | null; claimed_tokens: number };

function num<T extends object>(r: T, keys: (keyof T)[]) {
  const o = { ...r };
  keys.forEach((k) => ((o as Record<string, unknown>)[k as string] = Number(r[k])));
  return o;
}

async function loadLaunch(id: string) {
  const db = await admin();
  const { data: l } = await db.from("launches").select("*").eq("id", id).maybeSingle();
  if (!l) return null;
  const { data: ps } = await db.from("positions")
    .select("id, wallet, principal, deposited_at, withdrawn_at, claimed_at, claimed_tokens").eq("launch_id", id);
  const launch = num(l as LaunchRow, ["apr", "yield_goal", "token_pool"]);
  const positions = (ps ?? []).map((p) => num(p as PosRow, ["principal", "claimed_tokens"]));
  return { db, launch, positions };
}

function totals(launch: LaunchRow, positions: PosRow[]) {
  const now = Date.now();
  const active = positions.filter((p) => !p.withdrawn_at);
  return {
    backers: new Set(positions.map((p) => p.wallet.toLowerCase())).size,
    principal_locked: active.reduce((s, p) => s + p.principal, 0),
    active_principal: active.filter(() => now < new Date(launch.ends_at).getTime()).reduce((s, p) => s + p.principal, 0),
    treasury_yield: positions.reduce((s, p) => s + accruedYield(p, launch.apr, launch.ends_at, now), 0),
    as_of: now,
  };
}

export const createLaunch = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    name: z.string().trim().min(1).max(60),
    symbol: z.string().trim().min(1).max(11).regex(/^[A-Za-z0-9]+$/),
    description: z.string().trim().max(1000),
    asset: z.enum(["stETH", "wstETH", "rETH", "SOL", "ATOM"]),
    apr: z.number().min(0.1).max(50),
    yield_goal: z.number().min(0).max(1e12),
    token_pool: z.number().min(1).max(1e18),
    duration_days: z.number().int().min(1).max(730),
    token_config: tokenConfigSchema.optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { duration_days, ...rest } = data;
    const { data: row, error } = await db.from("launches").insert({
      ...rest, token_config: rest.token_config ?? {}, symbol: rest.symbol.toUpperCase(),
      ends_at: new Date(Date.now() + duration_days * 86400000).toISOString(),
    }).select("id").single();
    if (error) throw new Error("Could not create campaign");
    return { id: row.id };
  });

export const listLaunches = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data: ls } = await db.from("launches").select("*").order("created_at", { ascending: false }).limit(50);
  const { data: ps } = await db.from("positions").select("launch_id, principal, deposited_at, withdrawn_at, wallet, id, claimed_at, claimed_tokens")
    .in("launch_id", (ls ?? []).map((l) => l.id));
  return (ls ?? []).map((l) => {
    const launch = num(l as LaunchRow, ["apr", "yield_goal", "token_pool"]);
    const positions = (ps ?? []).filter((p) => p.launch_id === l.id).map((p) => num(p as PosRow, ["principal", "claimed_tokens"]));
    return { ...launch, ...totals(launch, positions) };
  });
});

export const getLaunch = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const r = await loadLaunch(data.id);
    if (!r) return null;
    return { ...r.launch, ...totals(r.launch, r.positions) };
  });

export const deposit = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    id: z.string().uuid(), wallet: z.string().trim().min(20).max(64), amount: z.number().positive().max(1e9),
  }).parse(d))
  .handler(async ({ data }) => {
    const r = await loadLaunch(data.id);
    if (!r) return { ok: false as const, error: "Campaign not found." };
    if (Date.now() > new Date(r.launch.ends_at).getTime()) return { ok: false as const, error: "This campaign has ended." };
    if (!isValidAddress(r.launch.asset, data.wallet)) return { ok: false as const, error: "That wallet address doesn't match this asset's network." };
    const key = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const { data: row, error } = await r.db.from("positions").insert({
      launch_id: data.id, wallet: data.wallet, principal: data.amount, key_hash: await sha256(key),
    }).select("id").single();
    if (error) return { ok: false as const, error: "Deposit failed." };
    return { ok: true as const, positionId: row.id, key };
  });

const keysSchema = z.object({
  id: z.string().uuid(),
  positions: z.array(z.object({ positionId: z.string().uuid(), key: z.string().min(20).max(100) })).max(100),
});

async function ownedPositions(launchId: string, creds: { positionId: string; key: string }[]) {
  const r = await loadLaunch(launchId);
  if (!r) throw new Error("Campaign not found");
  const ids = creds.map((c) => c.positionId);
  const { data: hashes } = await r.db.from("positions").select("id, key_hash").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const ok = new Set<string>();
  for (const c of creds) {
    const h = hashes?.find((x) => x.id === c.positionId);
    if (h && h.key_hash === (await sha256(c.key))) ok.add(c.positionId);
  }
  return { ...r, owned: r.positions.filter((p) => ok.has(p.id)) };
}

function tokensFor(launch: LaunchRow, all: PosRow[], p: PosRow) {
  const now = Date.now();
  const total = all.reduce((s, x) => s + accruedYield(x, launch.apr, launch.ends_at, now), 0);
  return total > 0 ? (accruedYield(p, launch.apr, launch.ends_at, now) / total) * launch.token_pool : 0;
}

export const getMyPositions = createServerFn({ method: "POST" })
  .inputValidator((d) => keysSchema.parse(d))
  .handler(async ({ data }) => {
    const { launch, positions, owned } = await ownedPositions(data.id, data.positions);
    return owned.map((p) => ({ ...p, est_tokens: tokensFor(launch, positions, p) }));
  });

export const withdraw = createServerFn({ method: "POST" })
  .inputValidator((d) => keysSchema.parse(d))
  .handler(async ({ data }) => {
    const { db, owned } = await ownedPositions(data.id, data.positions);
    const p = owned[0];
    if (!p) throw new Error("Position not found");
    if (!p.withdrawn_at) await db.from("positions").update({ withdrawn_at: new Date().toISOString() }).eq("id", p.id);
    return { ok: true, principal: p.principal };
  });

export const claim = createServerFn({ method: "POST" })
  .inputValidator((d) => keysSchema.parse(d))
  .handler(async ({ data }) => {
    const { db, launch, positions, owned } = await ownedPositions(data.id, data.positions);
    const p = owned[0];
    if (!p) throw new Error("Position not found");
    if (Date.now() < new Date(launch.ends_at).getTime()) return { ok: false as const, error: "Tokens unlock when the campaign ends." };
    if (p.claimed_at) return { ok: false as const, error: "Already claimed." };
    const amount = tokensFor(launch, positions, p);
    await db.from("positions").update({ claimed_at: new Date().toISOString(), claimed_tokens: amount }).eq("id", p.id);
    return { ok: true as const, amount };
  });
