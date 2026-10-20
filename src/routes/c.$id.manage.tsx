import { Help, useExperience, type HelpTopic } from "@/components/experience";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Trash2, Upload } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  deleteRecipient, getManageData, importRecipients, setRegistrationOpen, updateRecipient,
} from "@/lib/campaigns.functions";
import { bonusMultiplier, describe } from "@/lib/conditions";
import { utilDef } from "@/lib/token-utility";
import { TokenBlueprintSummary } from "@/components/token-blueprint-summary";
import { TokenSimulator } from "@/components/token-simulator";
import { allocationFor, CHAINS, downloadFile, parseCsv, toCsv, vestingSchedule } from "@/lib/distribution";

export const Route = createFileRoute("/c/$id/manage")({
  validateSearch: z.object({ key: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Manage distribution — Kuibii" },
      { name: "description", content: "Manage recipients, tiers and exports for your token distribution." },
      { property: "og:title", content: "Manage distribution — Kuibii" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Manage recipients, tiers and exports for your token distribution." },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: ManagePage,
});

function ManagePage() {
  const { text, kid } = useExperience();
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    const k = search.key ?? localStorage.getItem(`mint-key-${id}`);
    if (k) localStorage.setItem(`mint-key-${id}`, k);
    setKey(k);
  }, [id, search.key]);

  const qc = useQueryClient();
  const fetchData = useServerFn(getManageData);
  const doImport = useServerFn(importRecipients);
  const doUpdate = useServerFn(updateRecipient);
  const doDelete = useServerFn(deleteRecipient);
  const doToggle = useServerFn(setRegistrationOpen);
  const q = useQuery({
    queryKey: ["manage", id, key],
    queryFn: () => { if (!key) throw new Error("Missing management key"); return fetchData({ data: { id, key } }); },
    enabled: !!key,
    retry: false,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["manage", id] });

  const rows = useMemo(() => {
    if (!q.data) return [];
    return q.data.recipients.map((r, i) => ({ ...r, amount: +(allocationFor(q.data.campaign, r["tier"]) * bonusMultiplier(q.data.campaign.conditions, i)).toFixed(6) }));
  }, [q.data]);

  if (!key || q.isError) return <p className="p-10 text-center text-muted-foreground">This manage link is missing or invalid.</p>;
  if (!q.data) return <p className="p-10 text-center font-mono text-sm text-muted-foreground">loading…</p>;

  const c = q.data.campaign;
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const over = total > c.total_supply;
  const regUrl = `${window.location.origin}/c/${id}/register`;
  const manageUrl = `${window.location.origin}/c/${id}/manage?key=${key}`;
  const sched = vestingSchedule(c.vesting);

  async function onFile(file: File) {
    if (!key) return;
    const parsed = parseCsv(await file.text());
    const mapped = parsed.map((r) => ({
      wallet: r["wallet"] || r["address"] || r["wallet_address"] || "",
      name: r["name"] || undefined, email: r["email"] || undefined, tier: r["tier"] || r["group"] || undefined,
    })).filter((r) => r["wallet"]);
    if (!mapped.length) { toast.error("No rows with a wallet column found."); return; }
    const res = await doImport({ data: { id, key, rows: mapped } });
    toast.success(`Imported ${res.imported}${res.skipped ? `, skipped ${res.skipped} invalid or duplicate` : ""}.`);
    refresh();
  }

  function exportAllocations() {
    downloadFile(`${c.symbol}-allocations.csv`, toCsv([["wallet", "name", "email", "tier", "amount", "conditions_to_verify"], ...rows.map((r) => [r.wallet, r.name ?? "", r.email ?? "", r.tier ?? "", r.amount, c.conditions.map((x) => describe(x)).join(" | ")])]));
  }
  function exportSchedule() {
    const out: (string | number)[][] = [["wallet", "month", "unlocked_percent", "cumulative_amount"]];
    rows.forEach((r) => sched.forEach((p) => out.push([r.wallet, p.month, p.unlocked, +(r.amount * p.unlocked / 100).toFixed(6)])));
    downloadFile(`${c.symbol}-vesting.csv`, toCsv(out));
  }
  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-2 py-4">
        <h2 className="text-lg font-bold">{text("Manage distribution", "Coin Vault 🔐")}</h2>
        <Help topic="privateLink"><Button variant="ghost" size="sm" onClick={() => copy(manageUrl)}><Copy className="h-3 w-3" />{text("Copy private manage link", "Copy secret vault key")}</Button></Help>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8 pt-6">
        <div>
          <span className="font-mono text-xs text-primary"><Help topic="network">{CHAINS.find((x) => x.id === c.chain)?.label}</Help> · <Help topic="decimals">{c.decimals} {text("decimals", "coin-piece digits")}</Help></span>
          <h1 className="mt-1 text-4xl font-bold"><Help topic="name">{c.name}</Help> <span className="font-mono text-muted-foreground"><Help topic="symbol">${c.symbol}</Help></span></h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <Help topic={c.distribution_mode === "fixed" ? "amount" : "tier"}>{c.distribution_mode === "fixed" ? `${c.fixed_amount.toLocaleString()} ${text("each", "per friend")}` : c.tiers.map((t) => `${t.name}: ${t.amount.toLocaleString()}`).join(" · ")}</Help>
            {c.vesting.enabled && <><Help topic="tge">{c.vesting.tge_percent}% {text("at launch", "at start")}</Help> · <Help topic="cliff">{c.vesting.cliff_months}mo {text("cliff", "wait")}</Help> · <Help topic="duration">{c.vesting.duration_months}mo {text("unlock", "treasure drops")}</Help></>}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 font-mono sm:gap-6">
          <Stat topic="recipients" label={text("recipients", "friends")} value={rows.length.toLocaleString()} />
          <Stat topic="allocated" label={text("allocated", "promised coins")} value={total.toLocaleString()} warn={over} />
          <Stat topic="supply" label={text("supply", "treasure size")} value={c.total_supply.toLocaleString()} />
        </div>
      </div>
      {c.conditions.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
          <Help topic="conditions"><span className="font-mono text-muted-foreground">{text("conditions", "rules")}</span></Help>
          {c.conditions.map((x, i) => <span key={i} className="rounded border border-border px-2 py-1">{describe(x, kid)}</span>)}
        </div>
      )}
      {(() => {
        const u = c.token_config ?? {};
        const ids = [...Object.keys(u.features ?? {}), ...Object.keys(u.perks ?? {})];
        const alloc = Object.entries(u.allocation ?? {}).filter(([, v]) => v > 0);
        if (!ids.length && !alloc.length && !u.branding?.description) return null;
        return (
          <div className="mt-6 space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Help topic="features"><span className="font-mono text-muted-foreground">{text("utility", "superpowers")}</span></Help>
              {ids.map((id) => { const d = utilDef(id); return d ? <span key={id} className="rounded border border-primary/50 px-2 py-1">{text(d.pro, d.kid)}</span> : null; })}
              <Button variant="ghost" size="sm" onClick={() => downloadFile(`${c.symbol}-token-spec.json`, JSON.stringify({ name: c.name, symbol: c.symbol, decimals: c.decimals, total_supply: c.total_supply, chain: c.chain, ...u }, null, 2))}>{text("Download token spec", "Save coin recipe")}</Button>
            </div>
            {alloc.length > 0 && <div className="flex flex-wrap items-center gap-2"><Help topic="tokenomics"><span className="font-mono text-muted-foreground">{text("supply split", "pie slices")}</span></Help>{alloc.map(([k, v]) => <span key={k} className="font-mono">{k} {v}%</span>)}</div>}
            {u.branding?.description && <p className="max-w-2xl text-sm text-muted-foreground">{u.branding.description}</p>}
          </div>
        );
      })()}
      <TokenBlueprintSummary blueprint={c.token_config?.blueprint} />
      <details className="mt-6 rounded border border-border p-4">
        <summary className="cursor-pointer font-bold">{text("Simulation (what-if)", "Pretend play 🔮")}</summary>
        <div className="mt-4"><TokenSimulator symbol={c.symbol} supply={Number(c.total_supply)} perRecipient={allocationFor(c, null)} vesting={c.vesting} conditionCount={c.conditions.length} blueprint={c.token_config?.blueprint} /></div>
      </details>
      {over && <p className="mt-4 text-sm text-destructive">Allocations exceed the total supply.</p>}

      <div className="grid gap-4 py-8 md:grid-cols-2">
        <div className="rounded border border-border bg-card p-5">
          <h3 className="font-bold"><Help topic="csv">{text("Import from CSV", "Add a guest list 📋")}</Help></h3>
          <p className="mt-1 text-sm text-muted-foreground">Columns: <Help topic="wallet"><span className="font-mono">wallet</span></Help> (required), <Help topic="person">name</Help>, <Help topic="email">email</Help>, <Help topic="tier">tier</Help>.</p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Upload className="h-4 w-4" />{text("Choose CSV", "Choose guest list")}
            <input aria-label="Choose CSV" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
          </label>
        </div>
        <div className="rounded border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold"><Help topic="publicLink">{text("Public sign-up form", "Invite friends 💌")}</Help></h3>
            <div className="flex items-center gap-2 text-sm">
              {c.registration_open ? "Open" : "Closed"}
              <Switch aria-label="Registration open" checked={c.registration_open} onCheckedChange={async (v) => { await doToggle({ data: { id, key, open: v } }); refresh(); }} />
              <Help topic="registration" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-muted px-3 py-2 font-mono text-xs">{regUrl}</code>
            <Button variant="outline" size="icon" onClick={() => copy(regUrl)} aria-label="Copy link"><Copy className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <h2 className="text-lg font-bold">{text("Recipients", "Your friends 🧑‍🤝‍🧑")}</h2>
        <div className="flex flex-wrap gap-2">
          <Help topic="export"><Button variant="outline" size="sm" disabled={!rows.length} onClick={exportAllocations}><Download className="mr-1 h-4 w-4" />{text("Allocations", "Sharing list")}</Button></Help>
          {c.vesting.enabled && <Help topic="scheduleExport"><Button variant="outline" size="sm" disabled={!rows.length} onClick={exportSchedule}><Download className="mr-1 h-4 w-4" />{text("Vesting Schedule", "Unlock Timers ⏳")}</Button></Help>}
        </div>
      </div>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left font-mono text-xs uppercase text-muted-foreground">
            <tr><th className="p-3"><Help topic="wallet">{text("Wallet", "Mailbox")}</Help></th><th className="p-3"><Help topic="person">Name</Help></th><th className="p-3"><Help topic="email">Email</Help></th><th className="p-3"><Help topic="source">{text("Source", "Joined from")}</Help></th>{c.distribution_mode === "tiers" && <th className="p-3"><Help topic="tier">{text("Tier", "Team")}</Help></th>}<th className="p-3 text-right"><Help topic="amount">{text("Amount", "Coins")}</Help></th><th /></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No recipients yet — import a CSV or share the sign-up link.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{r.wallet.slice(0, 8)}…{r.wallet.slice(-6)}</td>
                <td className="p-3">{r.name}</td>
                <td className="p-3 text-muted-foreground">{r.email}</td>
                <td className="p-3 font-mono text-xs">{r.source}</td>
                {c.distribution_mode === "tiers" && (
                  <td className="p-3">
                    <select aria-label={`Tier for ${r.name || r.wallet}`} className="rounded border border-input bg-background px-2 py-1" value={r.tier ?? c.tiers[0]?.name ?? ""}
                      onChange={async (e) => { await doUpdate({ data: { id, key, recipientId: r.id, tier: e.target.value } }); refresh(); }}>
                      {c.tiers.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </td>
                )}
                <td className="p-3 text-right font-mono">{r.amount.toLocaleString()}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" aria-label="Remove" onClick={async () => { await doDelete({ data: { id, key, recipientId: r.id } }); refresh(); }}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ topic, label, value, warn }: { topic: HelpTopic; label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div className={`text-2xl ${warn ? "text-destructive" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground"><Help topic={topic}>{label}</Help></div>
    </div>
  );
}
