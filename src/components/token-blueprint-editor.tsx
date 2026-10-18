import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, Help, useExperience } from "@/components/experience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FORMATS, cascadeRequirements, makeCascade, makeLayer, type NftLayer, type TokenBlueprint, type TokenFormat } from "@/lib/token-blueprint";

const selectStyle = "w-full min-w-0 rounded border border-input bg-background px-3 py-2 text-sm";
export function TokenFormatPicker({ format, onChange, chain }: { format: TokenFormat; onChange: (format: TokenFormat) => void; chain?: string | undefined }) {
  const { text } = useExperience();
  const formats = chain ? FORMATS.filter((f) => chain === "solana" ? ["spl", "metaplex"].includes(f.id) : !["spl", "metaplex"].includes(f.id)) : FORMATS;
  return <div className="space-y-2">
    <Help topic="format"><h3 className="font-bold">{text("Token format", "What kind of treasure? 🧩")}</h3></Help>
    <Select value={format} onValueChange={(v) => { const found = FORMATS.find((f) => f.id === v); if (found) onChange(found.id); }}>
      <SelectTrigger aria-label="Token format" className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>{formats.map((f) => <SelectItem key={f.id} value={f.id}>{text(f.name, f.kid)}</SelectItem>)}</SelectContent>
    </Select>
    <p className="text-xs text-muted-foreground">{FORMATS.find((f) => f.id === format)?.info}</p>
  </div>;
}

