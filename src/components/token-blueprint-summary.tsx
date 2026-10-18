import { Help, useExperience } from "@/components/experience";
import { FORMATS, cascadeRequirements, type TokenBlueprint } from "@/lib/token-blueprint";

export function TokenBlueprintSummary({ blueprint: b }: { blueprint?: TokenBlueprint }) {
  const { text } = useExperience();
  if (!b) return null;
  const f = FORMATS.find((x) => x.id === b.format);
  return <div className="mt-5 space-y-5 border-t border-border pt-5">
    <div><Help topic="format"><h3 className="font-bold">{text("Token format", "Treasure type 🧩")}: {text(f?.name ?? b.format, f?.kid ?? b.format)}</h3></Help>
      {b.format === "fractional" && <p className="mt-2 break-words text-sm text-muted-foreground">{b.details.share_supply.toLocaleString()} shares per NFT · {b.details.source_nft || "Underlying NFT not yet specified"} · redemption: {b.details.redemption.replace(/_/g, " ")}</p>}
      {b.format === "erc4626" && <p className="mt-2 break-words text-sm text-muted-foreground">Vault asset: {b.details.underlying_asset || "Not yet specified"}</p>}
      {b.format === "erc1155" && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{b.details.item_ids}</p>}
    </div>
    {b.nesting.enabled && <div><Help topic="nesting"><h3 className="font-bold">{text("Nested NFT vault plan", "Gift boxes inside boxes 🪆")}</h3></Help>
      <ol className="mt-3 space-y-3">{b.nesting.layers.map((l) => <li key={l.id} className="border-l-2 border-primary pl-3 text-sm">
        <p className="break-words font-bold">{l.name} · {l.parent_id ? `inside ${b.nesting.layers.find((p) => p.id === l.parent_id)?.name}` : "root vault"}</p>
        <p className="break-words text-muted-foreground">{l.nft_count} NFTs × {l.amount_per_nft} {l.asset || l.kind} per NFT</p>
        <p className="break-words text-muted-foreground">Release: {l.release.mode}{l.release.date ? ` · not before ${l.release.date}` : ""}{l.release.hold_days ? ` · hold ${l.release.hold_days} days` : ""}</p>
        {l.release.condition && <p className="break-words text-muted-foreground">{l.release.condition} · {l.release.proof}: {l.release.verifier}</p>}
        {l.release.beneficiary && <p className="break-words text-muted-foreground">Recipient: {l.release.beneficiary}</p>}
      </li>)}</ol>
    </div>}
    {b.cascade.enabled && <div><Help topic="cascade"><h3 className="font-bold">{b.cascade.stages.length} {text("distinct-token cascade stages", "linked treasures 🔗")}</h3></Help>
      <div className="mt-3 max-h-64 overflow-y-auto" role="region" aria-label="Cascade stages" tabIndex={0}><ol className="space-y-2">{b.cascade.stages.map((s, i) => <li key={s.id} className="border-b border-border pb-2 text-sm">
        <p className="break-words font-bold">{i + 1}. {s.name} ({s.symbol}) · cap {s.supply.toLocaleString()} · {s.amount} per recipient</p>
        <p className="break-words text-muted-foreground">{i === 0 ? "Free / distributed" : `Requires holding ${cascadeRequirements(b, i).map((r) => `${r.amount} ${r.symbol}`).join(" + ")}`}{s.condition ? ` · ${s.condition}` : ""}</p>
      </li>)}</ol></div>
    </div>}
    {(b.nesting.enabled || b.cascade.enabled) && <p className="text-xs text-muted-foreground">{text("Specification only. NFT custody, proof checking and cascade claims are not executed here; registration does not verify these rules. Nested locks remain independent. Inheritance needs legal review.", "A treasure recipe, not real boxes or automatic prizes yet. Each box keeps its own rules; trusted helpers must check proofs.")}</p>}
  </div>;
}