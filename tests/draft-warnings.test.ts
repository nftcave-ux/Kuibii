import { expect, test } from "bun:test";
import { createWarnings } from "../src/lib/draft";
const base = { total_supply: 1000, distribution_mode: "fixed" as const, fixed_amount: 100, tiers: [], vesting: { enabled: false, tge_percent: 20, cliff_months: 3, duration_months: 12 } };
test("ok config has no warnings", () => expect(createWarnings(base)).toEqual([]));
test("fixed amount above supply warns", () => expect(createWarnings({ ...base, fixed_amount: 1001 }).length).toBe(1));
test("cliff longer than duration warns", () => expect(createWarnings({ ...base, vesting: { enabled: true, tge_percent: 20, cliff_months: 13, duration_months: 12 } }).length).toBe(1));
test("tge above 100 warns", () => expect(createWarnings({ ...base, vesting: { enabled: true, tge_percent: 120, cliff_months: 1, duration_months: 12 } }).length).toBe(1));
