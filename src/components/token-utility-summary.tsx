import { Download } from "lucide-react";
import { Help, useExperience } from "@/components/experience";
import { Button } from "@/components/ui/button";
import { ALLOCATION_BUCKETS, utilDef, type TokenConfig } from "@/lib/token-utility";

export function TokenUtilitySummary({ config, name, symbol, backerPool }: { config: Partial<TokenConfig>; name: string; symbol: string; backerPool: number }) {
  const { text, kid } = useExperience();
  const features = Object.entries(config.features ?? {});
  const perks = Object.entries(config.perks ?? {});
  if (!features.length && !perks.length && !config.branding && !config.economics && !config.allocation) return null;

  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ name, symbol, backer_token_pool: backerPool, status: "planned specification, not deployed", ...config }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${symbol}-token-spec.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <section className="border-b border-border py-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Help topic="features"><h2 className="text-lg font-bold">{text("Project token utility", "Reward coin superpowers 🦸")}</h2></Help>
      <Button variant="outline" size="sm" onClick={download}><Download className="mr-2 h-4 w-4" />{text("Download token spec", "Save coin recipe")}</Button>
    </div>
    <p className="mt-2 text-sm text-muted-foreground">{text("Planned features and benefits only — not deployed or guaranteed. Supply allocations do not change the backer reward pool or yield-based claims.", "A plan for your coins, not real magic yet! Helpers still share the full reward treasure based on their drips.")}</p>
    <div className="mt-5 grid gap-6 sm:grid-cols-2">
      {([["features", features], ["perks", perks]] as const).map(([group, entries]) => entries.length > 0 && <div key={group}>
        <Help topic={group}><h3 className="font-bold">{group === "features" ? text("Token features", "Coin superpowers 🦸") : text("Utility & perks", "What can coins do? 🎮")}</h3></Help>
        <ul className="mt-3 space-y-3">{entries.map(([id, params]) => {
          const def = utilDef(id);
          if (!def) return null;
          return <li key={id} className="border-b border-border pb-3 text-sm">
            <h4 className="font-bold">{text(def.pro, def.kid)}</h4>
            <p className="mt-1 text-muted-foreground">{kid ? def.kidInfo : def.info}</p>
            {def.params.filter((p) => params[p.key] !== undefined && params[p.key] !== "").map((p) => <p key={p.key} className="mt-1 break-all font-mono text-xs">{p.label}: {String(params[p.key])}</p>)}
          </li>;
        })}</ul>
      </div>)}
    </div>
    {config.allocation && <div className="mt-6">
      <Help topic="tokenomics"><h3 className="font-bold">{text("Planned supply split", "Future treasure pie 🥧")}</h3></Help>
      <dl className="mt-3 grid gap-3 sm:grid-cols-4">{ALLOCATION_BUCKETS.map((bucket) => {
        const pct = config.allocation?.[bucket.id] ?? 0;
        return pct > 0 ? <div key={bucket.id}><dt className="text-xs text-muted-foreground">{text(bucket.pro, bucket.kid)}</dt><dd className="font-mono text-sm">{pct}%</dd></div> : null;
      })}</dl>
    </div>}
    {config.economics && <div className="mt-6">
      <Help topic="tokenomics"><h3 className="font-bold">{text("Planned economics", "Coin growth plan 🌱")}</h3></Help>
      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>{text("Yearly inflation", "New coins each year")}: {config.economics.inflation_pct}%</span>
        <span>{text("Initial price (USD)", "Starting price (USD)")}: ${config.economics.initial_price}</span>
        {config.economics.burn_schedule && <span className="break-words">{text("Burn schedule", "Shredding plan")}: {config.economics.burn_schedule}</span>}
      </div>
    </div>}
    {config.branding?.description && <p className="mt-6 max-w-2xl break-words text-sm text-muted-foreground">{config.branding.description}</p>}
    {config.branding && <div className="mt-3 flex flex-wrap gap-4 text-sm">{(["website", "whitepaper", "twitter", "discord", "telegram"] as const).map((key) => {
      const url = config.branding?.[key];
      if (!url || !/^https?:\/\//i.test(url)) return null;
      return <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="capitalize text-primary underline underline-offset-4">{key}</a>;
    })}</div>}
  </section>;
}