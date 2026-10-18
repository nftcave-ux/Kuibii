import { z } from "zod";

export const FORMATS = [
  { id: "erc20", name: "ERC-20", kid: "Everyday coins 🪙", info: "Interchangeable, divisible tokens.", nft: false },
  { id: "erc721", name: "NFT · ERC-721", kid: "Unique collectibles 🖼️", info: "One unique token per collectible; whole units only.", nft: true },
  { id: "fractional", name: "Fractional NFT", kid: "Collectible puzzle shares 🧩", info: "An NFT held in a vault, represented by divisible shares. No single universal fractional-NFT standard.", nft: false },
  { id: "erc1155", name: "Multi-token · ERC-1155", kid: "Mixed collectible sets 🎒", info: "Multiple item IDs, each with its own whole-unit supply.", nft: true },
  { id: "soulbound", name: "Soulbound NFT", kid: "Your own badge 🏅", info: "A non-transferable identity or achievement collectible.", nft: true },
  { id: "erc4626", name: "Vault shares · ERC-4626", kid: "Vault tickets 🎟️", info: "Fungible shares in an underlying-asset vault; not a yield guarantee.", nft: false },
  { id: "spl", name: "Solana · SPL", kid: "Solana coins 🪙", info: "Fungible tokens on Solana, not an Ethereum standard.", nft: false },
  { id: "metaplex", name: "Solana NFT · Metaplex", kid: "Solana collectibles 🖼️", info: "Unique Solana collectibles, not ERC-721.", nft: true },
] as const;
export type TokenFormat = typeof FORMATS[number]["id"];
export const formatSchema = z.enum(["erc20", "erc721", "fractional", "erc1155", "soulbound", "erc4626", "spl", "metaplex"]);
export const isWholeFormat = (format: TokenFormat) => FORMATS.find((f) => f.id === format)?.nft ?? false;
export const compatibleFeature = (id: string, format: TokenFormat) => {
  if (format === "spl" || format === "metaplex") return !["permit", "votes", "flash_mint", "upgradeable"].includes(id);
  if (isWholeFormat(format)) return !["deflation", "reflection", "liquidity_fee", "tax", "permit", "votes", "flash_mint"].includes(id);
  return !["royalties", "metadata", "reveal", "composable", "recovery"].includes(id);
};

