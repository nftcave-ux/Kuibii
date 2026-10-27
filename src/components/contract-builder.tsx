import { useMemo, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useExperience } from "@/components/experience";
import { useDraft } from "@/lib/draft";

/** [pro label, kid label, description pro, description kid] */
export type Opt = { id: string; pro: string; kid: string; dpro: string; dkid: string; params?: { key: string; pro: string; kid: string; placeholder?: string }[] };
export type OptGroup = { id: string; pro: string; kid: string; multi: boolean; options: Opt[] };

export const TRIGGERS: Opt[] = [
  { id: "time", pro: "Date / time", kid: "On a day", dpro: "Execute at a timestamp.", dkid: "Happens on a chosen day.", params: [{ key: "at", pro: "When (UTC)", kid: "When", placeholder: "2027-01-01 12:00" }] },
  { id: "block", pro: "Block number", kid: "Block number", dpro: "Execute once the chain reaches a block height.", dkid: "Happens when the chain counts to this number.", params: [{ key: "block", pro: "Block", kid: "Number" }] },
  { id: "price", pro: "Price threshold", kid: "Price reaches", dpro: "Oracle price crosses a value.", dkid: "Happens when the price gets to a number.", params: [{ key: "asset", pro: "Asset", kid: "Coin" }, { key: "op", pro: "Above / below", kid: "Above or below", placeholder: "above" }, { key: "value", pro: "Price", kid: "Price" }] },
  { id: "drop", pro: "Item drop / mint", kid: "New item appears", dpro: "A collection mints or drops an item.", dkid: "Happens when a new item comes out.", params: [{ key: "collection", pro: "Collection", kid: "Collection" }] },
  { id: "balance", pro: "Wallet balance", kid: "Wallet has enough", dpro: "A wallet holds at least an amount.", dkid: "Happens when a wallet has enough coins.", params: [{ key: "wallet", pro: "Wallet", kid: "Wallet" }, { key: "min", pro: "Minimum", kid: "At least" }] },
  { id: "inactivity", pro: "Inactivity (dead-man switch)", kid: "Not logged in for a while", dpro: "Backup fires if the owner does not log in / sign for N days.", dkid: "If you don't check in for some days, the backup happens.", params: [{ key: "days", pro: "Days", kid: "Days" }, { key: "backup", pro: "Backup wallet", kid: "Backup friend" }] },
  { id: "multisig", pro: "Multisig approval", kid: "Friends approve", dpro: "M of N signers approve.", dkid: "Enough friends say yes.", params: [{ key: "m", pro: "M", kid: "Yes needed" }, { key: "signers", pro: "Signers", kid: "Friends" }] },
  { id: "oracle", pro: "Oracle / attestation", kid: "Someone proves it", dpro: "Any provable fact via oracle or attestation.", dkid: "A trusted helper proves something happened.", params: [{ key: "fact", pro: "Condition", kid: "What must happen" }, { key: "source", pro: "Proof source", kid: "Who proves it" }] },
  { id: "custom", pro: "Custom condition", kid: "My own rule", dpro: "Anything else that can be proven.", dkid: "Any rule you invent.", params: [{ key: "rule", pro: "Rule", kid: "Rule" }] },
];

type Cond = { uid: string; trigger: string; values: Record<string, string> };

