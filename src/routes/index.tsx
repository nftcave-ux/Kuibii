import { Field, Help, useExperience } from "@/components/experience";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createCampaign } from "@/lib/campaigns.functions";
import { CONDITIONS, USE_CASES, condDef, type Condition, type UseCase } from "@/lib/conditions";
import { CHAINS, vestingSchedule, type Tier, type Vesting } from "@/lib/distribution";
import { TokenUtilityEditor } from "@/components/token-utility-editor";
import { emptyConfig, type TokenConfig } from "@/lib/token-utility";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Create a token distribution — Mint Press" },
      { name: "description", content: "Set up a token, choose fixed, tiered or vesting rules, then import recipients by CSV or a public sign-up form." },
      { property: "og:title", content: "Create a token distribution — Mint Press" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Fixed, tiered and vesting token distributions with CSV import and public registration." },
    ],
  }),
  component: CreatePage,
});

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-border py-10 md:grid-cols-[180px_1fr]">
      <div>
        <div className="font-mono text-xs text-primary">{n}</div>
        <h2 className="mt-1 text-lg font-bold">{title}</h2>
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

function CreatePage() {
  const { text } = useExperience();
  const navigate = useNavigate();
  const create = useServerFn(createCampaign);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    name: "", symbol: "", decimals: 18, total_supply: 1_000_000, chain: "base" as (typeof CHAINS)[number]["id"],
    distribution_mode: "fixed" as "fixed" | "tiers", fixed_amount: 100,
  });
  const [tiers, setTiers] = useState<Tier[]>([{ name: "Core", amount: 1000 }, { name: "Community", amount: 100 }]);
  const [vesting, setVesting] = useState<Vesting>({ enabled: false, tge_percent: 20, cliff_months: 3, duration_months: 12 });
  const sched = vestingSchedule(vesting);
  const [conds, setConds] = useState<Condition[]>([]);
  const [util, setUtil] = useState<TokenConfig>(emptyConfig);
  const [pick, setPick] = useState(CONDITIONS[0]!.id);
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
          <Field topic="supply" label={text("Total supply", "Treasure chest size 🪙")}>{(fieldId) => <Input id={fieldId} type="number" value={f.total_supply} className="font-mono" onChange={(e) => setF({ ...f, total_supply: +e.target.value })} />}</Field>
          <Field topic="decimals" label={text("Decimals", "Tiny coin pieces")}>{(fieldId) => <Input id={fieldId} type="number" min={0} max={18} value={f.decimals} className="font-mono" onChange={(e) => setF({ ...f, decimals: +e.target.value })} />}</Field>
        </div>
        <div>
          <Help topic="network"><Label>{text("Network", "Coin world 🌍")}</Label></Help>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHAINS.map((c) => (
               <Button type="button" variant="outline" aria-pressed={f.chain === c.id} key={c.id} onClick={() => setF({ ...f, chain: c.id })}
                className={`rounded border px-3 py-1.5 text-sm transition ${f.chain === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
                {c.label}
               </Button>
            ))}
          </div>
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

      <Section n="05" title={text("Token utility", "Coin superpowers 🦸")}>
        <TokenUtilityEditor value={util} onChange={setUtil} supply={f.total_supply} />
      </Section>

      <div className="flex justify-end border-t border-border pt-8">
        <Button size="lg" disabled={busy} onClick={submit}>{busy ? text("Creating…", "Preparing your treasure…") : text("Create distribution →", "Create Magic Coins ✨")}</Button>
      </div>
    </div>
  );
}
