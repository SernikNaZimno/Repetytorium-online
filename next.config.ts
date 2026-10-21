import type { NextConfig } from "next";

// Aplikacja jest w pełni statyczna (output: "export"), więc działa na GitHub Pages.
// Przy publikacji pod adresem https://<user>.github.io/<repo>/ ścieżkę bazową ustawia NEXT_PUBLIC_BASE_PATH.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
