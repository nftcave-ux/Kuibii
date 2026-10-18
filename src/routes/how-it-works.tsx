import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Coins, ListChecks, PiggyBank, ShieldCheck, Timer, Users } from "lucide-react";
import { useState } from "react";
import { Help, useExperience } from "@/components/experience";
import { Button } from "@/components/ui/button";
import { CONDITIONS, USE_CASES } from "@/lib/conditions";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [
    { title: "How it works — Mint Press" },
    { name: "description", content: "A practical guide to token distributions, simulated staking, eligibility conditions and campaign templates." },
    { property: "og:title", content: "How it works — Mint Press" },
    { property: "og:description", content: "Plan your distribution, understand staking yield and explore every eligibility rule." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GuidePage,
});

const details: Record<string, [string, string]> = {
  opens_at: ["Accept public registrations only after the chosen date and time.", "The party door stays closed until your start time."],
  closes_at: ["Stop public registrations at the chosen date and time.", "The party door closes when the timer rings."],
  snapshot: ["Record when token or NFT ownership should be measured. Verify historical holdings before payout.", "Take a photo of who had coins on that day; check the photo before sharing treats."],
  transfer_lock: ["Record a date before which recipients should not transfer tokens. This app does not enforce an on-chain lock.", "Write down when swapping is allowed. This rule is a promise, not a real lock here."],
  max_recipients: ["Cap public sign-ups at the chosen number of recipients, first come first served.", "Only the first N friends get a place on the guest list."],
  email_domain: ["Require a public registrant's email to end in the selected domain, such as acme.com. This does not verify email ownership.", "Only email addresses from your school or club can join. The address still needs checking."],
  invite_code: ["Require the organizer's code on the public sign-up form. Share it with intended recipients.", "Friends need the secret party password to join."],
  hold_token: ["Specify a token and minimum balance. Check the recipient's holdings before payout.", "A friend needs at least X of another coin to get these treats."],
  hold_nft: ["Specify an NFT collection and minimum number held. Verify ownership before payout.", "Check that each friend owns enough special stickers from your collection."],
  native_balance: ["Require a minimum balance of the network's native asset, such as ETH or SOL.", "Check that the coin mailbox has a little gas money in it."],
  hold_duration: ["Specify a token and minimum holding period in days. Verify the wallet's history.", "Reward friends who kept their coins for long enough, instead of swapping them straight away."],
  staker: ["Specify an asset and minimum staked amount. Verify the staking position before payout.", "Check that a friend has enough coins saved in a staking piggy bank."],
  lp_provider: ["Name the liquidity pool whose participants qualify. Verify each wallet's pool position.", "Reward friends who share coins at the market stall."],
  wallet_age: ["Set a minimum wallet age in days. Decide what activity establishes its age and verify it.", "The coin mailbox must have been around for N days."],
  tx_count: ["Require a minimum number of transactions. Verify activity on the intended network.", "A friend must have sent at least N coin letters."],
  used_contract: ["Specify a smart contract the wallet must have interacted with. Check transaction history.", "Check that your friend has played with this particular blockchain toy before."],
  volume: ["Require a minimum trading volume in USD. Verify the relevant trades and valuation period.", "Reward friends who traded at least this much at the coin market."],
  bridged: ["Specify the source chain from which funds should have been bridged. Verify the transfer history.", "Check that the coins crossed the bridge from the chosen world."],
  dao_voter: ["Name a DAO or voting space and a minimum vote count. Verify proposal participation.", "Thank friends who voted enough times at the club meeting."],
  poap: ["Name the event whose attendance credential qualifies a recipient. Verify the proof.", "Check a friend's party attendance badge."],
  social_follow: ["Specify the social handle recipients should follow. Verify follows before payout.", "Check that a friend follows your team's page."],
  discord_role: ["Specify a Discord server and role. Verify each recipient's membership and role.", "Check that your friend has the right club badge."],
  github: ["Name a repository and verify each recipient's contributions before payout.", "Thank friends who helped build your project."],
  referrals: ["Set a minimum number of referred users. Verify referrals and reject duplicates or self-referrals.", "Check that your friend invited N real new friends."],
  customer: ["Describe the purchase or customer proof required. Review that evidence before payout.", "Check a shop receipt before giving customer rewards."],
  kyc: ["Name the identity-verification provider. Verification happens outside this app; adding this rule does not perform KYC.", "A trusted checker confirms who the person is. This app does not check their ID."],
  geo_block: ["List excluded countries. Verify eligibility externally; this rule does not determine legal compliance.", "Some places cannot join. The organizer checks this before sharing."],
  sybil_score: ["Set a minimum humanity score, for example from Passport. Verify the score with the chosen service.", "Use a real-person badge to help spot one person pretending to be many friends."],
  early_bird: ["Give the first N recipients an extra percentage on their base allocation. Recipient ordering determines who qualifies.", "The first N friends get extra treats: a 25% bonus turns 100 coins into 125."],
};

