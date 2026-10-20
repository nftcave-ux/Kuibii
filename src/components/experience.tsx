import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const explanations = {
  name: ["A token's full name, used to identify this distribution.", "Give your magic coins a name, like naming your team."],
  symbol: ["The short ticker for your token. Letters and numbers only.", "A short nickname for your coins, like HBR for Harbor Coins."],
  supply: ["The total token supply. Recipient allocations should not exceed this amount.", "How many coins are in the whole treasure chest. Don't promise more than you have!"],
  decimals: ["The number of fractional digits a token supports (0–18). This does not change the total supply.", "Can a coin be split into tiny pieces? 0 means whole coins; 2 means pieces as small as 0.01."],
  network: ["The blockchain whose wallet address format this campaign uses. This app does not deploy tokens on-chain.", "Choose the world your coins belong to. Wallet addresses must match that world. No real coins are created here yet."],
  allocation: ["Fixed distributions give everyone the same amount. Tiered distributions assign amounts by group.", "Share the same treat with everyone, or give different groups different-sized loot drops."],
  amount: ["The number of tokens allocated to each recipient.", "How many coins each friend gets from the treasure chest."],
  tier: ["A named allocation group. Match the tier column in your CSV exactly. Missing or unmatched tiers use the first group.", "A team with its own treat size. Use the same team name in your list; unknown teams join the first team."],
  tierAmount: ["The token amount allocated to each recipient in this tier.", "How many coins each friend on this team gets."],
  vesting: ["Vesting releases an allocation over time rather than all at once.", "A treasure chest with a timer: some coins unlock now, and more unlock later."],
  tge: ["Percentage of the allocation unlocked at the token generation event, or launch.", "The slice of your treasure you can open right at the start. 20% means 20 out of every 100 coins."],
  cliff: ["The waiting period in months after launch. The first monthly release occurs one month after this period ends.", "A waiting timer before the monthly coin drops start. The first drop is one month after the waiting timer finishes."],
  duration: ["The number of monthly releases for the remaining allocation after the cliff.", "How many monthly treasure drops share out the coins that are still locked."],
  schedule: ["Each point shows the month since launch and cumulative percentage unlocked. Month 0 is launch.", "Each bar shows how much treasure is open by that month. Month 0 is the start."],
  person: ["The recipient's name, stored with their wallet registration.", "Your name, so the organizer knows which friend is joining."],
  email: ["The recipient's email address, stored with their registration. It is not a wallet address.", "An email address where the organizer can contact you. Ask a trusted grown-up before sharing it."],
  wallet: ["The public wallet address matching the campaign network. Never enter a seed phrase or private key.", "Like your coin mailbox address. Never share its secret password or recovery words."],
  csv: ["A CSV file with a header row: wallet (required), name, email, tier (optional). Address/wallet_address and group aliases are accepted. Invalid or duplicate wallets are skipped.", "A spreadsheet guest list. Put wallet at the top of the mailbox column, plus optional name, email and tier columns. Repeated or invalid mailboxes are skipped."],
  conditions: ["Eligibility rules. Sign-up rules (dates, caps, email domain, invite code) are enforced automatically. On-chain and social rules are recorded and exported for you to verify before payout.", "Secret rules for who can get treats. Some rules the door-keeper checks right away (like a party start time); others are a checklist you look at before handing out the coins."],
  useCases: ["Ready-made templates for common distributions. Picking one fills in the form; you can edit everything afterwards.", "Pick a party idea and we fill in the rules for you, like a recipe card. You can still change anything."],
  inviteCode: ["The secret code the organizer shared with you. Required for this distribution.", "The secret password for this party. Ask the organizer for it."],
  features: ["Smart-contract capabilities for the token itself (supply control, safety limits, fees, standards). Saved as a spec; no contract is deployed here.", "Superpowers built into the coin, like a shredder or a freeze button. This is a plan; no real coin is made yet."],
  perks: ["What holders can do with the token: vote, stake, unlock access, get discounts, pay in-app.", "Fun things your coins let friends do, like voting or entering a secret clubhouse."],
  tokenomics: ["How total supply is split across buckets (should total 100%), plus inflation, burn plan and initial price.", "Cut the treasure pie into slices for friends, builders and the club piggy bank. All slices make 100%."],
  branding: ["Logo, description and links shown with the token.", "Give your coin a picture and a story so friends know what it is."],
  source: ["How the recipient was added: CSV import or public registration.", "Did this friend join from your spreadsheet list or from your sign-up link?"],
  recipients: ["The number of registered or imported wallet recipients.", "How many friends are on your coin-sharing list."],
  allocated: ["The sum of token allocations across all recipients. This is a plan, not an on-chain transfer.", "All the coins promised to friends added together. This is a sharing plan, not a real coin delivery."],
  registration: ["Controls whether the public form accepts new recipients. Existing recipients are unaffected.", "Open or close the guest-list door. Friends already on the list stay there."],
  privateLink: ["This link contains your secret management key. Anyone with it can manage this distribution. Keep it private.", "This is the key to your Coin Vault. Anyone holding it can change your list, so keep it secret."],
  publicLink: ["Share this link for wallet registration. It does not grant campaign management access.", "Your invitation link. Friends can join the list, but cannot open your Coin Vault."],
  export: ["Downloads wallet, name, email, tier and amount columns. Exporting does not send tokens.", "Save your coin-sharing list as a spreadsheet. Saving the list does not deliver real coins."],
  scheduleExport: ["Downloads wallet, month, unlocked_percent and cumulative_amount: the cumulative tokens unlocked at each monthly point.", "Save the treasure timetable: mailbox, month, percent opened, and total coins opened so far."],
  project: ["The name of the project receiving simulated staking yield.", "Name the project your piggy-bank rewards will help."],
  description: ["Describe the project's purpose to prospective backers.", "Tell friends what your team wants to make."],
  asset: ["The yield-bearing asset used for this campaign's simulated deposits. No wallet funds are transferred.", "Choose what goes in your pretend piggy bank. This app records practice deposits, not real money."],
  apr: ["Expected annual percentage rate. Yield is simulated using a constant simple rate; actual staking rates vary.", "The pretend reward rate for one year. At 3%, 100 coins make about 3 extra coins in a year. Real rewards can change."],
  goal: ["The target amount of staking yield for the project treasury, denominated in the selected asset.", "How many extra piggy-bank coins the project hopes to collect, not the coins you put in."],
  pool: ["The total project-token pool shared in proportion to each backer's yield contribution at campaign end.", "The reward chest for all helpers. Your share depends on how many extra coins your piggy bank contributed."],
  days: ["Campaign duration in days. Yield accrual stops at the deadline and claims become available then.", "How many days the piggy-bank challenge lasts. Reward collection opens when the timer ends."],
  yield: ["Simulated staking rewards accrued for the treasury, separate from deposited principal.", "The extra drops from your piggy-bank faucet that help the project, not your original coins."],
  principal: ["The original deposited amount, recorded separately from yield. This is a simulation: real staking carries price, slashing, liquidity and smart-contract risks.", "The coins you first put in your pretend piggy bank. They are tracked separately from rewards. Real piggy-bank staking can lose money; ask a trusted grown-up."],
  backers: ["The number of unique wallet backers supporting this campaign.", "How many different coin mailboxes have helped this project."],
  progress: ["Treasury yield divided by the target yield, capped at 100%. Meeting the goal does not trigger a claim early.", "How full the project's reward jar is compared with its goal. A full jar doesn't end the timer early."],
  deposit: ["Records a simulated deposit. Yield is calculated from amount × APR × time; no blockchain transaction occurs.", "Add practice coins to your pretend piggy bank. Bigger deposits and more time create more pretend reward drops."],
  projected: ["Estimated yield = amount × APR / 100 × remaining days / 365. Assumes the deposit remains for the full period; not a guarantee.", "A guess at how many extra drips your piggy bank makes before the timer ends. Take coins out early and it makes fewer drips."],
  positions: ["Your deposit credentials are saved in this browser. Clearing storage or switching browsers removes local access.", "Your piggy-bank keys live in this browser. Clearing it or changing devices can lose your keys."],
  estimate: ["Estimated token share = your accrued yield / total treasury yield × token pool. The share changes as others contribute; final claims are calculated at campaign end.", "Your guessed slice of the reward chest. It can shrink or grow as friends help; the final slice is decided when the timer ends."],
  claimed: ["The project-token amount already recorded as claimed. No real tokens are transferred.", "Practice rewards you have already collected. No real coins are sent."],
  withdraw: ["Records return of the full simulated principal and stops future yield for this deposit. Past yield still counts toward token claims.", "Take your original practice coins out. The reward faucet stops, but the drips you already gave still count."],
  claim: ["Available after campaign end. Records your pro-rata token allocation once; no on-chain transfer occurs.", "When the timer ends, collect your practice share of the treasure once. No real coins are delivered."],
  format: ["The token standard. It determines divisibility, uniqueness and which features apply; incompatible features are rejected.", "What kind of treasure: everyday coins, unique collectibles, or puzzle shares of one collectible."],
  fractional: ["A single NFT held in a vault and split into divisible shares. Set the source NFT, shares and redemption policy.", "One special collectible cut into puzzle pieces that many friends can own."],
  vaultAsset: ["The asset deposited into the ERC-4626 vault that shares represent.", "What goes inside the vault that your tickets stand for."],
  itemIds: ["ERC-1155 item IDs, each with its own supply.", "List each kind of item and how many of it exist."],
  nesting: ["NFT containers that hold tokens, NFTs or fractions, and can contain further containers to any depth, each with its own release rule.", "Gift boxes that hold coins, and boxes inside boxes — like Russian dolls."],
  nftCount: ["How many container NFTs this layer mints.", "How many gift boxes of this kind."],
  vaultContents: ["What each container NFT holds and how much.", "What's inside each box and how much."],
  beneficiary: ["Who receives the contents when released: heir, colleague, student or gift recipient.", "Who gets to open the box."],
  releaseRule: ["When contents unlock: immediately, after a time, after a provable condition, or both.", "When the box can be opened: now, after a timer, after proving something, or both."],
  proof: ["A provable condition and who or what verifies it: on-chain event, signed attestation, multisig, oracle or organizer review.", "Something you can prove, like graduating, and who checks it."],
  cascade: ["A chain of distinct limited-supply tokens. Stage 1 is free; each later stage requires holding the previous token.", "Get treasure 1 free, show it to get treasure 2, show 2 to get 3…"],
  stageSupply: ["The capped supply of a cascade stage token and how much each recipient gets.", "How many of this treasure exist and how many each friend gets."],
} as const;

