import { action, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { TurnstileServerValidationResponse } from "@marsidev/react-turnstile";
import type { Id } from "./_generated/dataModel";

declare const process: { env: Record<string, string | undefined> };

const secret = process.env.CF_TURNSTILE_SECRET || "";

async function validateTurnstile(token: string): Promise<boolean> {
  if (!secret) {
    console.error("CF_TURNSTILE_SECRET is not set in environment variables");
    return false;
  }
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      },
    );

    if (!res.ok) {
      console.error(`Turnstile verification failed with status: ${res.status}`);
      return false;
    }

    const data = (await res.json()) as TurnstileServerValidationResponse;
    return data.success;
  } catch (error) {
    console.error("Turnstile validation error:", error);
    return false;
  }
}

const msgObj = v.object({
  body: v.object({
    v: v.number(),
    alg: v.string(),
    epk: v.string(),
    nonce: v.string(),
    ciphertext: v.string(),
    recipients: v.array(
      v.object({
        kid: v.string(),
        salt: v.string(),
        wrapNonce: v.string(),
        encCEK: v.string(),
      }),
    ),
  }),
});

export const uploadMessage = action({
  args: { token: v.string(), message: msgObj, removeAt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const isVerifiedReq = await validateTurnstile(args.token);
    if (!isVerifiedReq) {
      throw new Error("Invalid captcha token");
    }
    const res: Id<"message"> = await ctx.runMutation(
      internal.messages.iUploadMessage,
      {
        message: args.message,
        removeAt: args.removeAt,
      },
    );
    return res;
  },
});

export const getMessage = query({
  args: { messageId: v.id("message") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    return message;
  },
});

const MIN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const MAX_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export const iUploadMessage = internalMutation({
  args: {
    message: msgObj,
    removeAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.removeAt != null) {
      const now = Date.now();
      if (args.removeAt < now + MIN_EXPIRY_MS) {
        throw new Error("过期时间不能早于 1 小时后");
      }
      if (args.removeAt > now + MAX_EXPIRY_MS) {
        throw new Error("过期时间不能超过 1 年");
      }
    }
    return await ctx.db.insert("message", {
      body: args.message.body,
      removeAt: args.removeAt,
    });
  },
});

export const iCleanupExpiredMessages = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    let deleted = 0;
    let hasMore = true;
    while (hasMore) {
      const expired = await ctx.db
        .query("message")
        .withIndex("by_removeAt", (q) => q.lt("removeAt", now))
        .take(100);
      if (expired.length === 0) break;
      for (const msg of expired) {
        await ctx.db.delete(msg._id);
      }
      deleted += expired.length;
      hasMore = expired.length === 100;
    }
    return { deleted };
  },
});
