import { emptyBlueprint, type TokenBlueprint } from "./token-blueprint";
export type UtilityParam = { key: string; label: string; kind: "number" | "text"; placeholder?: string | undefined };
export type UtilityDef = { id: string; group: string; pro: string; kid: string; info: string; kidInfo: string; params: UtilityParam[] };

const p = (key: string, label: string, kind: "number" | "text" = "number", placeholder?: string): UtilityParam => ({ key, label, kind, placeholder });

export const FEATURES: UtilityDef[] = [
  { id: "royalties", group: "Collectibles", pro: "Royalty signal (EIP-2981)", kid: "Creator thank-you 🎨", info: "Signals a royalty percentage; marketplace payment is not guaranteed.", kidInfo: "Ask shops to thank the artist with a small share. Shops may not pay it.", params: [p("pct", "Royalty %"), p("wallet", "Creator wallet", "text")] },
  { id: "metadata", group: "Collectibles", pro: "Metadata & provenance", kid: "Collectible story 📜", info: "Record artwork metadata and provenance references.", kidInfo: "Give your collectible a picture and a story of where it came from.", params: [p("uri", "Metadata URI", "text")] },
  { id: "reveal", group: "Collectibles", pro: "Delayed reveal", kid: "Surprise reveal 🎁", info: "Plan when hidden artwork becomes visible.", kidInfo: "Keep the picture a surprise until opening day.", params: [p("date", "Reveal date", "text")] },
  { id: "composable", group: "Collectibles", pro: "Composable NFT custody", kid: "Dolls inside dolls 🪆", info: "Plan NFT containers holding tokens or child NFTs; requires a custom custody contract.", kidInfo: "A collectible can be a box holding coins or more boxes.", params: [] },
  { id: "recovery", group: "Collectibles", pro: "Guardian recovery", kid: "Trusted key helper 🗝️", info: "Designated guardians authorize recovery according to a planned policy.", kidInfo: "Trusted helpers can help recover a badge under agreed rules.", params: [p("guardians", "Guardian policy", "text")] },
  { id: "burnable", group: "Supply control", pro: "Burnable", kid: "Coin shredder 🔥", info: "Holders can permanently destroy their tokens, reducing supply.", kidInfo: "Coins can be thrown in a magic fire and vanish forever.", params: [] },
  { id: "mintable", group: "Supply control", pro: "Mintable (owner)", kid: "Coin printer 🖨️", info: "The owner can create new tokens up to an optional hard cap.", kidInfo: "The boss can print new coins, but never past the limit.", params: [p("cap", "Max supply cap")] },
  { id: "deflation", group: "Supply control", pro: "Auto-burn per transfer", kid: "Shrinking coins 🫧", info: "A % of every transfer is burned.", kidInfo: "Each time coins move, a tiny bit disappears.", params: [p("pct", "Burn %")] },
  { id: "pausable", group: "Safety", pro: "Pausable", kid: "Freeze button ⏸️", info: "The owner can pause all transfers in an emergency.", kidInfo: "A big red button that stops all coin trading for a while.", params: [] },
  { id: "blacklist", group: "Safety", pro: "Blocklist", kid: "No-entry list 🚫", info: "The owner can block specific addresses from transferring.", kidInfo: "Naughty mailboxes can be stopped from sending coins.", params: [] },
  { id: "max_wallet", group: "Safety", pro: "Max wallet size", kid: "Pocket limit 👖", info: "No address may hold more than this % of supply.", kidInfo: "Nobody can stuff more than this much in their pocket.", params: [p("pct", "Max % of supply")] },
  { id: "max_tx", group: "Safety", pro: "Max transaction size", kid: "Hand size limit ✋", info: "Caps a single transfer as % of supply.", kidInfo: "You can only pass this many coins at once.", params: [p("pct", "Max % per transfer")] },
  { id: "cooldown", group: "Safety", pro: "Trade cooldown", kid: "Take a breath ⏱️", info: "Minimum seconds between transfers from one address.", kidInfo: "Wait a little between each coin trade.", params: [p("seconds", "Seconds")] },
  { id: "anti_bot", group: "Safety", pro: "Launch anti-bot", kid: "Robot guard 🤖", info: "Blocks trades in the first N blocks after launch.", kidInfo: "Robots can't grab coins in the first moments.", params: [p("blocks", "Blocks")] },
  { id: "tax", group: "Fees", pro: "Transfer tax", kid: "Toll bridge 🌉", info: "A % fee on transfers sent to a treasury wallet.", kidInfo: "A small toll is paid every time coins cross the bridge.", params: [p("pct", "Tax %"), p("wallet", "Treasury wallet", "text")] },
  { id: "reflection", group: "Fees", pro: "Holder reflections", kid: "Sharing sprinkle ✨", info: "Part of each transfer is redistributed to all holders.", kidInfo: "Everyone holding coins gets a sprinkle when others trade.", params: [p("pct", "Reflection %")] },
  { id: "liquidity_fee", group: "Fees", pro: "Auto-liquidity fee", kid: "Market fuel ⛽", info: "Part of each transfer is added to the trading pool.", kidInfo: "A bit of each trade fills up the coin shop's shelves.", params: [p("pct", "Liquidity %")] },
  { id: "permit", group: "Standards", pro: "Permit (EIP-2612)", kid: "Signed note ✍️", info: "Gasless approvals via signatures.", kidInfo: "Say 'yes' with a signed note instead of paying a fee.", params: [] },
  { id: "votes", group: "Standards", pro: "Votes (ERC20Votes)", kid: "Ballot coins 🗳️", info: "Built-in vote checkpoints and delegation.", kidInfo: "Each coin can be a voting ticket.", params: [] },
  { id: "flash_mint", group: "Standards", pro: "Flash minting", kid: "Borrow & return ⚡", info: "Uncollateralised loans repaid in the same transaction.", kidInfo: "Borrow coins for one blink and give them right back.", params: [] },
  { id: "upgradeable", group: "Standards", pro: "Upgradeable proxy", kid: "Shape-shifter 🦎", info: "Logic can be upgraded later by the owner.", kidInfo: "The coin's rules can be improved later.", params: [] },
  { id: "renounce", group: "Standards", pro: "Renounce ownership", kid: "Throw away the key 🗝️", info: "Owner powers are removed after launch.", kidInfo: "Nobody is boss anymore — rules are locked forever.", params: [] },
  { id: "multisig", group: "Standards", pro: "Multisig owner", kid: "Team lock 👥", info: "Admin actions require M of N signers.", kidInfo: "Several friends must agree before big changes.", params: [p("m", "Required signers"), p("n", "Total signers")] },
];

