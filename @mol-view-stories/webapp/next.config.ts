import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.NODE_ENV === "production" ? "/mol-view-stories" : "",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@jsr/molstar__molstar-components"],
  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^npm:/,
        (resource: { request: string }) => {
          resource.request = resource.request
            .slice(4)
            .replace(/((?:@[^@/]+\/)?[^@/]+)@[^/]*(.*)/g, "$1$2");
        }
      )
    );
    return config;
  },
};

export default nextConfig;
