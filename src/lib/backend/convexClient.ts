import { ConvexReactClient } from "convex/react";

export const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
export const hasBackend = Boolean(convexUrl);
export const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function requireBackend() {
  if (!convexClient) throw new Error("未配置后端地址，联网功能不可用");
  return convexClient;
}
