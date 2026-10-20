import { createFileRoute } from "@tanstack/react-router";
import { useExperience } from "@/components/experience";
import { ContractBuilder, type OptGroup } from "@/components/contract-builder";

export const Route = createFileRoute("/trade")({
  head: () => ({ meta: [
    { title: "Smart trade contracts — Kuibii" },
    { name: "description", content: "Design personalised trade contracts: sell, buy, rent, borrow, stake or delegate tokens and NFTs with any condition." },
    { property: "og:title", content: "Smart trade contracts — Kuibii" },
    { property: "og:description", content: "Conditional commerce: auctions, rentals, crowdsales, multisig and time-based backups." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: TradePage,
});

const GROUPS: OptGroup[] = [
  { id: "action", pro: "Action", kid: "What to do", multi: false, options: [
    { id: "sell", pro: "Sell", kid: "Sell", dpro: "Sell your token / NFT.", dkid: "Swap your thing for coins." },
    { id: "buy", pro: "Buy", kid: "Buy", dpro: "Standing buy order.", dkid: "Get something you want." },
    { id: "rent", pro: "Rent", kid: "Lend for a while", dpro: "Time-limited usage rights, auto-return.", dkid: "Let a friend use it, then it comes back." , params: [{ key: "days", pro: "Days", kid: "Days" }, { key: "fee", pro: "Fee / day", kid: "Cost per day" }] },
    { id: "borrow", pro: "Borrow / lend", kid: "Borrow", dpro: "Collateralised loan against the asset.", dkid: "Borrow coins and give them back later.", params: [{ key: "ltv", pro: "Max LTV %", kid: "How much %" }, { key: "rate", pro: "Interest %", kid: "Extra to pay %" }] },
    { id: "stake", pro: "Stake", kid: "Stake", dpro: "Lock to earn rewards.", dkid: "Put it away to grow." },
    { id: "delegate", pro: "Delegate", kid: "Let someone vote", dpro: "Delegate voting / usage rights, keep ownership.", dkid: "Let a friend vote for you." },
  ] },
  { id: "pricing", pro: "Pricing model", kid: "How the price works", multi: false, options: [
    { id: "fixed", pro: "Fixed price", kid: "One price", dpro: "Set price.", dkid: "Same price for everyone.", params: [{ key: "price", pro: "Price", kid: "Price" }] },
    { id: "auction", pro: "English auction", kid: "Bidding game", dpro: "Highest bid wins by deadline.", dkid: "Biggest offer wins!", params: [{ key: "reserve", pro: "Reserve", kid: "Lowest ok" }, { key: "ends", pro: "Ends", kid: "Ends" }] },
    { id: "dutch", pro: "Dutch auction", kid: "Price goes down", dpro: "Price decays until someone buys.", dkid: "Price gets lower until someone buys.", params: [{ key: "start", pro: "Start", kid: "Start" }, { key: "floor", pro: "Floor", kid: "Lowest" }] },
    { id: "oracle", pro: "Price-based", kid: "Follows the market", dpro: "Execute only within an oracle price range.", dkid: "Only trades at a good price.", params: [{ key: "range", pro: "Min–max", kid: "From–to" }] },
    { id: "crowdsale", pro: "Crowdfunding / crowdsale", kid: "Team buy", dpro: "Many buyers fund a goal; refund if missed.", dkid: "Lots of friends chip in together.", params: [{ key: "goal", pro: "Goal", kid: "Goal" }, { key: "deadline", pro: "Deadline", kid: "Last day" }] },
  ] },
  { id: "structure", pro: "Ownership & parties", kid: "Who's involved", multi: true, options: [
    { id: "whole", pro: "Whole asset", kid: "The whole thing", dpro: "Trade 100%.", dkid: "Everything." },
    { id: "fraction", pro: "Sell / share %", kid: "Only a piece", dpro: "Sell or share a percentage (fractions).", dkid: "Share only a slice.", params: [{ key: "pct", pro: "%", kid: "%" }] },
    { id: "multibuy", pro: "Multi-buy", kid: "Buy many", dpro: "Bundle many items in one trade.", dkid: "Get lots at once." },
    { id: "multisig", pro: "Multisig", kid: "Friends approve", dpro: "M-of-N signers must approve.", dkid: "Enough friends must say yes.", params: [{ key: "m_of_n", pro: "M of N", kid: "e.g. 2 of 3" }] },
    { id: "backup", pro: "Time-based login backup", kid: "Check-in backup", dpro: "If owner doesn't log in for N days, assets go to a backup wallet.", dkid: "If you forget to check in, a backup friend gets it.", params: [{ key: "days", pro: "Days", kid: "Days" }, { key: "wallet", pro: "Backup wallet", kid: "Backup friend" }] },
  ] },
];

function TradePage() {
  const { text } = useExperience();
  return <div className="mx-auto max-w-6xl px-6 py-12">
    <p className="mb-3 font-mono text-xs uppercase text-primary">KUIBII · {text("Conditional commerce", "Swap shop")}</p>
    <h1 className="text-4xl font-bold">{text("Personalizable smart trade contract", "Trade your way 🤝")}</h1>
    <p className="mt-3 mb-10 max-w-2xl text-muted-foreground">{text("Trade your tokens / NFTs exactly the way you want: sell, buy, rent, borrow, stake or delegate — time-based, auction, price-based, crowdsale, multisig, backups, privacy and any provable condition. Set actions like send / buy / sell / bid / stake on time, block number or item drop.", "Sell, buy, lend or share your coins and treasures with your own rules.")}</p>
    <ContractBuilder kind="trade" groups={GROUPS} extraFields={[
      { key: "asset", pro: "Token / NFT", kid: "Which treasure", placeholder: "Collection #id or token" },
      { key: "amount", pro: "Amount", kid: "How many" },
      { key: "counterparty", pro: "Counterparty (optional)", kid: "Trade with (optional)", placeholder: "Anyone" },
      { key: "chain", pro: "Chain", kid: "Chain", placeholder: "Ethereum" },
    ]} />
  </div>;
}