export type HelpTopic = keyof typeof explanations;
const ExperienceContext = createContext({ kid: false, setKid: (_value: boolean) => {} });
export const useExperience = () => {
  const { kid, setKid } = useContext(ExperienceContext);
  return { kid, setKid, text: (pro: string, child: string) => kid ? child : pro };
};

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [kid, setKidState] = useState(false);
  useEffect(() => { try { setKidState(localStorage.getItem("mint-mode") === "kid"); } catch {} }, []);
  const setKid = (value: boolean) => {
    setKidState(value);
    try { localStorage.setItem("mint-mode", value ? "kid" : "pro"); } catch {}
  };
  return <ExperienceContext.Provider value={{ kid, setKid }}><TooltipProvider delayDuration={200}>{children}</TooltipProvider></ExperienceContext.Provider>;
}

export function Help({ topic, children }: { topic: HelpTopic; children?: ReactNode }) {
  const { kid } = useExperience();
  const [open, setOpen] = useState(false);
  const description = explanations[topic][kid ? 1 : 0];
  return <span className="inline-flex max-w-full items-center gap-1.5 align-middle">
    {children}
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" aria-label={`Explain ${topic}`} onPointerEnter={(event) => { if (event.pointerType === "mouse") setOpen(true); }} onPointerLeave={(event) => { if (event.pointerType === "mouse") setOpen(false); }} onClick={(event) => { event.preventDefault(); setOpen(true); }}>
          <CircleHelp aria-hidden="true" className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[min(320px,calc(100vw-32px))] whitespace-normal border border-border bg-popover p-3 text-sm font-sans font-normal normal-case leading-relaxed text-popover-foreground" onPointerDownOutside={() => setOpen(false)}>{description}</TooltipContent>
    </Tooltip>
  </span>;
}

