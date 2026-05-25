import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { buildRevocationPayload, decodeBech32SigningPublicKey, verifyTextSignature } from "./signing";

export const publishRevocation = mutation({
  args: {
    kid: v.string(),
    publicSigningKeyBech32: v.string(),
    revokedAt: v.number(),
    reason: v.optional(v.string()),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    if (Math.abs(Date.now() - args.revokedAt) > 10 * 60 * 1000) {
      throw new Error("吊销时间戳超出允许范围");
    }
    try {
      decodeBech32SigningPublicKey(args.publicSigningKeyBech32);
    } catch {
      throw new Error("签名公钥格式不正确");
    }
    const user = await ctx.db
      .query("user")
      .withIndex("by_public_key", (q) => q.eq("publicKeyBech32", args.kid))
      .first();
    if (!user) throw new Error("只有已注册身份可以发布密钥吊销");
    if (user.publicSigningKeyBech32 !== args.publicSigningKeyBech32) {
      throw new Error("签名公钥与该身份不匹配");
    }
    const payload = buildRevocationPayload(args.kid, args.revokedAt, args.reason ?? "");
    if (!verifyTextSignature(payload, args.signature, args.publicSigningKeyBech32)) {
      throw new Error("吊销签名验证失败");
    }
    const existing = await ctx.db
      .query("revocation")
      .withIndex("by_kid", (q) => q.eq("kid", args.kid))
      .first();
    if (existing) throw new Error("该密钥已被吊销");
    return ctx.db.insert("revocation", {
      kid: args.kid,
      publicSigningKeyBech32: args.publicSigningKeyBech32,
      signature: args.signature,
      reason: args.reason,
      revokedAt: args.revokedAt,
    });
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
