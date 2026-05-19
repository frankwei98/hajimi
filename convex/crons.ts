import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const cron = cronJobs();

cron.cron(
  "Clean Up Expired Messages",
  "0 */6 * * *",
  internal.messages.iCleanupExpiredMessages,
);

export default cron;
