import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, "src/app/styles")],
    implementation: "sass-embedded",
    additionalData: `
      @use "sass:math";
      @use "@app/styles/mixins.scss" as *;
      @use "@app/styles/colors.scss";
      @use "@app/styles/variables.scss";
    `,
  },
  turbopack: {
    resolveAlias: {
      "@": path.join(__dirname, "./src"),
      "@app": path.join(__dirname, "./src/app"),
      "@components": path.join(__dirname, "./src/app/components"),
      "@styles": path.join(__dirname, "./src/app/styles"),
    },
  },
};

export default nextConfig;
