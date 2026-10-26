import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useExperience } from "@/components/experience";

export const Route = createFileRoute("/incentives")({
  head: () => ({ meta: [
    { title: "Incentives — Kuibii" },
    { name: "description", content: "Why incentives shape money: fiat inflation, Bitcoin scarcity, and a simulator to design your token's incentives." },
    { property: "og:title", content: "Incentives — Kuibii" },
    { property: "og:description", content: "Learn how money incentives work and test spend-vs-hold behaviour for your own token." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: IncentivesPage,
});

const GUIDES = [
  ["Inflation / emissions", "New supply lowers each coin's share: people spend sooner and hold less.", "Making lots of new coins makes each coin worth a bit less, so people spend them fast."],
  ["Fixed or capped supply", "Scarcity rewards holding; good for savings, weaker for everyday spending.", "If there are only a few coins ever, people like to keep them."],
  ["Burns & buybacks", "Removing supply raises each holder's share; tie burns to real usage.", "Throwing some coins away makes the rest more special."],
  ["Vesting & cliffs", "Locks align long-term behaviour and stop instant dumping.", "Timers stop people grabbing all the treats and running."],
  ["Staking & yield", "Rewards for locking reduce circulating supply but are paid by dilution or fees.", "Keep coins in the piggy bank and get bonus coins."],
  ["Utility & spending perks", "Discounts, access and voting give a reason to use coins, not only hoard them.", "Coins that open doors make people want to use them."],
  ["Demurrage (holding fee)", "A small decay on idle balances pushes circulation, like fiat but explicit.", "Coins that slowly melt if you never use them."],
  ["Cascade & conditions", "Requiring earlier tokens rewards loyalty and staying in the game.", "Keep your first coin to unlock the next level."],
] as const;

function IncentivesPage() {
  const { text } = useExperience();
  const [inflation, setInflation] = useState(2);
  const [burn, setBurn] = useState(0);
  const [demand, setDemand] = useState(5);
  const [utility, setUtility] = useState(3);
  const years = 10;
  const net = (1 + demand / 100) / (1 + (inflation - burn) / 100) - 1;
  const value = Array.from({ length: years + 1 }, (_, y) => Math.pow(1 + net, y));
  const max = Math.max(...value, 1);
  const holdScore = Math.max(0, Math.min(100, 50 + net * 500));
  const spendScore = Math.max(0, Math.min(100, 100 - holdScore + utility * 5));
  const verdict = net < -0.005
    ? text("Spend incentive: value shrinks, people spend or swap it quickly (fiat-like).", "Coins melt over time — friends will spend them fast!")
    : net > 0.005
      ? text("Hold incentive: value grows, people save it (Bitcoin-like). Add utility so it still gets used.", "Coins grow over time — friends will want to keep them!")
      : text("Neutral: stable value, a good fit for payments and everyday use.", "Coins stay the same — great for buying things.");

  const slider = (label: string, v: number, set: (n: number) => void, min: number, max: number) => (
    <label className="block text-sm">
      <span className="flex justify-between"><span>{label}</span><span className="font-mono text-primary">{v}%</span></span>
      <input type="range" min={min} max={max} step={0.5} value={v} onChange={(e) => set(+e.target.value)} className="mt-1 w-full accent-primary" />
    </label>
  );

  return <div className="mx-auto max-w-4xl px-6 py-16">
    <p className="mb-4 font-mono text-xs uppercase text-primary">KUIBII · {text("Incentives", "Why coins behave 🧲")}</p>
    <h1 className="text-5xl font-bold leading-tight">{text("Incentives shape money", "Money has a personality 🧠")}</h1>
    <p className="mt-6 text-lg text-muted-foreground">{text(
      "Every currency quietly tells you what to do with it: spend it, save it, or use it. Designing a token means designing that message.",
      "Every coin whispers a secret: “spend me!” or “keep me!”. When you make coins, you choose the whisper.",
    )}</p>

    <div className="mt-10 grid gap-4 md:grid-cols-2">
      <article className="rounded border border-border bg-card p-5">
        <h2 className="text-xl font-bold">{text("Fiat: the incentive to spend", "Normal money: spend it fast 💸")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{text(
          "Central banks target ongoing inflation and supply can grow without limit. Cash loses purchasing power each year, so holding it is a slow loss: people are pushed to spend, borrow and invest in assets to keep up. This fuels consumption and credit-driven growth, but punishes simple saving.",
          "Banks can print more and more money, so each bill buys a little less every year. Keeping it in a jar makes it shrink, so people spend it quickly.",
        )}</p>
      </article>
      <article className="rounded border border-border bg-card p-5">
        <h2 className="text-xl font-bold">{text("Bitcoin: the incentive to hold", "Bitcoin: keep it safe 🏔️")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{text(
          "Supply is capped at 21 million and issuance halves every four years. If demand grows faster than supply, each coin tends to buy more over time, so people save it rather than spend it. Great for savings; the trade-off is less everyday circulation.",
          "Only 21 million Bitcoins can ever exist. If more people want them, each one becomes more special, so people like to keep them instead of spending.",
        )}</p>
      </article>
    </div>

    <section className="mt-12 rounded border border-border bg-card p-5">
      <h2 className="text-2xl font-bold">{text("Incentive simulator", "Coin mood machine 🔮")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{text("Simplified what-if model, not a price prediction.", "Just pretend — not a real prediction.")}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {slider(text("Yearly new supply (inflation)", "New coins each year"), inflation, setInflation, 0, 20)}
        {slider(text("Yearly burn", "Coins thrown away each year"), burn, setBurn, 0, 10)}
        {slider(text("Yearly demand growth", "More friends wanting coins"), demand, setDemand, -10, 30)}
        {slider(text("Utility strength", "How useful coins are"), utility, setUtility, 0, 10)}
      </div>
      <div className="mt-6 flex h-32 items-end gap-1" role="img" aria-label={`Value per coin over ${years} years`}>
        {value.map((v, y) => <div key={y} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div className="w-full rounded-sm bg-primary" style={{ height: `${(v / max) * 100}px` }} title={`Year ${y}: ${v.toFixed(2)}x`} />
          <span className="font-mono text-[10px] text-muted-foreground">{y}</span>
        </div>)}
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{text("Value per coin after 10 years", "Coin power after 10 years")}: {value[years]!.toFixed(2)}x</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[[text("Hold incentive", "Keep-it feeling"), holdScore], [text("Spend / use incentive", "Use-it feeling"), spendScore]].map(([l, s]) => (
          <div key={l as string}><div className="flex justify-between text-sm"><span>{l}</span><span className="font-mono">{Math.round(s as number)}</span></div>
            <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${s}%` }} /></div></div>
        ))}
      </div>
      <p className="mt-4 font-bold">{verdict}</p>
    </section>

    <section className="mt-12">
      <h2 className="text-2xl font-bold">{text("Design levers for your token", "Coin recipe tips 🧪")}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {GUIDES.map(([t, pro, kid]) => <div key={t} className="rounded border border-border p-4">
          <h3 className="font-bold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{text(pro, kid)}</p>
        </div>)}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">{text(
        "Rule of thumb: decide the behaviour you want first (save, spend, participate), then pick supply, unlocks and utility that reward it.",
        "Tip: first decide what you want friends to do, then choose rules that reward it.",
      )}</p>
    </section>
  </div>;
}
