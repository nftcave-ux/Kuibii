import { Help, useExperience } from "@/components/experience";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ALLOCATION_BUCKETS, FEATURES, PERKS, allocationTotal, type TokenConfig, type UtilityDef } from "@/lib/token-utility";

type Props = { value: TokenConfig; onChange: (v: TokenConfig) => void; supply?: number };

function Toggles({ defs, picked, onChange }: { defs: UtilityDef[]; picked: TokenConfig["features"]; onChange: (v: TokenConfig["features"]) => void }) {
  const { text, kid } = useExperience();
  const groups = [...new Set(defs.map((d) => d.group))];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g}>
          <div className="mb-2 font-mono text-[10px] uppercase text-muted-foreground">{g}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {defs.filter((d) => d.group === g).map((d) => {
              const on = d.id in picked;
              return (
                <div key={d.id} className={`rounded border p-3 transition ${on ? "border-primary bg-card" : "border-border"}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-pressed={on} className="w-full text-left text-sm font-bold"
                        onClick={() => { const n = { ...picked }; if (on) delete n[d.id]; else n[d.id] = {}; onChange(n); }}>
                        <span className={`mr-2 inline-block h-3 w-3 rounded-sm border ${on ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                        {text(d.pro, d.kid)}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{kid ? d.kidInfo : d.info}</TooltipContent>
                  </Tooltip>
                  <p className="mt-1 text-xs text-muted-foreground">{kid ? d.kidInfo : d.info}</p>
                  {on && d.params.length > 0 && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {d.params.map((p) => (
                        <Input key={p.key} aria-label={`${d.pro} ${p.label}`} placeholder={p.placeholder ?? p.label} type={p.kind}
                          value={String(picked[d.id]?.[p.key] ?? "")} className="h-8 font-mono text-xs"
                          onChange={(e) => onChange({ ...picked, [d.id]: { ...picked[d.id], [p.key]: p.kind === "number" ? +e.target.value : e.target.value } })} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TokenUtilityEditor({ value, onChange, supply }: Props) {
  const { text } = useExperience();
  const total = allocationTotal(value.allocation);
  const set = <K extends keyof TokenConfig>(k: K, v: TokenConfig[K]) => onChange({ ...value, [k]: v });
  const b = value.branding;
  return (
    <div className="space-y-10">
      <div>
        <Help topic="features"><h3 className="font-bold">{text(`Token features (${Object.keys(value.features).length} on)`, `Coin superpowers 🦸 (${Object.keys(value.features).length} on)`)}</h3></Help>
        <div className="mt-3"><Toggles defs={FEATURES} picked={value.features} onChange={(v) => set("features", v)} /></div>
      </div>
      <div>
        <Help topic="perks"><h3 className="font-bold">{text(`Utility & perks (${Object.keys(value.perks).length} on)`, `What can coins do? 🎮 (${Object.keys(value.perks).length} on)`)}</h3></Help>
        <div className="mt-3"><Toggles defs={PERKS} picked={value.perks} onChange={(v) => set("perks", v)} /></div>
      </div>
      <div>
        <Help topic="tokenomics"><h3 className="font-bold">{text("Supply split", "Slice the treasure pie 🥧")}</h3></Help>
        <div className="mt-3 flex h-3 overflow-hidden rounded bg-muted">
          {ALLOCATION_BUCKETS.map((k, i) => value.allocation[k.id] ? <div key={k.id} title={k.pro} style={{ width: `${Math.min(100, value.allocation[k.id] ?? 0)}%`, opacity: 1 - i * 0.1 }} className="h-full border-r border-background bg-primary" /> : null)}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {ALLOCATION_BUCKETS.map((k) => (
            <label key={k.id} className="text-xs">
              <span className="text-muted-foreground">{text(k.pro, k.kid)}</span>
              <Input type="number" min={0} max={100} className="mt-1 h-8 font-mono" value={value.allocation[k.id] ?? 0}
                onChange={(e) => set("allocation", { ...value.allocation, [k.id]: Math.max(0, +e.target.value) })} />
              {supply !== undefined && <span className="font-mono text-[10px] text-muted-foreground">{Math.round(supply * (value.allocation[k.id] ?? 0) / 100).toLocaleString()}</span>}
            </label>
          ))}
        </div>
        <p className={`mt-2 font-mono text-xs ${total === 100 ? "text-primary" : "text-destructive"}`}>{total}% {total === 100 ? "✓" : text("— should add up to 100%", "— the pie needs to be 100%!")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-xs"><span className="text-muted-foreground">{text("Yearly inflation %", "New coins per year %")}</span>
            <Input type="number" min={0} className="mt-1 font-mono" value={value.economics.inflation_pct} onChange={(e) => set("economics", { ...value.economics, inflation_pct: Math.max(0, +e.target.value) })} /></label>
          <label className="text-xs"><span className="text-muted-foreground">{text("Initial price (USD)", "Starting price 💵")}</span>
            <Input type="number" min={0} step="any" className="mt-1 font-mono" value={value.economics.initial_price} onChange={(e) => set("economics", { ...value.economics, initial_price: Math.max(0, +e.target.value) })} /></label>
          <label className="text-xs"><span className="text-muted-foreground">{text("Burn schedule", "Shredding plan 🔥")}</span>
            <Input maxLength={200} className="mt-1" placeholder="1% quarterly" value={value.economics.burn_schedule} onChange={(e) => set("economics", { ...value.economics, burn_schedule: e.target.value })} /></label>
        </div>
        {supply !== undefined && value.economics.initial_price > 0 && <p className="mt-2 font-mono text-xs text-muted-foreground">{text("Implied fully diluted value", "Whole treasure worth")}: ${(supply * value.economics.initial_price).toLocaleString()}</p>}
      </div>
      <div>
        <Help topic="branding"><h3 className="font-bold">{text("Branding & links", "Decorate your coin 🎨")}</h3></Help>
        <div className="mt-3 grid gap-3 sm:grid-cols-[64px_1fr]">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
            {b.logo_url ? <img src={b.logo_url} alt="Token logo preview" className="h-full w-full object-cover" /> : <span className="font-mono text-xs text-muted-foreground">logo</span>}
          </div>
          <Input aria-label="Logo URL" placeholder={text("Logo image URL (https://…)", "Picture link for your coin")} maxLength={300} value={b.logo_url} onChange={(e) => set("branding", { ...b, logo_url: e.target.value })} />
        </div>
        <Textarea aria-label="Description" className="mt-3" maxLength={1000} placeholder={text("What is this token for?", "What are your coins for?")} value={b.description} onChange={(e) => set("branding", { ...b, description: e.target.value })} />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(["website", "whitepaper", "twitter", "discord", "telegram"] as const).map((k) => (
            <Input key={k} aria-label={k} maxLength={300} placeholder={k.charAt(0).toUpperCase() + k.slice(1)} value={b[k]} onChange={(e) => set("branding", { ...b, [k]: e.target.value })} />
          ))}
        </div>
      </div>
    </div>
  );
}
