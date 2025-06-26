/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Estas librerías de Supabase a veces causan problemas en el entorno de servidor.
      // Las excluimos del paquete del servidor para evitar los warnings.
      config.externals.push('encoding');
      config.externals.push('bufferutil');
      config.externals.push('utf-8-validate');
    }
    return config;
  },
};

module.exports = nextConfig;