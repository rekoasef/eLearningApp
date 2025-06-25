/** @type {import('next').NextConfig} */
const nextConfig = {
  // Añadimos la configuración de Webpack para que ignore los módulos opcionales.
  webpack: (config) => {
    config.externals.push({
      'bufferutil': 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
    });
    return config;
  },
  // NUEVO: Añadimos esta regla experimental para que Next.js maneje
  // correctamente la librería 'ws' en el entorno del servidor.
  experimental: {
    serverComponentsExternalPackages: ['ws'],
  },
};

module.exports = nextConfig;