const groups = [...new Set(CONDITIONS.map((condition) => condition.group))];

function GuidePage() {
  const { text, kid } = useExperience();
  const [group, setGroup] = useState("All");
  const [search, setSearch] = useState("");
  const visible = CONDITIONS.filter((condition) => (group === "All" || condition.group === group) && `${condition.pro} ${condition.kid} ${condition.group} ${details[condition.id]?.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="mx-auto max-w-6xl px-6 pb-24">
    <section className="border-b border-border py-12">
      <p className="mb-4 font-mono text-xs uppercase text-primary">MINT/PRESS · {text("Field guide", "Adventure guide 🧭")}</p>
      <h1 className="text-5xl font-bold leading-tight">{text("How it works", "How it works ✨")}</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{text("Choose who gets tokens, when they unlock, and how projects earn support. Start with a plan. Keep the rules clear.", "Make a treasure-sharing plan, pick who can join, and set the timers. Let's open the map!")}</p>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <a href="#distribution" className="flex items-center gap-2 text-primary"><Coins size={16} />{text("Token distributions", "Share treasure")}</a>
        <a href="#staking" className="flex items-center gap-2 text-primary"><PiggyBank size={16} />{text("Staking launchpad", "Piggy-bank rewards")}</a>
        <a href="#conditions" className="flex items-center gap-2 text-primary"><ListChecks size={16} />{text("All 29 conditions", "All 29 party rules")}</a>
      </div>
      <p className="mt-8 border-l-2 border-primary pl-4 text-sm text-muted-foreground">{text("Planning & simulation only. No real tokens are created, funds staked or tokens transferred. Real staking is not risk-free.", "This is a practice adventure. No real coins are made, saved or sent. Real staking can lose money.")}</p>
    </section>

    <section id="distribution" className="scroll-mt-6 py-12">
      <div className="flex items-center gap-3"><Coins className="text-primary" /><h2 className="text-2xl font-bold">{text("01 / Plan a distribution", "01 / Share your treasure 🍬")}</h2></div>
      <ol className="mt-8 grid gap-8 md:grid-cols-3">
        {([
          ["Name your token", "Name your magic coins", "Set the name, symbol, supply and network. Choose equal amounts for everyone or tiers for different groups.", "Name your treasure, choose how many coins there are, and give everyone the same treat or different team treats."],
          ["Set rules & unlocks", "Pick rules and timers", "Add eligibility conditions and optional vesting: the launch percentage, cliff and monthly release duration.", "Choose your party rules. A timer chest can open a little now and share the rest in monthly drops."],
          ["Invite, review, export", "Invite friends and check the list", "Import a CSV or share the registration link. Review eligibility and allocations, then export your plan. Keep your management link private.", "Bring a spreadsheet guest list or send an invitation. Check who qualifies, save your plan, and keep your vault key secret."],
        ] as const).map(([pro, child, description, analogy], index) => <li key={pro} className="border-t border-border pt-4"><span className="font-mono text-sm text-primary">0{index + 1}</span><h3 className="mt-3 font-bold">{text(pro, child)}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text(description, analogy)}</p></li>)}
      </ol>
      <div className="mt-6 flex flex-wrap gap-4 text-sm"><Help topic="csv">CSV: wallet, name, email, tier</Help><Help topic="vesting">{text("Vesting schedule", "Unlock timers")}</Help><Help topic="privateLink">{text("Private management link", "Secret vault key")}</Help></div>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm text-primary">{text("Create a distribution", "Plan your treasure sharing")}<ArrowRight size={16} /></Link>
    </section>

    <section id="staking" className="scroll-mt-6 border-t border-border py-12">
      <div className="flex items-center gap-3"><PiggyBank className="text-primary" /><h2 className="text-2xl font-bold">{text("02 / Support with yield", "02 / Help with reward drips 🐷")}</h2></div>
      <p className="mt-4 max-w-2xl text-muted-foreground">{text("Projects choose an asset, expected APR, yield goal, token pool and deadline. Backers record practice deposits; only their simulated rewards count toward project funding.", "A team sets a piggy-bank challenge. Your practice coins make extra reward drips for the team, while your original coins stay on a separate list.")}</p>
      <div className="mt-8 grid items-start gap-5 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="border-t border-primary pt-5"><ShieldCheck className="mb-3 text-primary" /><h3 className="font-bold">{text("Your principal", "Your original coins")}</h3><p className="mt-2 text-sm text-muted-foreground">{text("Tracked separately. Withdraw the full simulated amount at any time; future yield then stops.", "Take your practice coins back anytime. The reward faucet stops for that deposit.")}</p></div>
        <ArrowRight className="mt-6 hidden text-muted-foreground md:block" /><ArrowDown className="mx-auto text-muted-foreground md:hidden" />
        <div className="border-t border-primary pt-5"><PiggyBank className="mb-3 text-primary" /><h3 className="font-bold">{text("Yield → treasury", "Drips → project jar")}</h3><p className="mt-2 text-sm text-muted-foreground">{text("Amount × APR × time generates simulated yield. Previously earned yield still counts after withdrawal.", "More coins and more time make more pretend drips. The drips you already gave still count after you leave.")}</p></div>
        <ArrowRight className="mt-6 hidden text-muted-foreground md:block" /><ArrowDown className="mx-auto text-muted-foreground md:hidden" />
        <div className="border-t border-primary pt-5"><Timer className="mb-3 text-primary" /><h3 className="font-bold">{text("Tokens at the finish", "Treasure at the finish")}</h3><p className="mt-2 text-sm text-muted-foreground">{text("After the deadline, claim once per deposit. Your yield ÷ total yield × token pool determines the allocation. No yield means no allocation.", "When the timer ends, collect once for each piggy bank. Your share of all the drips decides your share of the treasure. No drips means no reward.")}</p></div>
      </div>
      <div className="mt-8 border-y border-border py-5"><p className="font-mono text-xs text-primary">{text("ILLUSTRATIVE EXAMPLE", "PRETEND EXAMPLE")}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text("100 stETH at 3% APR for 30 days produces about 0.2466 stETH of simulated yield. Contributing 10% of total yield earns 10% of the project-token pool. Actual rates and token value are not guaranteed.", "100 practice coins at 3% a year make about 0.2466 extra coins in 30 days. Give 10% of all the reward drips and you get 10% of the treasure chest. Real rewards can change.")}</p></div>
      <div className="mt-5 flex flex-wrap gap-4 text-sm"><Help topic="principal">{text("Principal & risks", "Original coins & risks")}</Help><Help topic="positions">{text("Browser-saved access", "Your piggy-bank keys")}</Help><Help topic="claim">{text("Claims", "Collect rewards")}</Help></div>
      <Link to="/launchpad" className="mt-6 inline-flex items-center gap-2 text-sm text-primary">{text("Open the launchpad", "Open piggy-bank staking")}<ArrowRight size={16} /></Link>
    </section>

    <section id="conditions" className="scroll-mt-6 border-t border-border py-12">
      <div className="flex items-center gap-3"><ListChecks className="text-primary" /><h2 className="text-2xl font-bold">{text("03 / Distribution conditions", "03 / The party rulebook 📋")}</h2></div>
      <p className="mt-4 max-w-3xl text-muted-foreground">{text("These rules belong to token distributions, not staking deposits. Sign-up checks run on the public registration form. Other eligibility rules are a review checklist, not automatic blockchain or social verification.", "These are treasure-sharing rules, not piggy-bank rules. The invitation door checks some rules. You must check the other badges yourself before handing out treasure.")}</p>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{text("CSV imports bypass sign-up checks, so review imported recipients yourself. Early-bird bonuses use the order recipients were added, including imports; check total allocations against your supply.", "Spreadsheet friends skip the invitation door, so check their rules yourself. Early-bird treats follow the order friends joined the list, including spreadsheets. Don't promise more coins than your chest holds.")}</p>
      <div className="mt-6 grid gap-5 text-sm md:grid-cols-3">
        <p><span className="block font-mono text-xs text-primary">{text("SIGN-UP CHECK", "DOOR CHECK")}</span><span className="mt-2 block text-muted-foreground">{text("Automatically enforced on public registration.", "The invitation door checks this for you.")}</span></p>
        <p><span className="block font-mono text-xs text-primary">{text("VERIFY BEFORE PAYOUT", "CHECK THE BADGE")}</span><span className="mt-2 block text-muted-foreground">{text("Recorded for the organizer to verify externally.", "You check this before giving out treats.")}</span></p>
        <p><span className="block font-mono text-xs text-primary">{text("ALLOCATION BONUS", "EXTRA TREATS")}</span><span className="mt-2 block text-muted-foreground">{text("Changes the allocation for qualifying recipients.", "Adds more coins to the reward amount.")}</span></p>
      </div>
      <div className="mt-8"><label htmlFor="condition-search" className="mb-2 block text-sm">{text("Find a condition", "Find a party rule")}</label><input id="condition-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text("Search holdings, dates, community…", "Search coins, timers, friends…")} className="h-11 w-full rounded border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:max-w-md" /></div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Condition categories">{["All", ...groups].map((category) => <Button key={category} variant={group === category ? "default" : "outline"} size="sm" aria-pressed={group === category} onClick={() => setGroup(category)}>{category}</Button>)}</div>
      <p className="mt-5 font-mono text-xs text-muted-foreground">{visible.length} / {CONDITIONS.length} {text("conditions", "rules")}</p>
      <div className="mt-3 grid gap-x-10 md:grid-cols-2">{visible.map((condition) => <article key={condition.id} className="border-t border-border py-6">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs"><span className="text-muted-foreground">{condition.group}</span><span className="text-primary">{condition.check === "signup" ? text("Sign-up check", "Door check") : condition.check === "bonus" ? text("Allocation bonus", "Extra treats") : text("Verify before payout", "Check the badge")}</span></div>
        <h3 className="mt-3 font-bold">{text(condition.pro, condition.kid)}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{details[condition.id]?.[kid ? 1 : 0]}</p>
        <p className="mt-3 text-xs text-muted-foreground"><span className="text-foreground">{text("Set:", "Choose:")}</span> {condition.params.map((param) => param.label).join(" · ")}</p>
      </article>)}</div>
      {visible.length === 0 && <p className="py-8 text-muted-foreground">{text("No matching conditions.", "No rules found.")}</p>}
    </section>

    <section className="border-t border-border pt-12">
      <div className="flex items-center gap-3"><Users className="text-primary" /><h2 className="text-2xl font-bold">{text("04 / Ideas to start with", "04 / Pick an adventure 🎉")}</h2></div>
      <p className="mt-4 text-muted-foreground">{text("Use these editable templates in the distribution creator. They are examples, not live campaigns.", "These are recipe ideas for sharing treasure, not real projects. Change any ingredient!")}</p>
      <div className="mt-6 grid gap-x-10 sm:grid-cols-2">{USE_CASES.map((example) => <article key={example.id} className="border-t border-border py-5"><h3 className="font-bold">{text(example.pro, example.kid)}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{kid ? example.conditions.map((condition) => CONDITIONS.find((definition) => definition.id === condition.type)?.kid).join(" · ") : example.blurb}</p></article>)}</div>
    </section>
  </div>;
}