export function ContractBuilder({ kind, groups, extraFields }: { kind: string; groups: OptGroup[]; extraFields: { key: string; pro: string; kid: string; placeholder?: string }[] }) {
  const { text } = useExperience();
  const [picked, setPicked] = useState<Record<string, string[]>>(() => Object.fromEntries(groups.map((g) => [g.id, [g.options[0]!.id]])));
  const [params, setParams] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<Record<string, string>>({});
  const [conds, setConds] = useState<Cond[]>([]);
  const [logic, setLogic] = useState<"all" | "any">("all");
  const [priv, setPriv] = useState(false);
  const draftValue = useMemo(() => ({ picked, params, fields, conds, logic, priv }), [picked, params, fields, conds, logic, priv]);
  useDraft(`kuibii-draft-${kind}`, draftValue, (d) => {
    if (d.picked) setPicked(d.picked); if (d.params) setParams(d.params); if (d.fields) setFields(d.fields);
    if (d.conds) setConds(d.conds); if (d.logic) setLogic(d.logic); if (typeof d.priv === "boolean") setPriv(d.priv);
  });

  const toggle = (g: OptGroup, id: string) => setPicked((p) => {
    const cur = p[g.id] ?? [];
    if (!g.multi) return { ...p, [g.id]: [id] };
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    return { ...p, [g.id]: next.length ? next : cur };
  });

  const spec = useMemo(() => ({
    kind, private: priv, fields,
    choices: Object.fromEntries(groups.map((g) => [g.id, (picked[g.id] ?? []).map((id) => ({ id, params: Object.fromEntries(Object.entries(params).filter(([k]) => k.startsWith(`${id}.`)).map(([k, v]) => [k.slice(id.length + 1), v])) }))])),
    conditions: { logic, items: conds.map(({ trigger, values }) => ({ trigger, values })) },
  }), [kind, priv, fields, groups, picked, params, logic, conds]);

  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `kuibii-${kind}.json`; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-10">
    <p className="rounded border border-primary/40 bg-primary/5 p-3 text-sm text-muted-foreground">{text("Planner only: this designs the contract and exports a spec. Nothing is signed, sent or deployed yet.", "This is a plan! Nothing is sent for real yet.")}</p>

    <section className="grid gap-4 sm:grid-cols-2">
      {extraFields.map((f) => <div key={f.key}><Label htmlFor={`f-${f.key}`}>{text(f.pro, f.kid)}</Label>
        <Input id={`f-${f.key}`} placeholder={f.placeholder} value={fields[f.key] ?? ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} /></div>)}
    </section>

    {groups.map((g, gi) => <section key={g.id}>
      <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">{String(gi + 1).padStart(2, "0")} · {text(g.pro, g.kid)} {g.multi && <span className="text-muted-foreground">({text("pick any", "pick as many as you like")})</span>}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {g.options.map((o) => { const on = (picked[g.id] ?? []).includes(o.id); return <div key={o.id} className={`rounded border p-3 transition-colors ${on ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
          <button type="button" className="w-full text-left" aria-pressed={on} onClick={() => toggle(g, o.id)}>
            <div className="font-bold">{text(o.pro, o.kid)}</div><div className="mt-1 text-xs text-muted-foreground">{text(o.dpro, o.dkid)}</div>
          </button>
          {on && o.params && <div className="mt-3 grid gap-2">{o.params.map((p) => { const k = `${o.id}.${p.key}`; return <Input key={k} aria-label={text(p.pro, p.kid)} placeholder={p.placeholder ?? text(p.pro, p.kid)} value={params[k] ?? ""} onChange={(e) => setParams({ ...params, [k]: e.target.value })} className="h-8 text-xs" />; })}</div>}
        </div>; })}
      </div>
    </section>)}

    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-primary">{String(groups.length + 1).padStart(2, "0")} · {text("Conditions & triggers", "Rules that make it happen")}</h2>
        <div className="flex items-center gap-2 text-sm">
          <Button size="sm" variant={logic === "all" ? "default" : "outline"} onClick={() => setLogic("all")}>{text("All must pass", "All rules")}</Button>
          <Button size="sm" variant={logic === "any" ? "default" : "outline"} onClick={() => setLogic("any")}>{text("Any one passes", "Any rule")}</Button>
        </div>
      </div>
      <div className="space-y-3">
        {conds.map((c) => { const def = TRIGGERS.find((t) => t.id === c.trigger)!; return <div key={c.uid} className="rounded border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label={text("Trigger", "Rule")} className="h-9 rounded border border-input bg-background px-2 text-sm" value={c.trigger} onChange={(e) => setConds(conds.map((x) => x.uid === c.uid ? { ...x, trigger: e.target.value, values: {} } : x))}>
              {TRIGGERS.map((t) => <option key={t.id} value={t.id}>{text(t.pro, t.kid)}</option>)}
            </select>
            <span className="flex-1 text-xs text-muted-foreground">{text(def.dpro, def.dkid)}</span>
            <Button size="icon" variant="ghost" aria-label={text("Remove", "Remove")} onClick={() => setConds(conds.filter((x) => x.uid !== c.uid))}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">{def.params?.map((p) => <Input key={p.key} aria-label={text(p.pro, p.kid)} placeholder={p.placeholder ?? text(p.pro, p.kid)} className="h-8 text-xs" value={c.values[p.key] ?? ""} onChange={(e) => setConds(conds.map((x) => x.uid === c.uid ? { ...x, values: { ...x.values, [p.key]: e.target.value } } : x))} />)}</div>
        </div>; })}
        <Button variant="outline" size="sm" onClick={() => setConds([...conds, { uid: crypto.randomUUID(), trigger: "time", values: {} }])}><Plus className="mr-1 h-4 w-4" />{text("Add condition", "Add a rule")}</Button>
      </div>
    </section>

    <section className="flex flex-wrap items-center justify-between gap-4 rounded border border-border bg-card p-4">
      <div className="flex items-center gap-3"><Switch id={`priv-${kind}`} checked={priv} onCheckedChange={setPriv} />
        <Label htmlFor={`priv-${kind}`}>{text("Private (hide amounts & parties with privacy layer)", "Secret mode 🤫 (others can't see)")}</Label></div>
      <Button onClick={download}><Download className="mr-1 h-4 w-4" />{text("Download spec", "Save my plan")}</Button>
    </section>
  </div>;
}
