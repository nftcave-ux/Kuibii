import { createFileRoute } from "@tanstack/react-router";
import { useExperience } from "@/components/experience";
import { ContractBuilder, type OptGroup } from "@/components/contract-builder";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [
    { title: "Smart transactions — Kuibii" },
    { name: "description", content: "Plan conditional transfers: triggers, timing, streaming, multi-send, backups and privacy." },
    { property: "og:title", content: "Smart transactions — Kuibii" },
    { property: "og:description", content: "Send tokens with conditions, triggers, schedules, streams and multi-send." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: TransactionsPage,
});

const GROUPS: OptGroup[] = [
  { id: "mode", pro: "Transfer type", kid: "How to send", multi: false, options: [
    { id: "single", pro: "Single send", kid: "Send to one", dpro: "One recipient, one amount.", dkid: "Give coins to one friend." },
    { id: "multi", pro: "Multi-send", kid: "Send to many", dpro: "Batch to many wallets (paste list).", dkid: "Give coins to lots of friends at once.", params: [{ key: "list", pro: "wallet,amount per line", kid: "friend,amount" }] },
    { id: "split", pro: "Percentage split", kid: "Share by %", dpro: "Split one amount by percentages.", dkid: "Cut the coins like a pizza.", params: [{ key: "shares", pro: "wallet:% ...", kid: "friend:% ..." }] },
    { id: "escrow", pro: "Escrow", kid: "Safe box", dpro: "Held until conditions pass, refundable otherwise.", dkid: "Coins wait in a safe box until the rules pass.", params: [{ key: "refund_days", pro: "Refund after days", kid: "Give back after days" }] },
  ] },
  { id: "timing", pro: "Timing", kid: "When", multi: false, options: [
    { id: "now", pro: "Immediately", kid: "Right now", dpro: "Execute as soon as conditions pass.", dkid: "Goes as soon as rules pass." },
    { id: "scheduled", pro: "Scheduled", kid: "Later", dpro: "At a date or block.", dkid: "On a day you pick.", params: [{ key: "at", pro: "Date or block", kid: "Day" }] },
    { id: "recurring", pro: "Recurring", kid: "Again and again", dpro: "Repeat every interval, N times.", dkid: "Pocket money every week!", params: [{ key: "every", pro: "Every (e.g. 7d)", kid: "Every" }, { key: "times", pro: "Times", kid: "How many times" }] },
    { id: "stream", pro: "Streaming", kid: "Drip drip", dpro: "Continuous per-second stream over a duration.", dkid: "Coins drip slowly like a tap.", params: [{ key: "duration", pro: "Duration (days)", kid: "Days" }, { key: "cliff", pro: "Cliff (days)", kid: "Wait first (days)" }] },
  ] },
  { id: "extras", pro: "Extras", kid: "Extras", multi: true, options: [
    { id: "none", pro: "None", kid: "Nothing extra", dpro: "Plain transfer.", dkid: "Keep it simple." },
    { id: "cancel", pro: "Cancelable", kid: "Can undo", dpro: "Sender can cancel before execution.", dkid: "You can change your mind." },
    { id: "backup", pro: "Backup recipient", kid: "Backup friend", dpro: "Fallback wallet if the recipient never claims.", dkid: "If they don't take it, it goes to someone else.", params: [{ key: "wallet", pro: "Backup wallet", kid: "Backup friend" }, { key: "days", pro: "After days", kid: "After days" }] },
    { id: "claim", pro: "Claim link", kid: "Gift link", dpro: "Recipient claims with a link/code.", dkid: "Send a secret link to open the gift." },
    { id: "memo", pro: "Encrypted memo", kid: "Secret note", dpro: "Attach a message only the recipient reads.", dkid: "Add a hidden note.", params: [{ key: "memo", pro: "Message", kid: "Note" }] },
  ] },
];

function TransactionsPage() {
  const { text } = useExperience();
  return <div className="mx-auto max-w-6xl px-6 py-12">
    <p className="mb-3 font-mono text-xs uppercase text-primary">KUIBII · {text("Smart transactions", "Magic sending")}</p>
    <h1 className="text-4xl font-bold">{text("Send with conditions", "Send coins with magic rules ✨")}</h1>
    <p className="mt-3 mb-10 max-w-2xl text-muted-foreground">{text("Combine triggers, timing, streaming, multi-send, backups and privacy into one transfer plan.", "Choose who gets coins, when, and what has to happen first.")}</p>
    <ContractBuilder kind="transaction" groups={GROUPS} extraFields={[
      { key: "token", pro: "Token / NFT", kid: "Which coin", placeholder: "USDC" },
      { key: "amount", pro: "Amount", kid: "How many" },
      { key: "to", pro: "Recipient", kid: "To who", placeholder: "0x… / name.eth" },
      { key: "chain", pro: "Chain", kid: "Chain", placeholder: "Ethereum" },
    ]} />
  </div>;
}
