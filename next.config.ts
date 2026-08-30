import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', '@xenova/transformers', 'onnxruntime-node'],
  allowedDevOrigins: ['192.168.0.106'],
};

export default nextConfig;
