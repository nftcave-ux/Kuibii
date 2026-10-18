import { Field, Help, useExperience } from "@/components/experience";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLaunch, listLaunches } from "@/lib/launchpad.functions";
import { ASSETS, fmt } from "@/lib/launchpad";
import { TokenUtilityEditor } from "@/components/token-utility-editor";
import { emptyConfig } from "@/lib/token-utility";

const launchesQuery = queryOptions({ queryKey: ["launches"], queryFn: () => listLaunches() });
// Prior walkthrough campaigns are hidden, without deleting anyone's saved positions.
const exampleLaunchIds = new Set([
  "f97d4898-c5f5-4cd7-b23c-45094ebbdae4",
  "2790c00f-b2d9-41b4-b11d-bb3f733194bf",
  "569a442f-07b5-4267-83b2-81ab063ba7db",
]);

export const Route = createFileRoute("/launchpad/")({
  head: () => ({
    meta: [
      { title: "No-loss launchpad — Mint Press" },
      { name: "description", content: "Back projects with staking yield, not principal. Deposit staked assets, withdraw anytime, earn project tokens." },
      { property: "og:title", content: "No-loss launchpad — Mint Press" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Staking yield funds the project. Your principal stays yours." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(launchesQuery),
  errorComponent: () => <p className="p-10 text-center">The launchpad didn't load.</p>,
  component: LaunchpadPage,
});

function LaunchpadPage() {
  const { text } = useExperience();
  const { data } = useSuspenseQuery(launchesQuery);
  const campaigns = data.filter((launch) => !exampleLaunchIds.has(launch.id));
  const [creating, setCreating] = useState(false);
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <section className="grid gap-10 py-12 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="text-5xl font-bold leading-[1.05] md:text-6xl">{text("Staking Launchpad", "Piggy Bank Staking 🐷")}<br /><span className="text-primary">{text("Fund with yield.", "Help with the extra coins.")}</span></h1>
          <p className="mt-5 max-w-xl text-muted-foreground">{text("Back projects with simulated staking yield. Original deposits are tracked separately, and project tokens are allocated in proportion to yield contributions.", "Put practice coins in a pretend piggy bank. Its extra reward drips help a project, and you get a share of the project's treasure.")}</p>
          <Button className="mt-6" onClick={() => setCreating((v) => !v)}>{creating ? text("Close", "Close") : text("Launch a project →", "Start a project 🚀")}</Button>
        </div>
        <ol className="space-y-3 font-mono text-sm">
          {([
            ["Deposit staked asset", "Fill a pretend piggy bank 🐷", "deposit"],
            ["Yield → project treasury", "Reward drips help the team 💧", "yield"],
            ["Withdraw simulated principal", "Take your practice coins back 🪙", "principal"],
            ["Claim tokens at campaign end", "Collect treasure at the finish 🎁", "claim"],
          ] as const).map(([pro, kid, topic], i) => (
            <li key={pro} className="flex gap-3 border-b border-border pb-3"><span className="text-primary">0{i + 1}</span><Help topic={topic}>{text(pro, kid)}</Help></li>
          ))}
        </ol>
      </section>
      {creating && <Creator />}
      <h2 className="border-t border-border pt-10 text-lg font-bold">{text("Live campaigns", "Projects to help 🚀")}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.length === 0 && <p className="text-muted-foreground">{text("No campaigns yet — launch the first one.", "No projects yet — start the first challenge! 🚀")}</p>}
        {campaigns.map((l) => {
          const ended = Date.now() > new Date(l.ends_at).getTime();
          const pct = l.yield_goal > 0 ? Math.min(100, (l.treasury_yield / l.yield_goal) * 100) : 0;
          return (
            <article key={l.id} className="block rounded border border-border bg-card p-5 transition hover:border-primary">
              <div className="flex flex-wrap items-center justify-between font-mono text-xs"><span className="text-primary"><Help topic="asset">{l.asset}</Help> · <Help topic="apr">{l.apr}% {text("APR", "yearly")}</Help></span><span className="text-muted-foreground"><Help topic="days">{ended ? text("ended", "finished") : text("live", "open")}</Help></span></div>
              <h3 className="mt-2 text-xl font-bold"><Link to="/launchpad/$id" params={{ id: l.id }} className="hover:text-primary">{l.name}</Link> <span className="font-mono text-muted-foreground"><Help topic="symbol">${l.symbol}</Help></span></h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{l.description}</p>
              <div className="mt-4 h-1.5 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${pct}%` }} /></div>
              <div className="mt-2 flex flex-wrap justify-between gap-1 font-mono text-xs text-muted-foreground">
                <Help topic="yield">{fmt(l.treasury_yield, 6)} {l.asset} {text("yield", "reward drips")}</Help><Help topic="principal">{fmt(l.principal_locked, 2)} {text("staked", "saved")}</Help>
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground"><Help topic="progress">{pct.toFixed(2)}%</Help> · <Help topic="goal">{fmt(l.yield_goal, 2)} {l.asset} {text("goal", "jar goal")}</Help></div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Creator() {
  const { text } = useExperience();
  const create = useServerFn(createLaunch);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [tokenConfig, setTokenConfig] = useState(emptyConfig);
  const [f, setF] = useState({ name: "", symbol: "", description: "", asset: "stETH" as (typeof ASSETS)[number]["id"], apr: 3.2, yield_goal: 10, token_pool: 1_000_000, duration_days: 90 });
  return (
    <section className="mb-12 border-t border-border py-6">
      <h2 className="text-lg font-bold">{text("New project campaign", "Your new project challenge 🚀")}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field topic="project" label={text("Project name", "Project name 🚀")}>{(fieldId) => <Input id={fieldId} maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
        <Field topic="symbol" label={text("Token symbol", "Reward coin nickname")}>{(fieldId) => <Input id={fieldId} maxLength={11} className="font-mono uppercase" value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value.replace(/[^a-z0-9]/gi, "") })} />}</Field>
        <Field topic="description" label={text("What are you building?", "What will your team make?")} className="sm:col-span-2">{(fieldId) => <Textarea id={fieldId} maxLength={1000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
      </div>
      <div className="mt-5"><Help topic="asset"><Label>{text("Accepted staking asset", "Piggy-bank type 🐷")}</Label></Help></div>
      <div className="mt-2 flex flex-wrap gap-2">
        {ASSETS.map((a) => (
          <Button variant="outline" type="button" aria-pressed={f.asset === a.id} key={a.id} onClick={() => setF({ ...f, asset: a.id, apr: a.apr })}
            className={`rounded border px-3 py-1.5 text-sm ${f.asset === a.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{a.label}</Button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <Field topic="apr" label={text("Expected APR (%)", "Yearly reward rate (%)")}>{(fieldId) => <Input id={fieldId} type="number" step="0.1" className="font-mono" value={f.apr} onChange={(e) => setF({ ...f, apr: +e.target.value })} />}</Field>
        <Field topic="goal" label={text(`Yield goal (${f.asset})`, `Reward jar goal (${f.asset})`)}>{(fieldId) => <Input id={fieldId} type="number" className="font-mono" value={f.yield_goal} onChange={(e) => setF({ ...f, yield_goal: +e.target.value })} />}</Field>
        <Field topic="pool" label={text("Tokens for backers", "Treasure for helpers")}>{(fieldId) => <Input id={fieldId} type="number" className="font-mono" value={f.token_pool} onChange={(e) => setF({ ...f, token_pool: +e.target.value })} />}</Field>
        <Field topic="days" label={text("Duration (days)", "Challenge timer (days)")}>{(fieldId) => <Input id={fieldId} type="number" className="font-mono" value={f.duration_days} onChange={(e) => setF({ ...f, duration_days: Math.max(1, Math.floor(+e.target.value)) })} />}</Field>
      </div>
      <p className="mt-3 text-xs text-muted-foreground"><Help topic="pool">{text("Backers share the token pool in proportion to the yield their deposit generates (amount × time).", "Helpers share the treasure based on their piggy-bank reward drips, not just how many coins they put in.")}</Help></p>
      <div className="mt-8 border-t border-border pt-6">
        <Help topic="features"><h3 className="text-lg font-bold">{text("Project token utility", "Give your reward coins superpowers 🦸")}</h3></Help>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">{text("These are planned token features, not deployed contracts or guaranteed benefits. The supply split describes your future token supply; it does not reduce the backer pool or change yield-based claims.", "This is your coin recipe, not real magic yet. The treasure pie is a future plan: helpers still share the full reward pool from their drips.")}</p>
        <TokenUtilityEditor value={tokenConfig} onChange={setTokenConfig} />
      </div>
      <div className="mt-6 flex justify-end">
        <Button disabled={busy} onClick={async () => {
          if (!f.name || !f.symbol) { toast.error("Add a project name and symbol."); return; }
          setBusy(true);
          try { const r = await create({ data: { ...f, token_config: tokenConfig } }); navigate({ to: "/launchpad/$id", params: { id: r.id } }); }
          catch { toast.error("Please check the fields."); } finally { setBusy(false); }
        }}>{busy ? text("Launching…", "Starting your challenge…") : text("Launch campaign", "Start the challenge 🚀")}</Button>
      </div>
    </section>
  );
}