export const PERKS: UtilityDef[] = [
  { id: "governance", group: "Power", pro: "Governance voting", kid: "Vote on decisions 🗳️", info: "Holders vote on proposals; 1 token = 1 vote.", kidInfo: "Coins let you vote on what the club does next.", params: [p("quorum", "Quorum %")] },
  { id: "staking", group: "Earn", pro: "Staking rewards", kid: "Coin garden 🌱", info: "Lock tokens to earn more at a target APR.", kidInfo: "Plant coins and they grow little coin sprouts.", params: [p("apr", "APR %"), p("lock_days", "Lock days")] },
  { id: "revenue_share", group: "Earn", pro: "Revenue sharing", kid: "Lemonade profits 🍋", info: "A % of project revenue goes to stakers.", kidInfo: "When the lemonade stand earns, coin holders get a cut.", params: [p("pct", "Revenue %")] },
  { id: "buyback", group: "Earn", pro: "Buyback & burn", kid: "Coin rescue 🚒", info: "Profits buy tokens from the market and burn them.", kidInfo: "The team buys coins back and shreds them so each one is rarer.", params: [p("pct", "% of profits")] },
  { id: "access", group: "Access", pro: "Token-gated access", kid: "Secret clubhouse 🏠", info: "Hold N tokens to access content, chat or features.", kidInfo: "Show enough coins to enter the secret clubhouse.", params: [p("min", "Tokens required")] },
  { id: "discounts", group: "Access", pro: "Holder discounts", kid: "Coupon power 🎟️", info: "Holders get a % off products or services.", kidInfo: "Holding coins gives you a discount at the shop.", params: [p("pct", "Discount %"), p("min", "Tokens required")] },
  { id: "payments", group: "Access", pro: "In-app currency", kid: "Arcade tokens 🕹️", info: "Spend the token to pay for items in your app.", kidInfo: "Use coins to buy stuff in the game.", params: [] },
  { id: "fee_payment", group: "Access", pro: "Pay fees in token", kid: "Coin tickets 🎫", info: "Platform fees can be paid in the token at a discount.", kidInfo: "Pay ride tickets with your coins and save a bit.", params: [p("pct", "Fee discount %")] },
  { id: "tiers_status", group: "Access", pro: "Loyalty status tiers", kid: "Bronze, silver, gold 🥇", info: "Holding thresholds unlock status levels.", kidInfo: "Collect more coins to level up your badge.", params: [p("levels", "Thresholds", "text", "100, 1000, 10000")] },
  { id: "early_access", group: "Access", pro: "Early access / allowlist", kid: "Front of the line 🚀", info: "Holders get early access to drops and launches.", kidInfo: "Coin holders get to try new things first.", params: [] },
  { id: "nft_mint", group: "Access", pro: "Redeem for NFTs", kid: "Trade for stickers 🖼️", info: "Burn tokens to mint collectibles.", kidInfo: "Swap coins for special collectible stickers.", params: [p("price", "Tokens per NFT")] },
  { id: "rewards", group: "Earn", pro: "Activity rewards", kid: "Gold stars ⭐", info: "Users earn tokens for completing actions.", kidInfo: "Do good things and earn coin stars.", params: [p("per_action", "Tokens per action")] },
  { id: "dao_formation", group: "DAO creation", pro: "Conditional DAO handover", kid: "Club handover day 🏛️", info: "A DAO takes control of treasury and settings only after a provable condition is met (holders, treasury size, date, milestone).", kidInfo: "The club takes charge once enough friends join or a goal is reached.", params: [p("trigger", "Trigger condition", "text", "1,000 holders or 2027-01-01"), p("verifier", "Verifier / oracle / signers", "text")] },
  { id: "dao_voting", group: "DAO creation", pro: "Proposal & quorum rules", kid: "Voting rules 🗳️", info: "Tokens needed to propose, minimum turnout and voting period.", kidInfo: "How many coins you need to suggest an idea and how many friends must vote.", params: [p("proposal_min", "Tokens to propose"), p("quorum", "Quorum %"), p("days", "Voting days")] },
  { id: "dao_membership", group: "DAO creation", pro: "Conditional membership", kid: "Club entry rule 🎫", info: "Membership requires a provable condition, e.g. holding N tokens, an NFT, or an attestation.", kidInfo: "Only friends who meet the rule can join the club.", params: [p("condition", "Membership condition", "text", "Hold 100 tokens"), p("proof", "Proof method", "text", "On-chain / attestation")] },
  { id: "dao_timelock", group: "DAO creation", pro: "Execution timelock", kid: "Cool-down lock ⏳", info: "Delay between a passed vote and its execution.", kidInfo: "Wait a bit before a decision happens so everyone can get ready.", params: [p("hours", "Delay hours")] },
  { id: "dao_ragequit", group: "DAO creation", pro: "Ragequit exit", kid: "Fair exit door 🚪", info: "Dissenting members may exit with their pro-rata treasury share before execution.", kidInfo: "If you don't like a decision, take your fair share and leave.", params: [p("days", "Exit window days")] },
  { id: "dao_veto", group: "DAO creation", pro: "Guardian veto council", kid: "Safety guardian 🛡️", info: "A council can veto proposals until a sunset date or condition.", kidInfo: "Trusted helpers can stop dangerous ideas in the early days.", params: [p("council", "Council wallet / Safe", "text"), p("sunset", "Sunset date or condition", "text")] },
  { id: "dao_subdaos", group: "DAO creation", pro: "Sub-DAOs / committees", kid: "Task teams 👥", info: "Committees with capped budgets, created when a condition is met.", kidInfo: "Small teams look after special jobs with their own pocket money.", params: [p("budget_pct", "Budget cap %"), p("condition", "Creation condition", "text")] },
  { id: "dao_dissolution", group: "DAO creation", pro: "Conditional dissolution", kid: "Club closing rule 🌅", info: "Treasury is returned to holders if a provable condition occurs (inactivity, failed goal).", kidInfo: "If the club stops, everyone gets their share back.", params: [p("condition", "Dissolution condition", "text", "No proposals for 365 days")] },
];

