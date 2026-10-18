export type ParamDef = { key: string; label: string; kind: "text" | "number" | "date"; placeholder?: string };
export type ConditionDef = {
  id: string;
  group: "Time" | "Sign-up" | "Holdings" | "On-chain activity" | "Community" | "Compliance" | "Bonus";
  pro: string;
  kid: string;
  /** signup = enforced automatically at registration; payout = recorded rule to verify before sending */
  check: "signup" | "payout" | "bonus";
  params: ParamDef[];
};
export type Condition = { type: string; params: Record<string, string | number> };

export const CONDITIONS: ConditionDef[] = [
  { id: "opens_at", group: "Time", check: "signup", pro: "Registration opens at", kid: "Party door opens ⏰", params: [{ key: "date", label: "Opens", kind: "date" }] },
  { id: "closes_at", group: "Time", check: "signup", pro: "Registration closes at", kid: "Party door closes 🚪", params: [{ key: "date", label: "Closes", kind: "date" }] },
  { id: "snapshot", group: "Time", check: "payout", pro: "Holdings snapshot date", kid: "Photo day 📸 (who had coins then)", params: [{ key: "date", label: "Snapshot", kind: "date" }] },
  { id: "transfer_lock", group: "Time", check: "payout", pro: "Non-transferable until", kid: "No swapping until… 🔒", params: [{ key: "date", label: "Until", kind: "date" }] },
  { id: "max_recipients", group: "Sign-up", check: "signup", pro: "Max recipients (first come)", kid: "Only the first N friends 🏃", params: [{ key: "n", label: "Max", kind: "number", placeholder: "500" }] },
  { id: "email_domain", group: "Sign-up", check: "signup", pro: "Email domain required", kid: "Only friends from this school/club ✉️", params: [{ key: "domain", label: "Domain", kind: "text", placeholder: "acme.com" }] },
  { id: "invite_code", group: "Sign-up", check: "signup", pro: "Invite code required", kid: "Secret password 🤫", params: [{ key: "code", label: "Code", kind: "text", placeholder: "MOON2026" }] },
  { id: "hold_token", group: "Holdings", check: "payout", pro: "Holds ≥ X of another token", kid: "Has X of another coin 🪙", params: [{ key: "token", label: "Token address / symbol", kind: "text", placeholder: "0x… or USDC" }, { key: "min", label: "Min amount", kind: "number", placeholder: "100" }] },
  { id: "hold_nft", group: "Holdings", check: "payout", pro: "Holds an NFT from collection", kid: "Owns a special sticker 🖼️", params: [{ key: "collection", label: "Collection", kind: "text", placeholder: "0x…" }, { key: "min", label: "Min count", kind: "number", placeholder: "1" }] },
  { id: "native_balance", group: "Holdings", check: "payout", pro: "Min native balance (ETH/SOL)", kid: "Has a little gas money ⛽", params: [{ key: "min", label: "Min", kind: "number", placeholder: "0.01" }] },
  { id: "hold_duration", group: "Holdings", check: "payout", pro: "Held token for ≥ N days", kid: "Kept their coins for N days 🐢", params: [{ key: "token", label: "Token", kind: "text" }, { key: "days", label: "Days", kind: "number", placeholder: "30" }] },
  { id: "staker", group: "Holdings", check: "payout", pro: "Staked ≥ X (validator / launchpad)", kid: "Has coins in a piggy bank 🐷", params: [{ key: "asset", label: "Asset", kind: "text", placeholder: "stETH" }, { key: "min", label: "Min", kind: "number" }] },
  { id: "lp_provider", group: "Holdings", check: "payout", pro: "Liquidity provider in pool", kid: "Shares coins at the market stall 🏪", params: [{ key: "pool", label: "Pool", kind: "text", placeholder: "HBR/ETH" }] },
  { id: "wallet_age", group: "On-chain activity", check: "payout", pro: "Wallet age ≥ N days", kid: "Mailbox is at least N days old 📬", params: [{ key: "days", label: "Days", kind: "number", placeholder: "90" }] },
  { id: "tx_count", group: "On-chain activity", check: "payout", pro: "Min transaction count", kid: "Has sent at least N letters ✉️", params: [{ key: "n", label: "Min tx", kind: "number", placeholder: "10" }] },
  { id: "used_contract", group: "On-chain activity", check: "payout", pro: "Interacted with contract", kid: "Played with this toy before 🎮", params: [{ key: "contract", label: "Contract", kind: "text", placeholder: "0x…" }] },
  { id: "volume", group: "On-chain activity", check: "payout", pro: "Min trading volume (USD)", kid: "Traded at least $X 🛒", params: [{ key: "usd", label: "USD", kind: "number", placeholder: "1000" }] },
  { id: "bridged", group: "On-chain activity", check: "payout", pro: "Bridged to this network", kid: "Crossed the bridge 🌉", params: [{ key: "from", label: "From chain", kind: "text", placeholder: "Ethereum" }] },
  { id: "dao_voter", group: "Community", check: "payout", pro: "Voted in DAO proposals", kid: "Voted in the club meeting 🗳️", params: [{ key: "space", label: "DAO / space", kind: "text", placeholder: "harbor.eth" }, { key: "n", label: "Min votes", kind: "number", placeholder: "1" }] },
  { id: "poap", group: "Community", check: "payout", pro: "Attended event (POAP)", kid: "Came to the party 🎉", params: [{ key: "event", label: "Event", kind: "text" }] },
  { id: "social_follow", group: "Community", check: "payout", pro: "Follows on X / Farcaster", kid: "Follows our page 👀", params: [{ key: "handle", label: "Handle", kind: "text", placeholder: "@harbor" }] },
  { id: "discord_role", group: "Community", check: "payout", pro: "Has Discord role", kid: "Has a club badge 🏅", params: [{ key: "role", label: "Server / role", kind: "text", placeholder: "Harbor / OG" }] },
  { id: "github", group: "Community", check: "payout", pro: "GitHub contributor to repo", kid: "Helped build the project 🛠️", params: [{ key: "repo", label: "Repo", kind: "text", placeholder: "org/repo" }] },
  { id: "referrals", group: "Community", check: "payout", pro: "Referred ≥ N users", kid: "Invited N friends 🤝", params: [{ key: "n", label: "Min", kind: "number", placeholder: "3" }] },
  { id: "customer", group: "Community", check: "payout", pro: "Existing customer / purchase", kid: "Bought something from the shop 🛍️", params: [{ key: "note", label: "Proof", kind: "text", placeholder: "Order ID" }] },
  { id: "kyc", group: "Compliance", check: "payout", pro: "KYC verified", kid: "A grown-up checked who they are 🪪", params: [{ key: "provider", label: "Provider", kind: "text" }] },
  { id: "geo_block", group: "Compliance", check: "payout", pro: "Excluded countries", kid: "Not available in these places 🗺️", params: [{ key: "list", label: "Countries", kind: "text", placeholder: "US, KP" }] },
  { id: "sybil_score", group: "Compliance", check: "payout", pro: "Min humanity score (e.g. Passport)", kid: "Proves they're a real person 🙋", params: [{ key: "min", label: "Min score", kind: "number", placeholder: "20" }] },
  { id: "early_bird", group: "Bonus", check: "bonus", pro: "Early-bird bonus", kid: "Early worm extra treats 🐛", params: [{ key: "n", label: "First N", kind: "number", placeholder: "100" }, { key: "pct", label: "Bonus %", kind: "number", placeholder: "50" }] },
];

