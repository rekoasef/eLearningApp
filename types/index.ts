// types/index.ts

// Definimos el tipo 'Content' una sola vez aquí.
// Esta será nuestra "única fuente de la verdad".
export type Content = {
  id: string;
  lesson_id: string; // Incluimos lesson_id para que sea completo
  content_type: 'video' | 'pdf';
  title: string;
  url: string;
};

// Podríamos añadir más tipos compartidos aquí en el futuro.