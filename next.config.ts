import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const studioRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: studioRoot,
  turbopack: {
    root: studioRoot,
  },
  serverExternalPackages: ["unpdf", "mammoth", "xlsx"],
};

export default nextConfig;
