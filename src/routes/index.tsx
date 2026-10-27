import { Field, Help, useExperience } from "@/components/experience";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { createWarnings, useDraft } from "@/lib/draft";
import { toast } from "sonner";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createCampaign } from "@/lib/campaigns.functions";
import { CONDITIONS, USE_CASES, condDef, type Condition, type UseCase } from "@/lib/conditions";
import { CHAINS, vestingSchedule, type Tier, type Vesting } from "@/lib/distribution";
import { TokenUtilityEditor } from "@/components/token-utility-editor";
import { emptyConfig, type TokenConfig } from "@/lib/token-utility";
import { TokenBlueprintEditor } from "@/components/token-blueprint-editor";
import { TokenSimulator } from "@/components/token-simulator";
import { compatibleFeature, emptyBlueprint } from "@/lib/token-blueprint";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Create a token distribution — Kuibii" },
      { name: "description", content: "Set up a token, choose fixed, tiered or vesting rules, then import recipients by CSV or a public sign-up form." },
      { property: "og:title", content: "Create a token distribution — Kuibii" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Fixed, tiered and vesting token distributions with CSV import and public registration." },
    ],
  }),
  component: CreatePage,
});

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(n === "01");
  const triggerId = `creation-heading-${n}`;
  const panelId = `creation-panel-${n}`;
  return (
    <section className="border-t border-border">
      <h2>
        <Button
          id={triggerId}
          type="button"
          variant="ghost"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="h-auto w-full justify-start gap-4 whitespace-normal rounded-none px-0 py-5 text-left hover:bg-transparent hover:text-primary md:py-6"
        >
          <span className="shrink-0 font-mono text-xs text-primary">{n}</span>
          <span className="min-w-0 flex-1 text-lg font-bold">{title}</span>
          <ChevronDown aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        </Button>
      </h2>
      <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open} className="min-w-0 space-y-5 pb-8 md:pl-8">{children}</div>
    </section>
  );
}

