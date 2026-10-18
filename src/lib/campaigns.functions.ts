import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isValidWallet, type Tier, type Vesting } from "./distribution";
import type { TokenConfig } from "./token-utility";
import { tokenConfigSchema } from "./token-config-schema";

const tierSchema = z.object({ name: z.string().trim().min(1).max(40), amount: z.number().min(0).max(1e18) });
const vestingSchema = z.object({
  enabled: z.boolean(),
  tge_percent: z.number().min(0).max(100),
  cliff_months: z.number().int().min(0).max(120),
  duration_months: z.number().int().min(0).max(240),
});

const conditionSchema = z.object({
  type: z.string().max(40),
  params: z.record(z.string().max(40), z.union([z.string().max(200), z.number()])),
});
type Cond = z.infer<typeof conditionSchema>;

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  symbol: z.string().trim().min(1).max(11).regex(/^[A-Za-z0-9]+$/),
  decimals: z.number().int().min(0).max(18),
  total_supply: z.number().min(1).max(1e18),
  chain: z.enum(["ethereum", "base", "polygon", "arbitrum", "solana"]),
  distribution_mode: z.enum(["fixed", "tiers"]),
  fixed_amount: z.number().min(0).max(1e18),
  tiers: z.array(tierSchema).max(20),
  vesting: vestingSchema,
  conditions: z.array(conditionSchema).max(40).default([]),
  token_config: tokenConfigSchema.optional(),
});

const idKey = z.object({ id: z.string().uuid(), key: z.string().min(20).max(100) });

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function verify(id: string, key: string) {
  const db = await admin();
  const { data } = await db.from("campaigns").select("*").eq("id", id).maybeSingle();
  if (!data || data.manage_key_hash !== (await sha256(key))) throw new Error("Invalid manage link");
  return { db, campaign: data };
}

function shape(c: Record<string, unknown>) {
  const { manage_key_hash: _h, ...rest } = c;
  return {
    ...rest,
    total_supply: Number(c["total_supply"]),
    fixed_amount: Number(c["fixed_amount"]),
    tiers: c["tiers"] as Tier[],
    vesting: c["vesting"] as Vesting,
    conditions: (c["conditions"] ?? []) as Cond[],
    token_config: (c["token_config"] ?? {}) as Partial<TokenConfig>,
  } as {
    conditions: Cond[];
    token_config: Partial<TokenConfig>;
    id: string; name: string; symbol: string; decimals: number; total_supply: number; chain: string;
    distribution_mode: string; fixed_amount: number; tiers: Tier[]; vesting: Vesting;
    registration_open: boolean; created_at: string;
  };
}

export const createCampaign = createServerFn({ method: "POST" })
  .inputValidator((d) => createSchema.parse(d))
  .handler(async ({ data }) => {
    const key = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const db = await admin();
    const { data: row, error } = await db
      .from("campaigns")
      .insert({ ...data, token_config: data.token_config ?? {}, symbol: data.symbol.toUpperCase(), manage_key_hash: await sha256(key) })
      .select("id")
      .single();
    if (error) throw new Error("Could not create token");
    return { id: row.id, key };
  });

export const getPublicCampaign = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: c } = await db
      .from("campaigns")
      .select("id, name, symbol, chain, registration_open, conditions")
      .eq("id", data.id)
      .maybeSingle();
    if (!c) return null;
    const conds = ((c.conditions ?? []) as Cond[]);
    return {
      ...c,
      needsCode: conds.some((x) => x.type === "invite_code"),
      conditions: conds.map((x) => (x.type === "invite_code" ? { type: x.type, params: {} } : x)),
    };
  });

