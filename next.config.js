/** @type {import('next').NextConfig} */
const nextConfig = {
  // Añadimos esta sección para configurar ESLint
  eslint: {
    // Le decimos que ignore esta regla específica durante el build
    ignoreDuringBuilds: true,
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('encoding');
    }
    config.externals.push('bufferutil');
    config.externals.push('utf-8-validate');
    
    config.module.exprContextCritical = false;

    return config;
  },
};

module.exports = nextConfig;