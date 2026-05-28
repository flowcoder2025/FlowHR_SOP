import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@flowhr/ui',
    '@flowhr/i18n',
    '@flowhr/platform',
    '@flowhr/api-client',
    '@flowhr/schemas',
    '@flowhr/types',
  ],
};

export default withNextIntl(nextConfig);
