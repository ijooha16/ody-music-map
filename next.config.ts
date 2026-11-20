import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";
import { LIVE_API_PATHS } from "./src/constants/live-api-paths";

function lanOrigins(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === "IPv4" && !net.internal)
    .map((net) => net!.address);
}

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "https://j15a405.p.ssafy.io";

const publicDemoBuild = Boolean(process.env.VERCEL) && !process.env.BACKEND_ORIGIN;

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",

  env: publicDemoBuild
    ? {
        USE_MOCK_API: process.env.USE_MOCK_API ?? "1",
        NEXT_PUBLIC_DEMO: process.env.NEXT_PUBLIC_DEMO ?? "1",
        NEXT_PUBLIC_TEST_TOOLS: process.env.NEXT_PUBLIC_TEST_TOOLS ?? "0",
      }
    : {},

  allowedDevOrigins: lanOrigins(),

  async rewrites() {
    return {
      beforeFiles: LIVE_API_PATHS.map((path) => ({
        source: path,
        destination: `${BACKEND_ORIGIN}${path}`,
      })),
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
