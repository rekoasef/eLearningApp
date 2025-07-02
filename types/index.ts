// types/index.ts

/**
 * Representa un contenido individual dentro de una lección (video o PDF).
 */
export type Content = {
  id: string;
  lesson_id: string;
  content_type: 'video' | 'pdf';
  title: string;
  url: string;
};

/**
 * Representa el perfil de un usuario para componentes de administración.
 * La propiedad 'sectors' es un array porque así lo devuelve Supabase en las relaciones.
 */
export type AdminProfile = {
  role_id: number;
  sector_id: string | null;
  sectors: { name: string | null }[] | null;
};

/**
 * Representa el perfil de un usuario para la página de métricas.
 * Es similar a AdminProfile pero lo mantenemos separado por claridad.
 */
export type UserProfile = {
    role_id: number;
    sectors: { name: string | null }[] | null;
};