import { Field, Help, useExperience, type HelpTopic } from "@/components/experience";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claim, deposit, getLaunch, getMyPositions, withdraw } from "@/lib/launchpad.functions";
import { accruedYield, fmt } from "@/lib/launchpad";
import { TokenUtilitySummary } from "@/components/token-utility-summary";

const launchQuery = (id: string) => queryOptions({ queryKey: ["launch", id], queryFn: () => getLaunch({ data: { id } }), refetchInterval: 15000 });

export const Route = createFileRoute("/launchpad/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(launchQuery(params.id)),
  head: ({ loaderData }) => {
    const t = loaderData ? `Back ${loaderData.name} with ${loaderData.asset} yield` : "Launchpad campaign";
    const d = loaderData ? `Stake ${loaderData.asset}, keep your principal, earn $${loaderData.symbol}.` : "No-loss staking campaign.";
    return { meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  errorComponent: () => <p className="p-10 text-center">This campaign didn't load.</p>,
  notFoundComponent: () => <p className="p-10 text-center">Not found.</p>,
  component: PortalPage,
});

type Cred = { positionId: string; key: string };
const storeKey = (id: string) => `lp-positions-${id}`;

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

function PortalPage() {
  const { text } = useExperience();
  const { id } = Route.useParams();
  const { data: l } = useSuspenseQuery(launchQuery(id));
  const qc = useQueryClient();
  const now = useNow();
  const [creds, setCreds] = useState<Cred[]>([]);
  useEffect(() => { setCreds(JSON.parse(localStorage.getItem(storeKey(id)) ?? "[]")); }, [id]);

  const fetchMine = useServerFn(getMyPositions);
  const doDeposit = useServerFn(deposit);
  const doWithdraw = useServerFn(withdraw);
  const doClaim = useServerFn(claim);
  const mine = useQuery({ queryKey: ["mine", id, creds.length], queryFn: () => fetchMine({ data: { id, positions: creds } }), enabled: creds.length > 0 });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["launch", id] }); qc.invalidateQueries({ queryKey: ["mine", id] }); };

  const [form, setForm] = useState({ wallet: "", amount: "" });
  const [busy, setBusy] = useState(false);

  if (!l) return <p className="p-10 text-center text-muted-foreground">This campaign doesn't exist.</p>;
  const endsAt = new Date(l.ends_at).getTime();
  const ended = now > endsAt;
  // Live treasury: server snapshot + accrual since snapshot from active principal.
  const liveTreasury = l.treasury_yield + (Math.min(now, endsAt) - Math.min(l.as_of, endsAt)) / (365 * 864e5) * (l.apr / 100) * l.principal_locked;
  const pct = l.yield_goal > 0 ? Math.min(100, (liveTreasury / l.yield_goal) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((endsAt - now) / 864e5));
  const positions = mine.data ?? [];

  async function onDeposit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await doDeposit({ data: { id, wallet: form.wallet, amount: Number(form.amount) } }).catch(() => ({ ok: false as const, error: "Check the amount and wallet." }));
    setBusy(false);
    if (!r.ok) { toast.error(r.error); return; }
    const next = [...creds, { positionId: r.positionId, key: r.key }];
    localStorage.setItem(storeKey(id), JSON.stringify(next));
    setCreds(next);
    setForm({ ...form, amount: "" });
    toast.success("Deposit recorded — yield is now flowing to the project.");
    refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <Link to="/launchpad" className="inline-block py-4 text-sm text-muted-foreground hover:text-foreground">{text("← All campaigns", "← All projects")}</Link>

      <section className="border-b border-border pb-10 pt-6">
        <span className="font-mono text-xs text-primary"><Help topic="asset">{l.asset}</Help> · <Help topic="apr">{l.apr}% {text("APR", "yearly reward rate")}</Help> · <Help topic="days">{ended ? text("campaign ended", "challenge finished") : `${daysLeft} ${text("days left", "days to go")}`}</Help></span>
        <h1 className="mt-2 text-5xl font-bold">{l.name} <span className="font-mono text-muted-foreground"><Help topic="symbol">${l.symbol}</Help></span></h1>
        {l.description && <p className="mt-3 max-w-2xl text-muted-foreground">{l.description}</p>}
        <div className="mt-8 grid gap-6 font-mono sm:grid-cols-4">
          <Stat topic="yield" label={text(`treasury yield (${l.asset})`, `team reward drips (${l.asset})`)} value={fmt(liveTreasury, 8)} big />
          <Stat topic="principal" label={text(`principal staked (${l.asset})`, `piggy-bank coins (${l.asset})`)} value={fmt(l.principal_locked, 4)} />
          <Stat topic="backers" label={text("backers", "helpers")} value={String(l.backers)} />
          <Stat topic="pool" label={text(`$${l.symbol} for backers`, `$${l.symbol} treasure for helpers`)} value={fmt(l.token_pool, 0)} />
        </div>
        <div className="mt-6 h-2 rounded bg-muted"><div className="h-full rounded bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 font-mono text-xs text-muted-foreground"><Help topic="progress">{pct.toFixed(2)}% {text("of", "full")}</Help> · <Help topic="goal">{fmt(l.yield_goal, 2)} {l.asset} {text("yield goal", "reward jar goal")}</Help></p>
      </section>

      <TokenUtilitySummary config={l.token_config ?? {}} name={l.name} symbol={l.symbol} backerPool={l.token_pool} />

      <div className="grid gap-8 py-10 md:grid-cols-[1fr_1.4fr]">
        <form onSubmit={onDeposit} className="h-fit rounded border border-border bg-card p-6">
          <h2 className="text-lg font-bold">{text("Stake to back", "Fill your piggy bank 🐷")}</h2>
          <p className="mt-1 text-sm text-muted-foreground"><Help topic="principal">{text("Principal protection: original deposits are tracked separately from rewards in this simulation.", "Your original practice coins stay separate from the extra reward drips.")}</Help></p>
          <div className="mt-5 space-y-4">
            <Field topic="wallet" label={text("Wallet address", "Coin mailbox address 📬")}>{(fieldId) => <Input id={fieldId} required className="font-mono" maxLength={64} value={form.wallet} onChange={(e) => setForm({ ...form, wallet: e.target.value })} placeholder="Where you'll receive tokens" />}</Field>
            <Field topic="deposit" label={text(`Amount (${l.asset})`, `Piggy-bank coins (${l.asset})`)}>{(fieldId) => <Input id={fieldId} required type="number" step="any" min="0" className="font-mono" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />}</Field>
            {Number(form.amount) > 0 && (
              <p className="font-mono text-xs text-muted-foreground"><Help topic="projected">≈ {fmt(Number(form.amount) * l.apr / 100 / 365 * daysLeft, 6)} {l.asset} {text("projected yield", "guessed reward drips")} / {daysLeft} {text("days remaining", "days to go")}</Help></p>
            )}
            <Button className="w-full" disabled={busy || ended}>{ended ? text("Campaign ended", "Challenge finished") : busy ? text("Depositing…", "Filling your piggy bank…") : text("Deposit", "Add practice coins 🪙")}</Button>
          </div>
        </form>

        <div>
          <h2 className="text-lg font-bold">{text("Your positions", "Your piggy banks 🐷")}</h2>
          <p className="text-xs text-muted-foreground"><Help topic="positions">{text("Saved in this browser.", "Your keys are saved in this browser.")}</Help></p>
          <div className="mt-4 space-y-3">
            {positions.length === 0 && <p className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No positions yet.</p>}
            {positions.map((p) => {
              const y = accruedYield(p, l.apr, l.ends_at, now);
              const est = liveTreasury > 0 ? Math.min(1, y / liveTreasury) * l.token_pool : 0;
              const cred = creds.find((c) => c.positionId === p.id);
              if (!cred) return null;
              return (
                <div key={p.id} className="rounded border border-border bg-card p-5">
                  <div className="flex justify-between font-mono text-xs text-muted-foreground">
                    <Help topic="wallet">{p.wallet.slice(0, 8)}…{p.wallet.slice(-6)}</Help>
                    <Help topic="withdraw">{p.withdrawn_at ? text("principal withdrawn", "coins taken back") : text("staking", "making reward drips")}</Help>
                  </div>
                  <div className="mt-3 grid gap-4 font-mono sm:grid-cols-3">
                    <Stat topic="principal" label={text("principal", "original coins")} value={fmt(p.principal, 4)} />
                    <Stat topic="yield" label={text("yield given", "reward drips given")} value={fmt(y, 8)} />
                    <Stat topic={p.claimed_at ? "claimed" : "estimate"} label={p.claimed_at ? text(`$${l.symbol} claimed`, `$${l.symbol} treasure collected`) : text(`est. $${l.symbol}`, `guessed $${l.symbol} treasure`)} value={fmt(p.claimed_at ? p.claimed_tokens : (ended ? p.est_tokens : est), 2)} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!p.withdrawn_at && (
                      <Help topic="withdraw"><Button variant="outline" size="sm" onClick={async () => { await doWithdraw({ data: { id, positions: [cred] } }); toast.success(`${fmt(p.principal, 4)} ${l.asset} returned`); refresh(); }}>{text("Withdraw principal", "Take coins back 🪙")}</Button></Help>
                    )}
                    {!p.claimed_at && (
                      <Help topic="claim"><Button size="sm" disabled={!ended} onClick={async () => {
                        const r = await doClaim({ data: { id, positions: [cred] } });
                        if (r.ok) toast.success(`Claimed ${fmt(r.amount, 2)} $${l.symbol}`); else toast.error(r.error);
                        refresh();
                      }}>{ended ? text(`Claim $${l.symbol}`, `Collect $${l.symbol} treasure 🎁`) : text("Claim at end", "Treasure opens at the finish")}</Button></Help>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ topic, label, value, big }: { topic: HelpTopic; label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div className={big ? "text-2xl text-primary tabular-nums" : "text-lg tabular-nums"}>{value}</div>
      <div className="text-xs text-muted-foreground"><Help topic={topic}>{label}</Help></div>
    </div>
  );
}
