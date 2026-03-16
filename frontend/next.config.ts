import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Configuration pour Docker (standalone output)
  output: "standalone",
};

export default nextConfig;
