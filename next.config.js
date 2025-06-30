/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Estas librerías de Supabase a veces causan problemas en el entorno de servidor.
    // Las excluimos del paquete del servidor para evitar los warnings.
    if (isServer) {
      config.externals.push('encoding');
    }
    config.externals.push('bufferutil');
    config.externals.push('utf-8-validate');
    
    // Ignoramos la advertencia de 'Critical dependency' que no podemos controlar.
    config.module.exprContextCritical = false;

    return config;
  },
};

module.exports = nextConfig;