import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useExperience } from "@/components/experience";
import type { Vesting } from "@/lib/distribution";
import type { TokenBlueprint } from "@/lib/token-blueprint";

type Props = {
  symbol: string;
  supply: number;
  perRecipient: number;
  vesting: Vesting;
  conditionCount: number;
  blueprint?: TokenBlueprint;
};

/** Unlocked % of a vested allocation at a given month (what-if projection). */
export function unlockedAt(v: Vesting, month: number) {
  if (!v.enabled) return 100;
  if (month < v.cliff_months) return v.tge_percent;
  const dur = Math.max(1, v.duration_months);
  const m = Math.min(dur, month - v.cliff_months);
  return v.tge_percent + ((100 - v.tge_percent) * m) / dur;
}

const fmt = (n: number) => Math.round(n).toLocaleString();

export function TokenSimulator({ symbol, supply, perRecipient, vesting, conditionCount, blueprint }: Props) {
  const { text } = useExperience();
  const horizon = Math.max(12, vesting.enabled ? vesting.cliff_months + vesting.duration_months : 12);
  const [month, setMonth] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [people, setPeople] = useState(500);
  const [passRate, setPassRate] = useState(70);
  const [stagePass, setStagePass] = useState(60);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setMonth((m) => { if (m >= horizon) { setPlaying(false); return m; } return m + 1; }), 600);
    return () => clearInterval(t);
  }, [playing, horizon]);

  const eligible = Math.round(people * (conditionCount ? passRate / 100 : 1));
  const allocated = Math.min(supply, eligible * perRecipient);
  const unlockedPct = unlockedAt(vesting, month);
  const unlocked = (allocated * unlockedPct) / 100;
  const stages = blueprint?.cascade.enabled ? blueprint.cascade.stages.slice(0, 20) : [];
  const layers = blueprint?.nesting.enabled ? blueprint.nesting.layers.slice(0, 20) : [];
  const day = month * 30;
  const released = (l: TokenBlueprint["nesting"]["layers"][number]) => {
    const r = l.release;
    const timeOk = r.mode === "immediate" || r.mode === "condition" || day >= r.hold_days;
    const condOk = r.mode === "immediate" || r.mode === "time" || month >= 1;
    return timeOk && condOk;
  };
  const bars = Array.from({ length: horizon + 1 }, (_, m) => unlockedAt(vesting, m));

  return (
    <div className="space-y-5">
      <p className="rounded border border-primary/40 bg-primary/5 p-3 text-xs text-muted-foreground">
        {text("What-if projection only. Nothing is deployed, checked or paid out.", "Pretend mode! Nothing real happens here.")}
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><Label htmlFor="sim-people">{text("Registrants", "Friends who join")}</Label><Input id="sim-people" type="number" min={0} value={people} className="font-mono" onChange={(e) => setPeople(Math.max(0, +e.target.value))} /></div>
        <div><Label>{text("Pass conditions", "Pass the rules")}: {passRate}%</Label><Slider className="mt-3" value={[passRate]} max={100} step={1} onValueChange={([v]) => setPassRate(v ?? 0)} /></div>
        {stages.length > 0 && <div><Label>{text("Advance per stage", "Move to next level")}: {stagePass}%</Label><Slider className="mt-3" value={[stagePass]} max={100} step={1} onValueChange={([v]) => setStagePass(v ?? 0)} /></div>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" onClick={() => { if (month >= horizon) setMonth(0); setPlaying(!playing); }}>{playing ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}{playing ? text("Pause", "Pause") : text("Play", "Go!")}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setPlaying(false); setMonth(0); }}><RotateCcw className="mr-1 h-4 w-4" />{text("Reset", "Start over")}</Button>
        <div className="min-w-40 flex-1"><Slider aria-label="Month" value={[month]} max={horizon} step={1} onValueChange={([v]) => { setPlaying(false); setMonth(v ?? 0); }} /></div>
        <span className="font-mono text-sm text-primary">{text("Month", "Month")} {month}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          [text("Eligible", "Invited in"), fmt(eligible)],
          [text("Allocated", "Coins handed out"), `${fmt(allocated)} ${symbol}`],
          [text("Unlocked", "Ready to use"), `${fmt(unlocked)} (${unlockedPct.toFixed(0)}%)`],
          [text("Undistributed", "Left in chest"), fmt(Math.max(0, supply - allocated))],
        ].map(([k, v]) => (
          <div key={k} className="rounded border border-border bg-card p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="mt-1 break-words font-mono text-sm font-bold">{v}</div></div>
        ))}
      </div>

      <div className="flex h-32 items-end gap-0.5 rounded border border-border p-3" role="img" aria-label={`Unlocked ${unlockedPct.toFixed(0)}% at month ${month}`}>
        {bars.map((p, m) => (
          <div key={m} className={`flex-1 rounded-sm transition-all duration-500 ${m <= month ? "bg-primary" : "bg-muted"}`} style={{ height: `${Math.max(2, p)}%` }} title={`Month ${m}: ${p.toFixed(0)}%`} />
        ))}
      </div>

      {stages.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-bold">{text("Cascade funnel", "Level-up ladder")}</div>
          <div className="space-y-1">
            {stages.map((s, i) => {
              const holders = Math.min(Math.floor(s.supply / Math.max(1, s.amount)), Math.round(eligible * Math.pow(stagePass / 100, i)));
              const active = month >= i;
              const w = eligible ? (holders / eligible) * 100 : 0;
              return (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 truncate font-mono">{s.symbol}</span>
                  <div className="h-3 flex-1 rounded bg-muted"><div className="h-3 rounded bg-primary transition-all duration-500" style={{ width: `${active ? w : 0}%` }} /></div>
                  <span className="w-14 shrink-0 text-right font-mono">{active ? fmt(holders) : "🔒"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {layers.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-bold">{text("Nested vault releases", "Gift box openings 🪆")}</div>
          <div className="space-y-1">
            {layers.map((l) => {
              const open = released(l);
              const depth = (() => { let d = 0; let p = l.parent_id; while (p && d < 20) { d++; p = layers.find((x) => x.id === p)?.parent_id ?? ""; } return d; })();
              return (
                <div key={l.id} className={`flex items-center justify-between rounded border p-2 text-xs transition ${open ? "border-primary bg-primary/10" : "border-border"}`} style={{ marginLeft: `${Math.min(depth, 6) * 12}px` }}>
                  <span className="truncate">{open ? "🔓" : "🔒"} {l.name}</span>
                  <span className="shrink-0 font-mono">{fmt(l.nft_count * l.amount_per_nft)} · {l.release.mode}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{text("Condition-based releases are assumed proven from month 1.", "Rule boxes pretend to open after month 1.")}</p>
        </div>
      )}
    </div>
  );
}
