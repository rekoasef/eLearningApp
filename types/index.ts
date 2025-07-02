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
 * CORRECCIÓN: 'sectors' y 'roles' son objetos, no arrays, para relaciones "uno a uno".
 */
export type AdminProfile = {
  role_id: number;
  sector_id: string | null;
  sectors: { name: string | null } | null;
  roles: { name: string | null } | null;
};

/**
 * Representa el perfil de un usuario para la página de métricas.
 * CORRECCIÓN: 'sectors' y 'roles' son objetos, no arrays.
 */
export type UserProfile = {
    role_id: number;
    sectors: { name: string | null } | null;
    roles: { name: string | null } | null;
};