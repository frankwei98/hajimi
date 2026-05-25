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
      sender: v.optional(v.object({
        kid: v.string(),
        publicSigningKeyBech32: v.string(),
        signature: v.string(),
      })),
    }),
    removeAt: v.optional(v.number()),
  }).index("by_removeAt", ["removeAt"]),

  /**
   * user 用户身份表：handle + 公钥
   */
  user: defineTable({
    handle: v.string(),
    publicKeyBech32: v.string(),
    publicSigningKeyBech32: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_handle", ["handle"])
    .index("by_public_key", ["publicKeyBech32"])
    .index("by_signing_key", ["publicSigningKeyBech32"]),

  /**
   * revocation 密钥吊销公告板
   */
  revocation: defineTable({
    kid: v.string(),
    publicSigningKeyBech32: v.string(),
    signature: v.string(),
    reason: v.optional(v.string()),
    revokedAt: v.number(),
  })
    .index("by_kid", ["kid"]),
});
