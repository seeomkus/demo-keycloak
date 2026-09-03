import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * See the matching comment in nextjs-portal/next.config.ts -- without
   * this, LAN clients get a page that renders but has zero working
   * buttons, since the client-side JS bundle fails cross-origin. Kept
   * in sync with the current LAN IP by scripts\update-ip.bat.
   */
  allowedDevOrigins: ["192.168.23.76"],
};

export default nextConfig;
