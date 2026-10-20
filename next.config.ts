import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: { incomingRequests: { ignore: [/\/api\/ai\/chatgpt\/callback/] } },
};

export default nextConfig;