export function TokenBlueprintEditor({ value: b, onChange, chain, showFormat = true }: { value: TokenBlueprint; onChange: (b: TokenBlueprint) => void; chain?: string | undefined; showFormat?: boolean }) {
  const { text } = useExperience();
  const [count, setCount] = useState(100);
  const [cap, setCap] = useState(1000);
  const [stageIndex, setStageIndex] = useState(0);
  const [layerIndex, setLayerIndex] = useState(0);
  const layers = b.nesting.layers;
  const layer = layers[layerIndex];
  const stage = b.cascade.stages[stageIndex];
  const setLayer = (next: NftLayer) => onChange({ ...b, nesting: { ...b.nesting, layers: layers.map((x, i) => i === layerIndex ? next : x) } });
  const addLayer = (parent = "") => {
    const next = makeLayer(crypto.randomUUID(), parent);
    onChange({ ...b, nesting: { enabled: true, layers: [...layers, { ...next, name: `NFT vault ${layers.length + 1}` }] } });
    setLayerIndex(layers.length);
  };
  const removeLayer = () => {
    if (!layer) return;
    const removed = new Set([layer.id]);
    for (const x of layers) if (removed.has(x.parent_id)) removed.add(x.id);
    onChange({ ...b, nesting: { ...b.nesting, layers: layers.filter((x) => !removed.has(x.id)) } });
    setLayerIndex(0);
  };
  return <div className="space-y-8">
    {showFormat && <TokenFormatPicker format={b.format} chain={chain} onChange={(format) => onChange({ ...b, format })} />}
    {b.format === "fractional" && <div className="grid gap-3 sm:grid-cols-2">
      <Field topic="fractional" label={text("Underlying NFT / vault reference", "Which collectible are we sharing?")}>{(id) => <Input id={id} maxLength={300} placeholder="Contract + token ID or planned vault" value={b.details.source_nft} onChange={(e) => onChange({ ...b, details: { ...b.details, source_nft: e.target.value } })} />}</Field>
      <Field topic="fractional" label="Shares per NFT">{(id) => <Input id={id} type="number" min={1} value={b.details.share_supply} onChange={(e) => onChange({ ...b, details: { ...b.details, share_supply: +e.target.value } })} />}</Field>
      <Field topic="fractional" label="NFT redemption policy">{(id) => <select id={id} className={selectStyle} value={b.details.redemption} onChange={(e) => onChange({ ...b, details: { ...b.details, redemption: e.target.value as TokenBlueprint["details"]["redemption"] } })}><option value="all_shares">Collect all shares</option><option value="buyout">Buyout with holder approval</option><option value="none">No redemption</option></select>}</Field>
    </div>}
    {b.format === "erc4626" && <Field topic="vaultAsset" label="Underlying vault asset">{(id) => <Input id={id} maxLength={300} value={b.details.underlying_asset} onChange={(e) => onChange({ ...b, details: { ...b.details, underlying_asset: e.target.value } })} />}</Field>}
    {b.format === "erc1155" && <Field topic="itemIds" label="Item IDs & supply per item">{(id) => <Textarea id={id} maxLength={1000} placeholder="1: 100 unique puzzle pieces; 2: 1000 tickets" value={b.details.item_ids} onChange={(e) => onChange({ ...b, details: { ...b.details, item_ids: e.target.value } })} />}</Field>}
    {b.format === "soulbound" && <p className="text-sm text-muted-foreground">{text("Non-transferable by design. Gift vaults below are separate transferable NFT containers, not this badge.", "This badge stays with its owner. Gift boxes below are separate collectibles.")}</p>}

    <section className="space-y-4 border-t border-border pt-6">
      <div className="flex items-center justify-between gap-3"><Help topic="nesting"><h3 className="font-bold">{text("Nested NFT vaults", "Matryoshka gift boxes 🪆")}</h3></Help><Switch aria-label="Enable nested NFT vaults" checked={b.nesting.enabled} onCheckedChange={(enabled) => { if (enabled && !layers.length) addLayer(); else onChange({ ...b, nesting: { ...b.nesting, enabled } }); }} /></div>
      <p className="text-xs text-muted-foreground">{text("Gifts, inheritance, study milestones or colleague handovers. Plans only; proof verification and custody require a deployed contract. Nest as deeply as needed, within the saved plan's 1,000-container budget.", "Put coins inside gift boxes, and boxes inside more boxes! A plan for birthdays, learning goals or passing a gift along. Real boxes need a builder first.")}</p>
      {b.nesting.enabled && <>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={layers.length >= 1000} onClick={() => addLayer()}><Plus className="h-4 w-4" />{text("Add root vault", "New gift box")}</Button>
          <Button variant="outline" size="sm" disabled={!layer || layers.length >= 1000} onClick={() => { if (layer) addLayer(layer.id); }}><Plus className="h-4 w-4" />{text("Nest inside selected vault", "Box inside this box")}</Button>
          <Button variant="ghost" size="icon" disabled={!layer} aria-label="Remove vault and descendants" title="Remove vault and descendants" onClick={removeLayer}><Trash2 className="h-4 w-4" /></Button>
        </div>
        <Field topic="nesting" label="Edit NFT vault">{(id) => <select id={id} className={selectStyle} value={layerIndex} onChange={(e) => setLayerIndex(+e.target.value)}>{layers.map((x, i) => <option key={x.id} value={i}>{i + 1}. {x.name}{x.parent_id ? ` · inside ${layers.find((p) => p.id === x.parent_id)?.name}` : " · root"}</option>)}</select>}</Field>
        {layer && <div className="space-y-4" key={layer.id}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field topic="nesting" label="Vault name">{(id) => <Input id={id} maxLength={100} value={layer.name} onChange={(e) => setLayer({ ...layer, name: e.target.value })} />}</Field>
            <Field topic="nftCount" label="Number of NFTs">{(id) => <Input id={id} type="number" min={1} step={1} value={layer.nft_count} onChange={(e) => setLayer({ ...layer, nft_count: +e.target.value })} />}</Field>
            <Field topic="nesting" label="Contents format">{(id) => <select id={id} className={selectStyle} value={layer.kind} onChange={(e) => setLayer({ ...layer, kind: e.target.value as NftLayer["kind"] })}><option value="token">Fungible tokens</option><option value="nft">NFTs</option><option value="fraction">NFT fractions</option></select>}</Field>
            <Field topic="vaultContents" label="Contained asset / collection">{(id) => <Input id={id} maxLength={300} placeholder="Token symbol, contract or collection" value={layer.asset} onChange={(e) => setLayer({ ...layer, asset: e.target.value })} />}</Field>
            <Field topic="vaultContents" label="Amount per NFT">{(id) => <Input id={id} type="number" min={0} step={layer.kind === "nft" ? 1 : "any"} value={layer.amount_per_nft} onChange={(e) => setLayer({ ...layer, amount_per_nft: +e.target.value })} />}</Field>
            <Field topic="beneficiary" label="Recipient / successor">{(id) => <Input id={id} maxLength={300} placeholder="Wallet or planned beneficiary" value={layer.release.beneficiary} onChange={(e) => setLayer({ ...layer, release: { ...layer.release, beneficiary: e.target.value } })} />}</Field>
          </div>
          <p className="font-mono text-xs text-primary"><Help topic="vaultContents">{layer.nft_count} NFTs × {layer.amount_per_nft} {layer.asset || "units"} = {(layer.nft_count * layer.amount_per_nft).toLocaleString()} units in this layer</Help></p>
          <Field topic="releaseRule" label="Release rule">{(id) => <select id={id} className={selectStyle} value={layer.release.mode} onChange={(e) => setLayer({ ...layer, release: { ...layer.release, mode: e.target.value as NftLayer["release"]["mode"] } })}><option value="immediate">On request · no extra condition</option><option value="time">Time only</option><option value="condition">Provable condition only</option><option value="both">Time AND provable condition</option></select>}</Field>
          {(layer.release.mode === "time" || layer.release.mode === "both") && <div className="grid gap-3 sm:grid-cols-2">
            <Field topic="releaseRule" label="Not before (UTC)">{(id) => <Input id={id} type="datetime-local" value={layer.release.date.replace(/Z$/, "")} onChange={(e) => setLayer({ ...layer, release: { ...layer.release, date: e.target.value ? `${e.target.value}Z` : "" } })} />}</Field>
            <Field topic="releaseRule" label="Minimum holding time (days)">{(id) => <Input id={id} type="number" min={0} value={layer.release.hold_days} onChange={(e) => setLayer({ ...layer, release: { ...layer.release, hold_days: +e.target.value } })} />}</Field>
          </div>}
          {(layer.release.mode === "condition" || layer.release.mode === "both") && <div className="space-y-3">
            <Field topic="proof" label="Provable condition">{(id) => <Textarea id={id} maxLength={1000} placeholder="Graduation attestation, signed inheritance certificate, colleague approval…" value={layer.release.condition} onChange={(e) => setLayer({ ...layer, release: { ...layer.release, condition: e.target.value } })} />}</Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field topic="proof" label="Proof method">{(id) => <select id={id} className={selectStyle} value={layer.release.proof} onChange={(e) => setLayer({ ...layer, release: { ...layer.release, proof: e.target.value as NftLayer["release"]["proof"] } })}><option value="onchain">On-chain ownership / event</option><option value="attestation">Signed attestation / document</option><option value="multisig">Multiple trusted signers</option><option value="oracle">External oracle</option><option value="manual">Organizer review</option></select>}</Field>
              <Field topic="proof" label="Verifier / oracle / signers">{(id) => <Input id={id} maxLength={300} value={layer.release.verifier} placeholder="Who or what checks the proof?" onChange={(e) => setLayer({ ...layer, release: { ...layer.release, verifier: e.target.value } })} />}</Field>
            </div>
          </div>}
          <p className="text-xs text-muted-foreground">{text("Each child vault has its own rule. Opening a parent does not bypass a child's lock. Inheritance plans are not legal wills.", "Opening a big box doesn't skip the little box's timer or rules. Inheritance still needs trusted legal help.")}</p>
        </div>}
      </>}
    </section>

    <section className="space-y-4 border-t border-border pt-6">
      <div className="flex items-center justify-between gap-3"><Help topic="cascade"><h3 className="font-bold">{text("Cascade distribution", "Unlock the next treasure 🔗")}</h3></Help><Switch aria-label="Enable cascade distribution" checked={b.cascade.enabled} onCheckedChange={(enabled) => onChange({ ...b, cascade: { ...b.cascade, enabled, stages: enabled && !b.cascade.stages.length ? makeCascade(count, cap) : b.cascade.stages } })} /></div>
      <p className="text-xs text-muted-foreground">{text("Distinct limited-supply tokens. Stage 1 is free/distributed; every later stage requires holding the previous token. Rules are a payout checklist, not checked by registration or deployed here.", "Get the first treasure free, then show it to unlock the second. Show the second for the third! These are planned rules, not real treasure drops yet.")}</p>
      {b.cascade.enabled && <>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field topic="cascade" label="Number of distinct tokens">{(id) => <Input id={id} type="number" min={2} max={1000} value={count} onChange={(e) => setCount(+e.target.value)} />}</Field>
          <Field topic="stageSupply" label="Default limited supply per token">{(id) => <Input id={id} type="number" min={1} value={cap} onChange={(e) => setCap(+e.target.value)} />}</Field>
        </div>
        <Button variant="outline" size="sm" disabled={!Number.isInteger(count) || count < 2 || count > 1000 || !Number.isInteger(cap) || cap < 1} onClick={() => { onChange({ ...b, cascade: { ...b.cascade, stages: makeCascade(count, cap) } }); setStageIndex(0); }}>{text("Generate / replace stages", "Make the treasure chain")}</Button>
        <div className="flex items-center gap-3"><Switch aria-label="Also require first token" checked={b.cascade.require_first} onCheckedChange={(require_first) => onChange({ ...b, cascade: { ...b.cascade, require_first } })} /><Help topic="cascade">{text("Also require 1 first-stage token at every later stage", "Keep the first treasure as well")}</Help></div>
        <Field topic="cascade" label="Edit cascade stage">{(id) => <select id={id} className={selectStyle} value={stageIndex} onChange={(e) => setStageIndex(+e.target.value)}>{b.cascade.stages.map((s, i) => <option key={s.id} value={i}>{i + 1}. {s.name} · {s.symbol}</option>)}</select>}</Field>
        {stage && <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">{([
            ["name", "Stage token name", "cascade", "text"], ["symbol", "Stage token symbol", "cascade", "text"], ["supply", "Stage limited supply", "stageSupply", "number"], ["amount", "Stage tokens per recipient", "stageSupply", "number"],
            ...(stageIndex > 0 ? [["required_amount", "Previous-token holding required", "cascade", "number"]] : []),
          ] as const).map(([key, label, topic, type]) => <Field key={key} topic={topic as "cascade" | "stageSupply"} label={label}>{(id) => <Input id={id} type={type} min={1} maxLength={key === "symbol" ? 20 : 100} value={stage[key as keyof typeof stage]} onChange={(e) => onChange({ ...b, cascade: { ...b.cascade, stages: b.cascade.stages.map((s, i) => i === stageIndex ? { ...s, [key]: type === "number" ? +e.target.value : e.target.value } : s) } })} />}</Field>)}</div>
          <Field topic="proof" label="Additional stage condition (optional)">{(id) => <Textarea id={id} maxLength={1000} value={stage.condition} placeholder="Any extra provable condition for the organizer to verify" onChange={(e) => onChange({ ...b, cascade: { ...b.cascade, stages: b.cascade.stages.map((s, i) => i === stageIndex ? { ...s, condition: e.target.value } : s) } })} />}</Field>
          <p className="font-mono text-xs text-primary">{stageIndex === 0 ? "Stage 1 · free / distributed" : `Stage ${stageIndex + 1} · hold ${cascadeRequirements(b, stageIndex).map((r) => `${r.amount} ${r.symbol}`).join(" + ")}`}</p>
          <p className="text-xs text-muted-foreground">{b.cascade.stages.length} distinct tokens · {text("Current ownership is required at each claim; tokens are not burned. Caps are per token, independent of the main supply and backer pool.", "Keep the earlier treasure when you collect the next. Each treasure has its own limit.")}</p>
        </div>}
      </>}
    </section>
  </div>;
}