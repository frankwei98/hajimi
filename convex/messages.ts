import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    const newMessageId = await ctx.db.insert("message", args.message);
    return newMessageId;
  },
});