export const registerRecipient = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(100),
      email: z.string().trim().email().max(255),
      wallet: z.string().trim().min(20).max(64),
      code: z.string().trim().max(100).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: c } = await db.from("campaigns").select("chain, registration_open, conditions").eq("id", data.id).maybeSingle();
    if (!c) return { ok: false as const, error: "This distribution doesn't exist." };
    if (!c.registration_open) return { ok: false as const, error: "Registration is closed." };
    const now = Date.now();
    for (const cond of (c.conditions ?? []) as Cond[]) {
      const p = cond.params;
      if (cond.type === "opens_at" && p["date"] && now < Date.parse(String(p["date"]))) return { ok: false as const, error: `Registration opens ${new Date(String(p["date"])).toLocaleString()}.` };
      if (cond.type === "closes_at" && p["date"] && now > Date.parse(String(p["date"]))) return { ok: false as const, error: "Registration has closed." };
      if (cond.type === "email_domain" && p["domain"] && !data.email.toLowerCase().endsWith("@" + String(p["domain"]).toLowerCase().replace(/^@/, ""))) return { ok: false as const, error: `Use an @${String(p["domain"]).replace(/^@/, "")} email.` };
      if (cond.type === "invite_code" && p["code"] && (data.code ?? "").toUpperCase() !== String(p["code"]).toUpperCase()) return { ok: false as const, error: "Wrong invite code." };
      if (cond.type === "max_recipients" && Number(p["n"]) > 0) {
        const { count } = await db.from("recipients").select("id", { count: "exact", head: true }).eq("campaign_id", data.id);
        if ((count ?? 0) >= Number(p["n"])) return { ok: false as const, error: "All spots are taken." };
      }
    }
    if (!isValidWallet(c.chain, data.wallet)) return { ok: false as const, error: "That wallet address doesn't look right for this network." };
    const { error } = await db.from("recipients").insert({
      campaign_id: data.id, name: data.name, email: data.email, wallet: data.wallet, source: "form",
    });
    if (error) return { ok: false as const, error: error.code === "23505" ? "This wallet is already registered." : "Could not register." };
    return { ok: true as const };
  });

export const getManageData = createServerFn({ method: "POST" })
  .inputValidator((d) => idKey.parse(d))
  .handler(async ({ data }) => {
    const { db, campaign } = await verify(data.id, data.key);
    const { data: recipients } = await db
      .from("recipients")
      .select("id, name, email, wallet, tier, source, created_at")
      .eq("campaign_id", data.id)
      .order("created_at", { ascending: true });
    return { campaign: shape(campaign), recipients: recipients ?? [] };
  });

export const importRecipients = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    idKey.extend({
      rows: z.array(z.object({
        name: z.string().max(100).optional(),
        email: z.string().max(255).optional(),
        wallet: z.string().max(64),
        tier: z.string().max(40).optional(),
      })).max(5000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db, campaign } = await verify(data.id, data.key);
    const valid = data.rows.filter((r) => isValidWallet(campaign.chain, r.wallet));
    const seen = new Set<string>();
    const unique = valid.filter((r) => (seen.has(r.wallet.toLowerCase()) ? false : (seen.add(r.wallet.toLowerCase()), true)));
    if (unique.length) {
      const { error } = await db.from("recipients").upsert(
        unique.map((r) => ({
          campaign_id: data.id, wallet: r.wallet.trim(), name: r.name || null, email: r.email || null,
          tier: r.tier || null, source: "csv",
        })),
        { onConflict: "campaign_id,wallet", ignoreDuplicates: true },
      );
      if (error) throw new Error("Import failed");
    }
    return { imported: unique.length, skipped: data.rows.length - unique.length };
  });

export const updateRecipient = createServerFn({ method: "POST" })
  .inputValidator((d) => idKey.extend({ recipientId: z.string().uuid(), tier: z.string().max(40).nullable() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await verify(data.id, data.key);
    await db.from("recipients").update({ tier: data.tier }).eq("id", data.recipientId).eq("campaign_id", data.id);
    return { ok: true };
  });

export const deleteRecipient = createServerFn({ method: "POST" })
  .inputValidator((d) => idKey.extend({ recipientId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await verify(data.id, data.key);
    await db.from("recipients").delete().eq("id", data.recipientId).eq("campaign_id", data.id);
    return { ok: true };
  });

export const setRegistrationOpen = createServerFn({ method: "POST" })
  .inputValidator((d) => idKey.extend({ open: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await verify(data.id, data.key);
    await db.from("campaigns").update({ registration_open: data.open }).eq("id", data.id);
    return { ok: true };
  });