const releaseSchema = z.object({
  mode: z.enum(["immediate", "time", "condition", "both"]),
  date: z.string().max(40), hold_days: z.number().finite().min(0).max(365000),
  condition: z.string().max(1000), proof: z.enum(["onchain", "attestation", "multisig", "oracle", "manual"]),
  verifier: z.string().max(300), beneficiary: z.string().max(300),
});
const layerSchema = z.object({
  id: z.string().min(1).max(80), parent_id: z.string().max(80), name: z.string().trim().min(1).max(100),
  nft_count: z.number().int().positive().max(1e12), asset: z.string().max(300),
  kind: z.enum(["token", "nft", "fraction"]), amount_per_nft: z.number().positive().max(1e18), release: releaseSchema,
});
const stageSchema = z.object({
  id: z.string().min(1).max(80), name: z.string().trim().min(1).max(100), symbol: z.string().trim().min(1).max(20),
  supply: z.number().int().positive().max(1e18), amount: z.number().positive().max(1e18),
  required_amount: z.number().positive().max(1e18), condition: z.string().max(1000),
});
export const blueprintSchema = z.object({
  format: formatSchema,
  details: z.object({ source_nft: z.string().max(300), share_supply: z.number().int().positive().max(1e18), redemption: z.enum(["all_shares", "buyout", "none"]), underlying_asset: z.string().max(300), item_ids: z.string().max(1000) }),
  nesting: z.object({ enabled: z.boolean(), layers: z.array(layerSchema).max(1000) }),
  cascade: z.object({ enabled: z.boolean(), require_first: z.boolean(), stages: z.array(stageSchema).max(1000) }),
}).superRefine((b, ctx) => {
  const fail = (path: (string | number)[], message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
  if (b.nesting.enabled && !b.nesting.layers.length) fail(["nesting", "layers"], "Add an NFT container.");
  const seen = new Set<string>();
  for (const [i, layer] of b.nesting.layers.entries()) {
    if (seen.has(layer.id) || (layer.parent_id && !seen.has(layer.parent_id))) fail(["nesting", "layers", i], "Containers must reference an earlier parent, without cycles.");
    seen.add(layer.id);
    if ((layer.kind === "nft") && !Number.isInteger(layer.amount_per_nft)) fail(["nesting", "layers", i, "amount_per_nft"], "NFT quantities must be whole numbers.");
    if (b.nesting.enabled) {
      if ((layer.release.mode === "time" || layer.release.mode === "both") && !layer.release.date && !layer.release.hold_days) fail(["nesting", "layers", i, "release"], "Set a release date or holding period.");
      if (layer.release.date && !Number.isFinite(Date.parse(layer.release.date))) fail(["nesting", "layers", i, "release", "date"], "Use a valid release date.");
      if ((layer.release.mode === "condition" || layer.release.mode === "both") && (!layer.release.condition.trim() || !layer.release.verifier.trim())) fail(["nesting", "layers", i, "release"], "Describe the condition and who or what verifies it.");
    }
  }
  if (b.cascade.enabled && b.cascade.stages.length < 2) fail(["cascade", "stages"], "A cascade needs at least two tokens.");
  const symbols = new Set<string>();
  for (const [i, stage] of b.cascade.stages.entries()) {
    if (symbols.has(stage.symbol.toUpperCase())) fail(["cascade", "stages", i, "symbol"], "Each cascade token needs a distinct symbol.");
    symbols.add(stage.symbol.toUpperCase());
    if (stage.amount > stage.supply) fail(["cascade", "stages", i, "amount"], "A distribution cannot exceed its token supply.");
    const previous = b.cascade.stages[i - 1];
    if (previous && stage.required_amount > previous.supply) fail(["cascade", "stages", i, "required_amount"], "Required holdings exceed the previous token's supply.");
  }
});
export type TokenBlueprint = z.infer<typeof blueprintSchema>;
export type NftLayer = TokenBlueprint["nesting"]["layers"][number];
export const emptyBlueprint = (): TokenBlueprint => ({
  format: "erc20", details: { source_nft: "", share_supply: 1000, redemption: "all_shares", underlying_asset: "", item_ids: "" },
  nesting: { enabled: false, layers: [] }, cascade: { enabled: false, require_first: false, stages: [] },
});
export const makeLayer = (id: string, parent_id = ""): NftLayer => ({
  id, parent_id, name: "Gift vault", nft_count: 10, kind: "token", asset: "", amount_per_nft: 100,
  release: { mode: "immediate", date: "", hold_days: 0, condition: "", proof: "manual", verifier: "", beneficiary: "" },
});
export function makeCascade(count: number, supply = 1000): TokenBlueprint["cascade"]["stages"] {
  return Array.from({ length: Math.min(1000, Math.max(2, Math.floor(count))) }, (_, i) => ({ id: `stage-${i + 1}`, name: `Token ${i + 1}`, symbol: `STEP${i + 1}`, supply, amount: 1, required_amount: 1, condition: "" }));
}
export function cascadeRequirements(b: TokenBlueprint, index: number) {
  if (!b.cascade.enabled || index === 0) return [];
  const previous = b.cascade.stages[index - 1];
  const stage = b.cascade.stages[index];
  if (!previous || !stage) return [];
  const out = [{ symbol: previous.symbol, amount: stage.required_amount }];
  const first = b.cascade.stages[0];
  if (b.cascade.require_first && index > 1 && first) out.push({ symbol: first.symbol, amount: 1 });
  return out;
}