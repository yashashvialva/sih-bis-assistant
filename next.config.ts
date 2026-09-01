import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', '@xenova/transformers', 'onnxruntime-node'],
  allowedDevOrigins: ['*'],
};

export default nextConfig;