export const condDef = (id: string) => CONDITIONS.find((c) => c.id === id);

export function describe(c: Condition, kid = false) {
  const d = condDef(c.type);
  if (!d) return c.type;
  const vals = d.params.map((p) => c.params[p.key]).filter((v) => v !== "" && v !== undefined);
  return `${kid ? d.kid : d.pro}${vals.length ? `: ${vals.join(" · ")}` : ""}`;
}

export function bonusMultiplier(conds: Condition[], index: number) {
  const eb = conds.find((c) => c.type === "early_bird");
  if (!eb) return 1;
  return index < Number(eb.params["n"] ?? 0) ? 1 + Number(eb.params["pct"] ?? 0) / 100 : 1;
}

export type UseCase = {
  id: string; pro: string; kid: string; blurb: string;
  mode: "fixed" | "tiers"; fixed_amount: number; tiers: { name: string; amount: number }[];
  vesting: { enabled: boolean; tge_percent: number; cliff_months: number; duration_months: number };
  conditions: Condition[];
};

const noVest = { enabled: false, tge_percent: 100, cliff_months: 0, duration_months: 1 };

export const USE_CASES: UseCase[] = [
  { id: "airdrop", pro: "Community airdrop", kid: "Party bag for everyone 🎁", blurb: "Reward real users: old wallets with activity, sybil-filtered, first 1,000 get a bonus.", mode: "fixed", fixed_amount: 500, tiers: [], vesting: noVest,
    conditions: [{ type: "wallet_age", params: { days: 90 } }, { type: "tx_count", params: { n: 10 } }, { type: "sybil_score", params: { min: 20 } }, { type: "early_bird", params: { n: 1000, pct: 25 } }] },
  { id: "holders", pro: "Holder rewards", kid: "Treats for coin keepers 🐢", blurb: "Holders of another token at a snapshot date get a drop.", mode: "fixed", fixed_amount: 1000, tiers: [], vesting: noVest,
    conditions: [{ type: "hold_token", params: { token: "USDC", min: 100 } }, { type: "snapshot", params: { date: "" } }, { type: "hold_duration", params: { token: "USDC", days: 30 } }] },
  { id: "nft", pro: "NFT holder drop", kid: "Sticker collectors' prize 🖼️", blurb: "Anyone holding at least one NFT from your collection.", mode: "fixed", fixed_amount: 2500, tiers: [], vesting: noVest,
    conditions: [{ type: "hold_nft", params: { collection: "", min: 1 } }, { type: "max_recipients", params: { n: 10000 } }] },
  { id: "team", pro: "Team & investors vesting", kid: "Builders' slow treasure ⏳", blurb: "Tiered allocations, 1-year cliff, 36-month unlock, KYC and transfer lock.", mode: "tiers", fixed_amount: 0,
    tiers: [{ name: "Founders", amount: 5_000_000 }, { name: "Investors", amount: 2_000_000 }, { name: "Advisors", amount: 250_000 }],
    vesting: { enabled: true, tge_percent: 0, cliff_months: 12, duration_months: 36 }, conditions: [{ type: "kyc", params: { provider: "" } }, { type: "geo_block", params: { list: "US, KP, IR" } }] },
  { id: "dao", pro: "DAO governance reward", kid: "Club voters' thank-you 🗳️", blurb: "Reward wallets that voted in your DAO and hold your governance token.", mode: "fixed", fixed_amount: 300, tiers: [], vesting: noVest,
    conditions: [{ type: "dao_voter", params: { space: "", n: 2 } }, { type: "hold_token", params: { token: "", min: 1 } }] },
  { id: "event", pro: "Event / conference drop", kid: "Party attendance prize 🎉", blurb: "Attendees sign up with a code shown on stage, during the event only.", mode: "fixed", fixed_amount: 50, tiers: [], vesting: noVest,
    conditions: [{ type: "invite_code", params: { code: "STAGE2026" } }, { type: "opens_at", params: { date: "" } }, { type: "closes_at", params: { date: "" } }, { type: "poap", params: { event: "" } }] },
  { id: "employees", pro: "Employee / club tokens", kid: "Classroom coins 🏫", blurb: "Only people with your company or school email can join.", mode: "fixed", fixed_amount: 100, tiers: [], vesting: noVest,
    conditions: [{ type: "email_domain", params: { domain: "acme.com" } }] },
  { id: "contributors", pro: "Open-source contributors", kid: "Helpers' reward 🛠️", blurb: "Tiered rewards for GitHub contributors, small vesting.", mode: "tiers", fixed_amount: 0,
    tiers: [{ name: "Maintainer", amount: 10_000 }, { name: "Contributor", amount: 1_000 }], vesting: { enabled: true, tge_percent: 25, cliff_months: 0, duration_months: 6 },
    conditions: [{ type: "github", params: { repo: "org/repo" } }] },
  { id: "loyalty", pro: "Customer loyalty", kid: "Shop sticker card 🛍️", blurb: "Customers and referrers earn points; early sign-ups get extra.", mode: "tiers", fixed_amount: 0,
    tiers: [{ name: "Customer", amount: 100 }, { name: "Ambassador", amount: 1000 }], vesting: noVest,
    conditions: [{ type: "customer", params: { note: "" } }, { type: "referrals", params: { n: 3 } }, { type: "early_bird", params: { n: 200, pct: 50 } }] },
  { id: "defi", pro: "DeFi user incentive", kid: "Market stall helpers 🏪", blurb: "LPs and traders with real volume, bridged users welcome.", mode: "tiers", fixed_amount: 0,
    tiers: [{ name: "LP", amount: 5000 }, { name: "Trader", amount: 800 }], vesting: { enabled: true, tge_percent: 50, cliff_months: 0, duration_months: 3 },
    conditions: [{ type: "lp_provider", params: { pool: "" } }, { type: "volume", params: { usd: 1000 } }, { type: "bridged", params: { from: "Ethereum" } }] },
];
