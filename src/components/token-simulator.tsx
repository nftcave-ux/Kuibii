import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div><Label>{text("Pass conditions", "Pass the rules")}: {passRate}%</Label><input type="range" className="mt-3 w-full accent-primary" value={passRate} min={0} max={100} step={1} onChange={(e) => { const v = +e.target.value; setPassRate(v); }} /></div>
        {stages.length > 0 && <div><Label>{text("Advance per stage", "Move to next level")}: {stagePass}%</Label><input type="range" className="mt-3 w-full accent-primary" value={stagePass} min={0} max={100} step={1} onChange={(e) => { const v = +e.target.value; setStagePass(v); }} /></div>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" onClick={() => { if (month >= horizon) setMonth(0); setPlaying(!playing); }}>{playing ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}{playing ? text("Pause", "Pause") : text("Play", "Go!")}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setPlaying(false); setMonth(0); }}><RotateCcw className="mr-1 h-4 w-4" />{text("Reset", "Start over")}</Button>
        <div className="min-w-40 flex-1"><input type="range" aria-label="Month" className="mt-3 w-full accent-primary" value={month} min={0} max={horizon} step={1} onChange={(e) => { const v = +e.target.value; setPlaying(false); setMonth(v); }} /></div>
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
      <p className="text-[10px] text-muted-foreground">{text("Colored moving lines = flowing now, grey = locked. Rule-based boxes are assumed proven from month 1.", "Colored lines = open, grey = still locked.")}</p>
    </div>
  );
}

type MNode = { id: string; x: number; y: number; r: number; label: string; sub?: string; on: boolean; from?: string; hub?: boolean; c: number };

// Branch colours map to the theme's chart tokens.
const COL = ["var(--primary)", "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function MindMap(p: { symbol: string; month: number; unlockedPct: number; eligible: number; people: number; conditionCount: number; left: number; supply: number;
  stages: { id: string; label: string; active: boolean; holders: number }[]; layers: { id: string; parent: string; label: string; open: boolean }[];
  text: (a: string, b: string) => string }) {
  const C = 0, nodes: MNode[] = [];
  const at = (deg: number, d: number, ox = C, oy = C) => ({ x: ox + Math.cos((deg * Math.PI) / 180) * d, y: oy + Math.sin((deg * Math.PI) / 180) * d });
  nodes.push({ id: "root", x: 0, y: 0, r: 22 + p.unlockedPct / 6, label: p.symbol, sub: `${p.unlockedPct.toFixed(0)}% ${p.text("unlocked", "open")}`, on: true, hub: true, c: 0 });
  const branches: { key: string; build: (deg: number, c: number) => void }[] = [];
  const hub = (id: string, deg: number, label: string, sub: string, on: boolean, c: number) => { const q = at(deg, 120); nodes.push({ id, ...q, r: 15, label, sub, on, from: "root", hub: true, c }); return q; };
  branches.push({ key: "people", build: (d, c) => { hub("people", d, p.text("Holders", "Friends"), p.eligible.toLocaleString(), p.eligible > 0, c); } });
  if (p.conditionCount) branches.push({ key: "rules", build: (d, c) => {
    const q = hub("rules", d, p.text("Rules", "Rules"), String(p.conditionCount), true, c);
    nodes.push({ id: "rejected", ...at(d, 70, q.x, q.y), r: 8, label: p.text("Filtered", "Left out"), sub: (p.people - p.eligible).toLocaleString(), on: false, from: "rules", c });
  } });
  branches.push({ key: "vest", build: (d, c) => { hub("vest", d, p.text("Unlock", "Timer"), `M${p.month}`, p.unlockedPct > 0, c); } });
  branches.push({ key: "left", build: (d, c) => { hub("left", d, p.text("Unallocated", "Chest"), `${p.supply ? Math.round((p.left / p.supply) * 100) : 0}%`, p.left > 0, c); } });
  if (p.stages.length) branches.push({ key: "stages", build: (d, c) => {
    let prev = "root";
    p.stages.slice(0, 10).forEach((s, i) => {
      const q = at(d + Math.sin(i * 1.2) * 8, 110 + i * 48);
      nodes.push({ id: `s${s.id}`, ...q, r: 7 + Math.min(9, Math.log10(s.holders + 1) * 2.5), label: s.label, sub: s.active ? s.holders.toLocaleString() : "🔒", on: s.active, from: prev, c, hub: i === 0 });
      prev = `s${s.id}`;
    });
  } });
  if (p.layers.length) branches.push({ key: "vaults", build: (d, c) => {
    const q = hub("vaults", d, p.text("Vaults", "Boxes"), String(p.layers.length), true, c);
    const place = (parent: string, ox: number, oy: number, deg: number, depth: number) => {
      const kids = p.layers.filter((l) => (l.parent || "") === parent && depth < 6);
      kids.forEach((l, k) => {
        const a = deg + (k - (kids.length - 1) / 2) * (50 / (depth + 1));
        const pos = at(a, 60, ox, oy);
        nodes.push({ id: `v${l.id}`, ...pos, r: 8, label: l.label, sub: l.open ? "🔓" : "🔒", on: l.open, from: parent ? `v${parent}` : "vaults", c });
        place(l.id, pos.x, pos.y, a, depth + 1);
      });
    };
    place("", q.x, q.y, d, 0);
  } });
  const step = 360 / branches.length;
  branches.forEach((b, i) => b.build(-90 + i * step, (i % (COL.length - 1)) + 1));

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const pad = 60, minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) - minX + pad, h = Math.max(...ys) - minY + pad;
  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} className="w-full rounded-lg border border-border bg-card" role="img" aria-label="Token simulation mind map">
      <defs>
        <radialGradient id="mm-bg"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" /><stop offset="100%" stopColor="var(--card)" stopOpacity="0" /></radialGradient>
        <filter id="mm-glow"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <circle cx={0} cy={0} r={Math.max(w, h) / 2} fill="url(#mm-bg)" />
      {[120, 220].map((r) => <circle key={r} cx={0} cy={0} r={r} fill="none" stroke="var(--border)" strokeDasharray="2 6" />)}
      {nodes.filter((n) => n.from).map((n) => { const a = byId[n.from!]!; const mx = (a.x + n.x) / 2 + (n.y - a.y) * 0.15, my = (a.y + n.y) / 2 - (n.x - a.x) * 0.15; return (
        <path key={`l${n.id}`} d={`M${a.x},${a.y} Q${mx},${my} ${n.x},${n.y}`} fill="none" stroke={n.on ? COL[n.c] : "var(--muted-foreground)"} strokeOpacity={n.on ? 0.9 : 0.35}
          strokeWidth={n.on ? 2.5 : 1.2} strokeDasharray={n.on ? "6 4" : "3 4"} className="transition-all duration-500">
          {n.on && <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />}
        </path>
      ); })}
      {nodes.map((n) => (
        <g key={n.id} className="transition-all duration-500">
          {n.on && n.hub && <circle cx={n.x} cy={n.y} r={n.r + 6} fill={COL[n.c]} opacity={0.35} filter="url(#mm-glow)" />}
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.on ? COL[n.c] : "var(--muted)"} stroke={n.on ? "var(--background)" : "var(--muted-foreground)"} strokeOpacity={n.on ? 1 : 0.4} strokeWidth={2} className="transition-all duration-500" />
          <text x={n.x} y={n.y + n.r + 13} textAnchor="middle" className="fill-foreground text-[11px] font-bold">{n.label.slice(0, 14)}</text>
          {n.sub && <text x={n.x} y={n.y + n.r + 24} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px]">{n.sub}</text>}
        </g>
      ))}
    </svg>
  );
}
