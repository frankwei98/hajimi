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

export const iUploadMessage = internalMutation({
  args: {
    message: msgObj,
    removeAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const newMessageId = await ctx.db.insert("message", {
      body: args.message.body,
      removeAt: args.removeAt,
    });
    return newMessageId;
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
