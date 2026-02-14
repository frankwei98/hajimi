import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { TurnstileServerValidationResponse } from "@marsidev/react-turnstile";

const secret = process.env.CF_TURNSTILE_SECRET || "";

async function validateTurnstile(token: string): Promise<boolean> {
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

    const data = (await res.json()) as TurnstileServerValidationResponse;
    return data.success;
  } catch (error) {
    console.error("Turnstile validation error:", error);
    return false;
  }
}

export const getMessage = query({
  args: { messageId: v.id("message") },
  handler: async (ctx, args) => {
    // Convex IDs are typically formatted as 'tableName/id' in some contexts,
    // but here we expect the user to pass the ID string.
    // We attempt to cast it to Id<"message">
    try {
      const message = await ctx.db.get("message", args.messageId);
      return message;
    } catch {
      return null;
    }
  },
});

export const uploadMessage = mutation({
  args: {
    // cloudflare turnstile
    captchaToken: v.string(),
    message: v.object({
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
    }),
  },
  handler: async (ctx, args) => {
    if (!validateTurnstile(args.captchaToken)) {
      throw new Error("Invalid captcha token");
    }
    const newMessageId = await ctx.db.insert("message", args.message);
    return newMessageId;
  },
});
