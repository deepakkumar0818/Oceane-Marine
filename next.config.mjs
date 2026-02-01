/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/operations/sts-operations/new/ports-terminals",
        destination: "/operations/sts-operations/new/locations",
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb", // Increases limit to 30MB
    },
  },
  // If you are using remote images from Cloudinary, you might also need this:
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
