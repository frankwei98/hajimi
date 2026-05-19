import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const publishRevocation = mutation({
  args: { kid: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("revocation")
      .withIndex("by_kid", (q) => q.eq("kid", args.kid))
      .first();
    if (existing) throw new Error("该密钥已被吊销");
    return ctx.db.insert("revocation", { kid: args.kid, reason: args.reason, revokedAt: Date.now() });
  },
});

export const isKeyRevoked = query({
  args: { kid: v.string() },
  handler: async (ctx, args) => {
    const revocation = await ctx.db
      .query("revocation")
      .withIndex("by_kid", (q) => q.eq("kid", args.kid))
      .first();
    return revocation !== null;
  },
});

export const listRevocations = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const revocations = await ctx.db
      .query("revocation")
      .order("desc")
      .take(args.limit ?? 100);
    return revocations;
  },
});
