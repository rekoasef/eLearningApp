// Ruta: app/dashboard/cursos/[courseId]/leccion/[lessonId]/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import LessonViewer from '@/components/cursos/LessonViewer';

// --- Tipos de datos para la lección ---
type LessonData = {
  id: string;
  title: string;
  course_id: string;
  contents: Content[];
  quiz: Quiz | null;
};
type Content = { 
  id: string; 
  content_type: 'video' | 'pdf'; 
  title: string; 
  url: string; 
};
type Quiz = { 
  id: string; 
};

export default function LessonPage({ params }: { params: { courseId: string, lessonId: string } }) {
  const supabase = createClient();
  const { courseId, lessonId } = params;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Función para obtener los datos de la lección ---
  const fetchLessonData = useCallback(async () => {
    setLoading(true);

    // 1. Obtener los detalles de la lección y sus contenidos asociados
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        course_id,
        contents ( id, content_type, title, url )
      `)
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .single();

    if (lessonError || !lessonData) {
      setLoading(false);
      return notFound(); // Si no se encuentra la lección, muestra un 404
    }
    
    // 2. Obtener el quiz asociado a la lección (si existe)
    const { data: quizData } = await supabase
        .from('quizzes')
        .select('id')
        .eq('lesson_id', lessonId)
        .maybeSingle();

    // 3. Combinar todos los datos en un solo objeto
    const fullLessonData: LessonData = {
        ...lessonData,
        quiz: quizData || null,
        contents: lessonData.contents || []
    };

    setLesson(fullLessonData);
    setLoading(false);
  }, [courseId, lessonId, supabase]);

  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);

  // --- Renderizado ---
  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white"><p>Cargando lección...</p></div>;
  }

  if (!lesson) {
    return notFound();
  }

  // Renderiza el componente VISOR con los datos correctos
  return <LessonViewer lesson={lesson} courseId={courseId} />;
}