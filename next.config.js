/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', 'puppeteer-screen-recorder'],
  },
};

module.exports = nextConfig;
