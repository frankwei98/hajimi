import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /**
   * message 请帮我参考 HybridEnvelope
   */
  message: defineTable({
    // id: v.id("message"),
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
});
