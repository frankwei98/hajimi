import { action, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { TurnstileServerValidationResponse } from "@marsidev/react-turnstile";
import { bech32 } from "bech32";
import { buildRegistrationPayload, decodeBech32SigningPublicKey, verifyTextSignature } from "./signing";

declare const process: { env: Record<string, string | undefined> };

const turnstileSecret = process.env.CF_TURNSTILE_SECRET || "";
const PUBLIC_KEY_PREFIX = "hajimi";

function assertEncryptionPublicKey(value: string): void {
  const decoded = bech32.decode(value.trim());
  if (decoded.prefix !== PUBLIC_KEY_PREFIX) throw new Error("无效的公钥前缀");
  const bytes = new Uint8Array(bech32.fromWords(decoded.words));
  if (bytes.length !== 32) throw new Error("无效的公钥长度");
}

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
    publicSigningKeyBech32: v.string(),
    registrationSignature: v.string(),
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
      publicSigningKeyBech32: args.publicSigningKeyBech32,
      registrationSignature: args.registrationSignature,
      avatarUrl: args.avatarUrl,
    });
  },
});

export const iRegisterUser = internalMutation({
  args: {
    handle: v.string(),
    publicKeyBech32: v.string(),
    publicSigningKeyBech32: v.string(),
    registrationSignature: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(args.handle)) {
      throw new Error("Handle 格式不正确：仅允许字母、数字、下划线和连字符，长度 3-20");
    }
    try {
      assertEncryptionPublicKey(args.publicKeyBech32);
      decodeBech32SigningPublicKey(args.publicSigningKeyBech32);
    } catch {
      throw new Error("无效的公钥格式");
    }
    const registrationPayload = buildRegistrationPayload(
      args.handle,
      args.publicKeyBech32,
      args.publicSigningKeyBech32,
    );
    if (!verifyTextSignature(registrationPayload, args.registrationSignature, args.publicSigningKeyBech32)) {
      throw new Error("签名验证失败：无法证明你拥有该身份私钥");
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
    const existingSigningKey = await ctx.db
      .query("user")
      .withIndex("by_signing_key", (q) => q.eq("publicSigningKeyBech32", args.publicSigningKeyBech32))
      .first();
    if (existingSigningKey) {
      throw new Error("该签名公钥已绑定到用户 @" + existingSigningKey.handle);
    }
    return await ctx.db.insert("user", {
      handle: args.handle,
      publicKeyBech32: args.publicKeyBech32,
      publicSigningKeyBech32: args.publicSigningKeyBech32,
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