function CreatePage() {
  const { text } = useExperience();
  const navigate = useNavigate();
  const create = useServerFn(createCampaign);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    name: "", symbol: "", decimals: 18, total_supply: 1_000_000, chain: "fuse" as (typeof CHAINS)[number]["id"],
    distribution_mode: "fixed" as "fixed" | "tiers", fixed_amount: 100,
  });
  const [tiers, setTiers] = useState<Tier[]>([{ name: "Core", amount: 1000 }, { name: "Community", amount: 100 }]);
  const [vesting, setVesting] = useState<Vesting>({ enabled: false, tge_percent: 20, cliff_months: 3, duration_months: 12 });
  const sched = vestingSchedule(vesting);
  const [conds, setConds] = useState<Condition[]>([]);
  const [util, setUtil] = useState<TokenConfig>(emptyConfig);
  const [pick, setPick] = useState(CONDITIONS[0]!.id);
  const draftValue = useMemo(() => ({ f, tiers, vesting, conds, util }), [f, tiers, vesting, conds, util]);
  const draft = useDraft("kuibii-draft-create", draftValue, (d) => {
    // A saved draft pointing at a locked network (only Fuse is usable for now) falls back to Fuse.
    if (d.f) setF({ ...d.f, chain: CHAINS.some((c) => c.id === d.f?.chain && "usable" in c) ? d.f.chain : "fuse" });
    if (d.tiers) setTiers(d.tiers); if (d.vesting) setVesting(d.vesting);
    if (d.conds) setConds(d.conds); if (d.util) setUtil(d.util);
  });
  const warnings = createWarnings({ ...f, tiers, vesting });
  function resetDraft() {
    draft.clear();
    setF({ name: "", symbol: "", decimals: 18, total_supply: 1_000_000, chain: "fuse", distribution_mode: "fixed", fixed_amount: 100 });
    setTiers([{ name: "Core", amount: 1000 }, { name: "Community", amount: 100 }]);
    setVesting({ enabled: false, tge_percent: 20, cliff_months: 3, duration_months: 12 });
    setConds([]); setUtil(emptyConfig);
  }
  const { kid } = useExperience();
  function applyCase(u: UseCase) {
    setF((x) => ({ ...x, distribution_mode: u.mode, fixed_amount: u.fixed_amount || x.fixed_amount }));
    if (u.tiers.length) setTiers(u.tiers);
    setVesting(u.vesting);
    setConds(u.conditions.map((c) => ({ ...c, params: { ...c.params } })));
    toast.success(`${kid ? u.kid : u.pro} template applied`);
  }
  const groups = [...new Set(CONDITIONS.map((c) => c.group))];

  async function submit() {
    if (!f.name || !f.symbol) { toast.error("Give your token a name and symbol."); return; }
    setBusy(true);
    try {
      const res = await create({ data: { ...f, tiers: f.distribution_mode === "tiers" ? tiers : [], vesting, conditions: conds, token_config: util } });
      localStorage.setItem(`mint-key-${res.id}`, res.key);
      draft.clear();
      navigate({ to: "/c/$id/manage", params: { id: res.id }, search: { key: res.key } });
    } catch {
      toast.error("Please check the fields and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <div className="py-12">
        <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] md:text-6xl">
          {text("Token Creation", "Create Magic Coins ✨")}<br /><span className="text-primary">{text("Conditional Distribution", "Decide who gets the loot.")}</span>
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          {text("Define the token, set the distribution rules, then add recipients from a CSV or a public registration link.", "Name your coins, choose how to share the treasure, then invite friends or add your guest list.")}
        </p>
      </div>

      <Section n="00" title={text("Use cases", "Party ideas 🎈")}>
        <Help topic="useCases">{text("Start from a template", "Pick a recipe")}</Help>
        <div className="grid gap-2 sm:grid-cols-2">
          {USE_CASES.map((u) => (
            <button type="button" key={u.id} onClick={() => applyCase(u)} className="rounded border border-border bg-card p-3 text-left transition hover:border-primary">
              <div className="font-bold">{text(u.pro, u.kid)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{u.blurb}</div>
              <div className="mt-2 font-mono text-[10px] text-primary">{u.conditions.length} {text("conditions", "rules")}{u.vesting.enabled ? text(" · vesting", " · timers") : ""}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section n="01" title={text("Token", "Magic Coins 🪙")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field topic="name" label={text("Name", "Coin name ✨")}>{(fieldId) => <Input id={fieldId} value={f.name} maxLength={60} placeholder="Harbor Credits" onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
          <Field topic="symbol" label={text("Symbol", "Coin nickname")}>{(fieldId) => <Input id={fieldId} value={f.symbol} maxLength={11} placeholder="HBR" className="font-mono uppercase" onChange={(e) => setF({ ...f, symbol: e.target.value.replace(/[^a-z0-9]/gi, "") })} />}</Field>
          <Field topic="supply" label={text("Total supply (fixed for now)", "Treasure chest size 🪙 (fixed)")}>{(fieldId) => <Input id={fieldId} type="number" value={f.total_supply} disabled readOnly aria-label="Total supply" className="cursor-not-allowed bg-muted font-mono opacity-80" />}</Field>
          <Field topic="decimals" label={text("Decimals (fixed for now)", "Tiny coin pieces (fixed)")}>{(fieldId) => <Input id={fieldId} type="number" value={f.decimals} disabled readOnly aria-label="Decimals" className="cursor-not-allowed bg-muted font-mono opacity-80" />}</Field>
        </div>
        <div>
          <Help topic="network"><Label>{text("Network", "Coin world 🌍")}</Label></Help>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHAINS.map((c) => {
              const usable = "usable" in c;
              return (
                <Button type="button" variant="outline" aria-pressed={f.chain === c.id} key={c.id} disabled={!usable}
                  title={usable ? undefined : text("Coming soon", "Coming soon")}
                  onClick={() => setF({ ...f, chain: c.id })}
                  className={`rounded border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${f.chain === c.id ? "border-primary bg-primary text-primary-foreground" : usable ? "border-success text-success hover:bg-success/10" : "border-border text-muted-foreground"}`}>
                  {c.label}
                </Button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{text("Only Fuse is usable for now — the other networks are coming soon.", "Only Fuse works for now — the other worlds are coming soon.")}</p>
        </div>
      </Section>

      <Section n="02" title={text("Conditional Distribution", "Loot Drops / Treat Sharing 🍬")}>
        <Help topic="allocation">{text("Distribution mode", "How will you share?")}</Help>
        <div className="inline-flex max-w-full flex-wrap rounded border border-border p-1">
          {(["fixed", "tiers"] as const).map((m) => (
            <Button type="button" variant="ghost" aria-pressed={f.distribution_mode === m} key={m} onClick={() => setF({ ...f, distribution_mode: m })}
              className={`rounded px-4 py-1.5 text-sm ${f.distribution_mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {m === "fixed" ? text("Same amount each", "Same treat for everyone") : text("Tiers / groups", "Different team treats")}
            </Button>
          ))}
        </div>
        {f.distribution_mode === "fixed" ? (
          <Field topic="amount" label={text("Tokens per recipient", "Coins per friend")} className="max-w-xs">{(fieldId) => <Input id={fieldId} type="number" value={f.fixed_amount} className="font-mono" onChange={(e) => setF({ ...f, fixed_amount: +e.target.value })} />}</Field>
        ) : (
          <div className="space-y-2">
            {tiers.map((t, i) => (
              <div key={i} className="flex items-end gap-2">
                <Field topic="tier" label={text("Tier name", "Team name")} className="min-w-0 flex-1">{(fieldId) => <Input id={fieldId} value={t.name} maxLength={40} placeholder="Tier name" onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />}</Field>
                <Field topic="tierAmount" label={text("Tier amount", "Team coins")} className="w-32 shrink-0">{(fieldId) => <Input id={fieldId} type="number" value={t.amount} className="font-mono" onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, amount: +e.target.value } : x)))} />}</Field>
                <Button variant="ghost" size="icon" onClick={() => setTiers(tiers.filter((_, j) => j !== i))} aria-label="Remove tier"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setTiers([...tiers, { name: "", amount: 0 }])}><Plus className="mr-1 h-4 w-4" />{text("Add tier", "Add a team +")}</Button>
            <p className="text-xs text-muted-foreground"><Help topic="tier">{text("Missing or unmatched tiers use the first group. Use a tier column in your CSV.", "Friends without a matching team join the first team. Put team names in the tier column.")}</Help></p>
          </div>
        )}
      </Section>

      <Section n="03" title={text("Vesting Schedule", "Unlock Timers ⏳")}>
        <div className="flex items-center gap-3">
          <Switch id="vesting-enabled" checked={vesting.enabled} onCheckedChange={(v) => setVesting({ ...vesting, enabled: v })} />
          <Help topic="vesting"><Label htmlFor="vesting-enabled">{text("Unlock tokens gradually", "Open the treasure a little at a time")}</Label></Help>
        </div>
        {vesting.enabled && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field topic="tge" label={text("Unlocked at launch (%)", "Treasure opened at start (%)")}>{(fieldId) => <Input id={fieldId} type="number" min={0} max={100} value={vesting.tge_percent} className="font-mono" onChange={(e) => setVesting({ ...vesting, tge_percent: Math.min(100, Math.max(0, +e.target.value)) })} />}</Field>
              <Field topic="cliff" label={text("Cliff (months)", "Waiting timer (months)")}>{(fieldId) => <Input id={fieldId} type="number" min={0} value={vesting.cliff_months} className="font-mono" onChange={(e) => setVesting({ ...vesting, cliff_months: Math.max(0, Math.floor(+e.target.value)) })} />}</Field>
              <Field topic="duration" label={text("Then unlock over (months)", "Monthly treasure drops")}>{(fieldId) => <Input id={fieldId} type="number" min={1} value={vesting.duration_months} className="font-mono" onChange={(e) => setVesting({ ...vesting, duration_months: Math.max(1, Math.floor(+e.target.value)) })} />}</Field>
            </div>
            <Help topic="schedule">{text("Cumulative unlock schedule", "Your treasure timetable")}</Help>
            <div className="flex h-28 items-end gap-1 rounded border border-border p-3" role="img" aria-label={sched.map((p) => `Month ${p.month}: ${p.unlocked}% unlocked`).join(", ")}>
              {sched.map((p) => (
                <div key={p.month} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div className="w-full rounded-sm bg-primary" style={{ height: `${p.unlocked * 0.7}px` }} title={`Month ${p.month}: ${p.unlocked}%`} />
                  <span className="font-mono text-[10px] text-muted-foreground">{p.month}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      <Section n="04" title={text("Eligibility conditions", "Who can get treats? 🎟️")}>
        <Help topic="conditions">{text(`${CONDITIONS.length} condition types — combine as many as you like`, `${CONDITIONS.length} kinds of rules — mix and match!`)}</Help>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Condition type" value={pick} onChange={(e) => setPick(e.target.value)} className="min-w-0 flex-1 rounded border border-input bg-background px-3 py-2 text-sm">
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {CONDITIONS.filter((c) => c.group === g).map((c) => <option key={c.id} value={c.id}>{text(c.pro, c.kid)}</option>)}
              </optgroup>
            ))}
          </select>
          <Button variant="outline" onClick={() => setConds([...conds, { type: pick, params: {} }])}><Plus className="mr-1 h-4 w-4" />{text("Add condition", "Add rule")}</Button>
        </div>
        {conds.length === 0 && <p className="text-sm text-muted-foreground">{text("No conditions — anyone with a valid wallet can register.", "No rules yet — everyone is invited!")}</p>}
        <div className="space-y-2">
          {conds.map((c, i) => {
            const d = condDef(c.type);
            if (!d) return null;
            return (
              <div key={i} className="rounded border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold">{text(d.pro, d.kid)} <span className="ml-1 font-mono text-[10px] font-normal text-primary">{d.check === "signup" ? text("auto-enforced", "checked at the door") : d.check === "bonus" ? text("applied to amounts", "extra treats") : text("verify before payout", "your checklist")}</span></div>
                  <Button variant="ghost" size="icon" aria-label="Remove condition" onClick={() => setConds(conds.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {d.params.map((p) => (
                    <Input key={p.key} aria-label={p.label} placeholder={p.placeholder ?? p.label} type={p.kind === "date" ? "datetime-local" : p.kind}
                      value={String(c.params[p.key] ?? "")}
                      onChange={(e) => setConds(conds.map((x, j) => (j === i ? { ...x, params: { ...x.params, [p.key]: p.kind === "number" ? +e.target.value : e.target.value } } : x)))} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section n="05" title={text("Format, nesting & cascade", "Treasure type & gift boxes 🪆")}>
        <TokenBlueprintEditor value={util.blueprint ?? emptyBlueprint()} chain="evm" onChange={(blueprint) => setUtil({ ...util, blueprint, features: Object.fromEntries(Object.entries(util.features).filter(([id]) => compatibleFeature(id, blueprint.format))) })} />
      </Section>

      <Section n="06" title={text("Token utility", "Coin superpowers 🦸")}>
        <TokenUtilityEditor value={util} onChange={setUtil} supply={f.total_supply} />
      </Section>

      <Section n="07" title={text("Simulation", "Pretend play 🔮")}>
        <TokenSimulator symbol={f.symbol || "TOKEN"} supply={f.total_supply} perRecipient={f.distribution_mode === "fixed" ? f.fixed_amount : (tiers[0]?.amount ?? 0)} vesting={vesting} conditionCount={conds.length} blueprint={util.blueprint} />
      </Section>

      {warnings.length > 0 && (
        <ul role="alert" className="mb-6 space-y-1 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {warnings.map((w) => <li key={w}>⚠ {w}</li>)}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
        <p className="text-xs text-muted-foreground">
          {draft.savedAt ? <>{text("Draft saved in this browser", "Saved on this device 💾")} · <button type="button" className="underline hover:text-primary" onClick={resetDraft}>{text("Start over", "Start fresh")}</button></> : null}
        </p>
        <Button size="lg" disabled={busy || warnings.length > 0} onClick={submit}>{busy ? text("Creating…", "Preparing your treasure…") : text("Create distribution →", "Create Magic Coins ✨")}</Button>
      </div>
    </div>
  );
}
