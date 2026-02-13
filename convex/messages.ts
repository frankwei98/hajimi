import { query } from "./_generated/server";
import { v } from "convex/values";

export const getMessage = query({
  args: { messageId: v.id("message") },
  handler: async (ctx, args) => {
    // Convex IDs are typically formatted as 'tableName/id' in some contexts,
    // but here we expect the user to pass the ID string.
    // We attempt to cast it to Id<"message">
    try {
      const message = await ctx.db.get(args.messageId);
      return message;
    } catch {
      return null;
    }
  },
});
