import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();
    return user;
  },
});

export const getUserByPublicKey = query({
  args: { publicKeyBech32: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user")
      .withIndex("by_public_key", (q) => q.eq("publicKeyBech32", args.publicKeyBech32))
      .first();
    return user;
  },
});

export const registerUser = mutation({
  args: {
    handle: v.string(),
    publicKeyBech32: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(args.handle)) {
      throw new Error("Handle 格式不正确：仅允许字母、数字、下划线和连字符，长度 3-20");
    }
    const existingHandle = await ctx.db
      .query("user")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();
    if (existingHandle) {
      throw new Error("该 Handle 已被注册");
    }
    const existingKey = await ctx.db
      .query("user")
      .withIndex("by_public_key", (q) => q.eq("publicKeyBech32", args.publicKeyBech32))
      .first();
    if (existingKey) {
      throw new Error("该公钥已绑定到用户 @" + existingKey.handle);
    }
    const userId = await ctx.db.insert("user", {
      handle: args.handle,
      publicKeyBech32: args.publicKeyBech32,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
    });
    return userId;
  },
});

export const listUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("user")
      .order("desc")
      .take(args.limit ?? 50);
    return users;
  },
});
