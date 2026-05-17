import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // `rhino3dm` (McNeel's openNURBS WASM build) is only ever dynamically
    // imported on the client, inside `lib/io/rhino3dm.ts`. Its WASM glue
    // statically references Node-only modules (`ws`, `module`) behind an
    // `ENVIRONMENT_IS_NODE` guard that never runs in either Atelier build.
    // They are declared empty for both the client and server graphs. The
    // module stays lazy-loaded; this only changes how the (already dynamic)
    // chunk resolves, not when it loads.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ws: false,
      module: false,
    };
    // On the client, resolve `rhino3dm` to its browser ESM build.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        rhino3dm: "rhino3dm/rhino3dm.module.js",
      };
    }
    return config;
  },
};

export default nextConfig;