export function Field({ topic, label, children, className }: { topic: HelpTopic; label: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return <div className={className}><div className="mb-1 flex items-center"><Help topic={topic}><Label htmlFor={id}>{label}</Label></Help></div>{children(id)}</div>;
}

export function AppHeader() {
  const { kid, setKid, text } = useExperience();
  return <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-6">
    <Link to="/" className="font-mono text-sm tracking-widest">KUIBII</Link>
    <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
      <Link to="/" className="text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>{text("Conditional Distribution", "🍬 Treat Sharing")}</Link>
      <Link to="/launchpad" className="text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>{text("Staking Launchpad", "🐷 Piggy Bank Staking")}</Link>
      <Link to="/games" className="text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>{text("Games", "🎮 Games")}</Link>
      <Link to="/how-it-works" className="text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>{text("How it works", "📖 How it works")}</Link>
      <div className="flex items-center gap-2 border-l border-border pl-4">
        <Label htmlFor="kid-mode" className={kid ? "text-primary" : "text-muted-foreground"}>Kid Mode</Label>
        <Switch id="kid-mode" aria-label="Kid Mode / Pro Mode" checked={kid} onCheckedChange={setKid} />
        <Label htmlFor="kid-mode" className={kid ? "text-muted-foreground" : "text-primary"}>Pro Mode</Label>
      </div>
    </nav>
  </header>;
}