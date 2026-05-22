import { action, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { TurnstileServerValidationResponse } from "@marsidev/react-turnstile";

declare const process: { env: Record<string, string | undefined> };

const turnstileSecret = process.env.CF_TURNSTILE_SECRET || "";

async function validateTurnstile(token: string): Promise<boolean> {
  if (!turnstileSecret) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(token)}`,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    if (!res.ok) return false;
    return ((await res.json()) as TurnstileServerValidationResponse).success;
  } catch {
    return false;
  }
}

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

export const registerUser = action({
  args: {
    handle: v.string(),
    publicKeyBech32: v.string(),
    avatarUrl: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    if (!(await validateTurnstile(args.token))) {
      throw new Error("人机验证失败");
    }
    return await ctx.runMutation(internal.users.iRegisterUser, {
      handle: args.handle,
      publicKeyBech32: args.publicKeyBech32,
      avatarUrl: args.avatarUrl,
    });
  },
});

export const iRegisterUser = internalMutation({
  args: {
    handle: v.string(),
    publicKeyBech32: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(args.handle)) {
      throw new Error("Handle 格式不正确：仅允许字母、数字、下划线和连字符，长度 3-20");
    }
    if (!args.publicKeyBech32.startsWith("hajimi1")) {
      throw new Error("无效的公钥格式");
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
    return await ctx.db.insert("user", {
      handle: args.handle,
      publicKeyBech32: args.publicKeyBech32,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
    });
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
