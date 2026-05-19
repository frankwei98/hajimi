import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

export default cronJobs([
  cronJobs.job(
    "cleanupExpiredMessages",
    "0 */6 * * *",
    internal.messages.iCleanupExpiredMessages,
    {},
  ),
]);
