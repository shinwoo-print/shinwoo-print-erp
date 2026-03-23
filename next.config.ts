import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // ★ Docker 배포 필수: standalone 모드
  output: "standalone",

  turbopack: {
    root: path.resolve(__dirname),
  },

  serverExternalPackages: ["@react-pdf/renderer"],

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "114.207.245.188",
      },
    ],
  },
};

export default nextConfig;
