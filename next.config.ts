import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: '/privacy-policy',
        destination: '/en/privacy-policy',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
