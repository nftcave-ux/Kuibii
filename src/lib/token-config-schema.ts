import { z } from "zod";
import { blueprintSchema, compatibleFeature } from "./token-blueprint";

const selections = z.record(z.string().max(40), z.record(z.string().max(40), z.union([z.string().max(200), z.number().finite()])));

export const tokenConfigSchema = z.object({
  blueprint: blueprintSchema.optional(),
  features: selections,
  perks: selections,
  allocation: z.record(z.string().max(40), z.number().min(0).max(100)),
  economics: z.object({ inflation_pct: z.number().min(0).max(1000), burn_schedule: z.string().max(200), initial_price: z.number().min(0).max(1e12) }),
  branding: z.object({
    logo_url: z.string().max(300), description: z.string().max(1000), website: z.string().max(300),
    twitter: z.string().max(300), discord: z.string().max(300), telegram: z.string().max(300), whitepaper: z.string().max(300),
  }),
}).superRefine((config, ctx) => {
  if (!config.blueprint) return;
  for (const id of Object.keys(config.features)) {
    if (!compatibleFeature(id, config.blueprint.format)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["features", id], message: "Feature is incompatible with this token format." });
  }
});