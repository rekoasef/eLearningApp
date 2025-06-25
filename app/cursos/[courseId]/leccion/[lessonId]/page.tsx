// Ruta del archivo: app/cursos/[courseId]/leccion/[lessonId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
// CORRECCIÓN: Se utiliza una ruta relativa para forzar la correcta localización del archivo.
import { createClient } from '../../../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckSquare } from 'lucide-react';

type LessonDetails = {
  id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  course_id: string;
};

export default function LessonPage({ params }: { params: { courseId: string, lessonId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId, lessonId } = params;

  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const handleMarkAsCompleted = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !lesson) return;

    const { error } = await supabase.from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lesson.id,
      is_completed: true,
    }, { onConflict: 'user_id, lesson_id' });

    if (error) {
      console.error("Error al marcar como completado:", error);
    } else {
      router.push(`/cursos/${courseId}`);
    }
  };

  useEffect(() => {
    const fetchLessonDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, content_type, content_url, course_id')
        .eq('id', lessonId)
        .eq('course_id', courseId)
        .single();

      if (error || !data) {
        console.error('Error al cargar la lección:', error);
        router.push(`/cursos/${courseId}`);
      } else {
        setLesson(data);
      }
      setLoading(false);
    };

    if (courseId && lessonId) {
      fetchLessonDetails();
    }
  }, [courseId, lessonId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#FF4500]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <header className="mb-8">
          <Link href={`/cursos/${courseId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit">
            <ArrowLeft size={18} />
            Volver al curso
          </Link>
        </header>

        <main>
          {lesson ? (
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-6">{lesson.title}</h1>
              
              <div className="aspect-video bg-[#151515] rounded-xl border border-gray-800 mb-6 overflow-hidden">
                {lesson.content_type === 'video' && lesson.content_url && (
                  <iframe
                    width="100%"
                    height="100%"
                    src={lesson.content_url}
                    title={lesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}
                {lesson.content_type === 'pdf' && lesson.content_url && (
                   <iframe
                    src={lesson.content_url}
                    width="100%"
                    height="100%"
                    title={lesson.title}
                  ></iframe>
                )}
                {!lesson.content_url && (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-500">Contenido no disponible.</p>
                    </div>
                )}
              </div>

              <button
                onClick={handleMarkAsCompleted}
                className="w-full flex items-center justify-center gap-3 bg-[#FF4500] text-white font-bold py-3 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/50 transition-all"
              >
                <CheckSquare size={20} />
                Marcar como completado y continuar
              </button>
            </div>
          ) : (
            <p>Lección no encontrada.</p>
          )}
        </main>
      </div>
    </div>
  );
}
