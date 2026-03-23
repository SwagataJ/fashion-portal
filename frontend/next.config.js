/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
    ],
  },
  webpack: (config) => {
    // Konva's Node.js build requires 'canvas' which doesn't exist in Next.js.
    // Aliasing it to false prevents the module-not-found error.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

module.exports = nextConfig;
