import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

export default cronJobs([
  {
    name: "cleanupExpiredMessages",
    cron: "0 */6 * * *",
    function: internal.messages.iCleanupExpiredMessages,
    args: {},
  },
]);
