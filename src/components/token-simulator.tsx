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
  blueprint?: TokenBlueprint | undefined;
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

      <MindMap symbol={symbol || "TOKEN"} month={month} unlockedPct={unlockedPct} eligible={eligible} people={people} conditionCount={conditionCount}
        stages={stages.map((s, i) => ({ id: s.id, label: s.symbol, active: month >= i, holders: Math.min(Math.floor(s.supply / Math.max(1, s.amount)), Math.round(eligible * Math.pow(stagePass / 100, i))) }))}
        layers={layers.map((l) => ({ id: l.id, parent: l.parent_id, label: l.name, open: released(l) }))}
        left={Math.max(0, supply - allocated)} supply={supply} text={text} />
      <p className="text-[10px] text-muted-foreground">{text("Solid lines = flowing now, dashed = locked. Rule-based boxes are assumed proven from month 1.", "Solid lines = open, dashed = still locked.")}</p>
      )}
    </div>
  );
}

type MNode = { id: string; x: number; y: number; r: number; label: string; sub?: string; on: boolean; from?: string; hub?: boolean };

function MindMap(p: { symbol: string; month: number; unlockedPct: number; eligible: number; people: number; conditionCount: number; left: number; supply: number;
  stages: { id: string; label: string; active: boolean; holders: number }[]; layers: { id: string; parent: string; label: string; open: boolean }[];
  text: (a: string, b: string) => string }) {
  const C = 200, nodes: MNode[] = [];
  const at = (deg: number, d: number, ox = C, oy = C) => ({ x: ox + Math.cos((deg * Math.PI) / 180) * d, y: oy + Math.sin((deg * Math.PI) / 180) * d });
  nodes.push({ id: "root", x: C, y: C, r: 18 + p.unlockedPct / 8, label: p.symbol, sub: `${p.unlockedPct.toFixed(0)}%`, on: true, hub: true });
  const hub = (id: string, deg: number, label: string, sub: string, on: boolean) => { const q = at(deg, 85); nodes.push({ id, ...q, r: 13, label, sub, on, from: "root", hub: true }); return q; };
  hub("people", -90, p.text("Holders", "Friends"), p.eligible.toLocaleString(), p.eligible > 0);
  if (p.conditionCount) {
    const q = hub("rules", -30, p.text("Rules", "Rules"), String(p.conditionCount), true);
    const out = at(-30, 50, q.x, q.y);
    nodes.push({ id: "rejected", ...out, r: 7, label: p.text("Filtered", "Left out"), sub: (p.people - p.eligible).toLocaleString(), on: false, from: "rules" });
  }
  hub("vest", 30, p.text("Unlock", "Timer"), `M${p.month}`, p.unlockedPct > 0);
  hub("left", 90, p.text("Unallocated", "Chest"), `${p.supply ? Math.round((p.left / p.supply) * 100) : 0}%`, p.left > 0);
  if (p.stages.length) {
    let prev = "root"; let pos = at(150, 70);
    p.stages.slice(0, 8).forEach((s, i) => {
      const q = i === 0 ? pos : at(150 + (i % 2 ? 18 : -18), 34, pos.x, pos.y);
      pos = q; nodes.push({ id: `s${s.id}`, ...q, r: 6 + Math.min(8, Math.log10(s.holders + 1) * 2.5), label: s.label, sub: s.active ? s.holders.toLocaleString() : "🔒", on: s.active, from: prev }); prev = `s${s.id}`;
    });
  }
  if (p.layers.length) {
    const q = hub("vaults", 210, p.text("Vaults", "Boxes"), String(p.layers.length), true);
    const place = (parent: string, ox: number, oy: number, deg: number, depth: number) => {
      const kids = p.layers.filter((l) => (l.parent || "") === parent && depth < 6);
      kids.forEach((l, k) => {
        const a = deg + (k - (kids.length - 1) / 2) * (40 / (depth + 1));
        const pos = at(a, 42, ox, oy);
        nodes.push({ id: `v${l.id}`, ...pos, r: 7, label: l.label, sub: l.open ? "🔓" : "🔒", on: l.open, from: parent ? `v${parent}` : "vaults" });
        place(l.id, pos.x, pos.y, a, depth + 1);
      });
    };
    place("", q.x, q.y, 210, 0);
  }
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const pad = 40, minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  return (
    <svg viewBox={`${minX} ${minY} ${Math.max(...xs) - minX + pad} ${Math.max(...ys) - minY + pad}`} className="w-full rounded border border-border bg-card" role="img" aria-label="Token simulation mind map">
      {nodes.filter((n) => n.from).map((n) => { const a = byId[n.from!]!; return (
        <line key={`l${n.id}`} x1={a.x} y1={a.y} x2={n.x} y2={n.y} className={`transition-all duration-500 ${n.on ? "stroke-primary" : "stroke-muted-foreground/40"}`} strokeWidth={n.on ? 2 : 1} strokeDasharray={n.on ? undefined : "4 3"} />
      ); })}
      {nodes.map((n) => (
        <g key={n.id} className="transition-all duration-500">
          <circle cx={n.x} cy={n.y} r={n.r} className={`transition-all duration-500 ${n.on ? "fill-primary" : "fill-muted stroke-muted-foreground/40"}`} />
          {n.on && n.hub && <circle cx={n.x} cy={n.y} r={n.r + 4} className="fill-none stroke-primary/30" strokeWidth={2} />}
          <text x={n.x} y={n.y + n.r + 11} textAnchor="middle" className="fill-foreground text-[10px] font-bold">{n.label.slice(0, 12)}</text>
          {n.sub && <text x={n.x} y={n.y + n.r + 21} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px]">{n.sub}</text>}
        </g>
      ))}
    </svg>
  );
}
