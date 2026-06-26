/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jspdf', 'jspdf-autotable']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'jspdf': 'commonjs',
        'jspdf-autotable': 'commonjs'
      });
    }
    return config;
  }
};

module.exports = nextConfig;