export const ALLOCATION_BUCKETS = [
  { id: "community", pro: "Community / airdrop", kid: "Friends' treats 🍬" },
  { id: "team", pro: "Team", kid: "Builders' share 🛠️" },
  { id: "investors", pro: "Investors", kid: "Helpers' share 🤝" },
  { id: "treasury", pro: "Treasury", kid: "Club piggy bank 🐷" },
  { id: "liquidity", pro: "Liquidity", kid: "Coin shop shelves 🏪" },
  { id: "ecosystem", pro: "Ecosystem grants", kid: "Gift box 🎁" },
  { id: "marketing", pro: "Marketing", kid: "Party posters 📣" },
  { id: "reserve", pro: "Reserve", kid: "Rainy-day jar 🌧️" },
] as const;

export type TokenConfig = {
  blueprint?: TokenBlueprint;
  features: Record<string, Record<string, string | number>>;
  perks: Record<string, Record<string, string | number>>;
  allocation: Record<string, number>;
  economics: { inflation_pct: number; burn_schedule: string; initial_price: number };
  branding: { logo_url: string; description: string; website: string; twitter: string; discord: string; telegram: string; whitepaper: string };
};

export const emptyConfig = (): TokenConfig => ({
  blueprint: emptyBlueprint(),
  features: {}, perks: {},
  allocation: { community: 40, team: 15, investors: 10, treasury: 20, liquidity: 15 },
  economics: { inflation_pct: 0, burn_schedule: "", initial_price: 0 },
  branding: { logo_url: "", description: "", website: "", twitter: "", discord: "", telegram: "", whitepaper: "" },
});

export const allocationTotal = (a: Record<string, number>) => Object.values(a).reduce((s, v) => s + (Number(v) || 0), 0);
export const utilDef = (id: string) => FEATURES.find((f) => f.id === id) ?? PERKS.find((f) => f.id === id);
