import path from "path";

/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Prevent socket.io-client (and anything that references browser globals
  // like `location` / `window`) from being bundled into the Node.js runtime.
  serverExternalPackages: ["socket.io-client", "engine.io-client"],

  turbopack: {
    // Pin the monorepo root so Turbopack doesn't infer the wrong workspace.
    root: path.resolve(process.cwd(), "../.."),
  },
};

export default nextConfig;