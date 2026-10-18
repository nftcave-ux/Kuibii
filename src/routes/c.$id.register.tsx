import { Field, Help, useExperience } from "@/components/experience";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicCampaign, registerRecipient } from "@/lib/campaigns.functions";
import { CHAINS } from "@/lib/distribution";
import { describe } from "@/lib/conditions";

export const Route = createFileRoute("/c/$id/register")({
  loader: ({ params }) => getPublicCampaign({ data: { id: params.id } }),
  head: ({ loaderData }) => {
    const t = loaderData ? `Register for ${loaderData.name} (${loaderData.symbol})` : "Token registration";
    const d = "Add your wallet to receive tokens from this distribution.";
    return { meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  errorComponent: () => <p className="p-10 text-center">This page didn't load.</p>,
  notFoundComponent: () => <p className="p-10 text-center">Not found.</p>,
  component: RegisterPage,
});

function RegisterPage() {
  const { text, kid } = useExperience();
  const c = Route.useLoaderData();
  const { id } = Route.useParams();
  const register = useServerFn(registerRecipient);
  const [f, setF] = useState({ name: "", email: "", wallet: "", code: "" });
  const [state, setState] = useState<{ done?: boolean; error?: string; busy?: boolean }>({});

  if (!c) return <p className="p-10 text-center text-muted-foreground">This distribution doesn't exist.</p>;
  const chain = CHAINS.find((x) => x.id === c.chain)?.label ?? c.chain;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <span className="font-mono text-xs text-primary"><Help topic="network">{chain}</Help> · <Help topic="symbol">{c.symbol}</Help></span>
      <h1 className="mt-2 text-4xl font-bold">{c.name}</h1>
      <h2 className="mt-3 text-lg"><Help topic="registration">{text("Token registration", "Join the treasure list 🎁")}</Help></h2>
      {c.conditions.length > 0 && (
        <div className="mt-4 rounded border border-border p-3 text-sm">
          <Help topic="conditions"><span className="font-bold">{text("Eligibility", "Party rules")}</span></Help>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">{c.conditions.map((x, i) => <li key={i}>{x.type === "invite_code" ? text("Invite code required", "Secret password needed 🤫") : describe(x, kid)}</li>)}</ul>
        </div>
      )}
      {state.done ? (
        <p className="mt-8 rounded border border-primary p-5">{text("You're on the list. This records your allocation request; it does not send tokens.", "You're on the treasure list! This saves your request, but doesn't deliver real coins.")}</p>
      ) : !c.registration_open ? (
        <p className="mt-8 text-muted-foreground">Registration is closed.</p>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          setState({ busy: true });
          const r = await register({ data: { id, ...f } }).catch(() => ({ ok: false as const, error: "Please check your details." }));
          setState(r.ok ? { done: true } : { error: r.error });
        }}>
          <Field topic="person" label={text("Name", "Your name")}>{(fieldId) => <Input id={fieldId} required maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
          <Field topic="email" label={text("Email", "Contact email")}>{(fieldId) => <Input id={fieldId} required type="email" maxLength={255} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
          <Field topic="wallet" label={text(`${chain} wallet address`, `Coin mailbox on ${chain} 📬`)}>{(fieldId) => <Input id={fieldId} required className="font-mono" maxLength={64} placeholder={c.chain === "solana" ? "Base58 address" : "0x…"} value={f.wallet} onChange={(e) => setF({ ...f, wallet: e.target.value })} />}</Field>
          {c.needsCode && <Field topic="inviteCode" label={text("Invite code", "Secret password 🤫")}>{(fieldId) => <Input id={fieldId} required maxLength={100} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />}</Field>}
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button className="w-full" disabled={state.busy}>{state.busy ? text("Registering…", "Adding you to the list…") : text("Register", "Join the treasure list 🎁")}</Button>
        </form>
      )}
    </div>
  );
}
