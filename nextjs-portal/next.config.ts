import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next.js blocks cross-origin requests to dev-only assets (HMR
   * bundle, fonts, etc.) by default. Without this, opening the app
   * from a LAN client's browser loads the initial HTML fine but the
   * client-side JS bundle silently fails to load -- React never
   * hydrates, so every button/onClick on the page appears but does
   * nothing. Kept in sync with the current LAN IP by scripts\update-ip.bat.
   */
  allowedDevOrigins: ["192.168.23.76"],
};

export default nextConfig;
