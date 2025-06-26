// Ruta: app/cursos/[courseId]/leccion/[lessonId]/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckSquare, FileText, PlayCircle } from 'lucide-react';

// --- Tipos ---
type LessonDetails = {
  id: string;
  title: string;
  contents: Content[];
  quiz: Quiz | null;
};
type Content = { id: string; content_type: 'video' | 'pdf'; title: string; url: string; };
type Quiz = { id: string; };

// --- NUEVA FUNCIÓN ---
// Esta función convierte una URL de YouTube a una URL 'embed' que funciona en iframes.
const getEmbedUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      const videoId = urlObj.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
  } catch (error) {
    // Si no es una URL válida, la devolvemos como está.
    return url;
  }
  return url;
};

// --- Componente Principal ---
export default function LessonPage({ params }: { params: { courseId: string, lessonId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId, lessonId } = params;

  const [lessonDetails, setLessonDetails] = useState<LessonDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLessonData = useCallback(async () => {
    setLoading(true);
    const { data: lesson, error: lessonError } = await supabase.from('lessons').select('id, title').eq('id', lessonId).single();
    if (lessonError) { setLoading(false); return; }

    const { data: contents, error: contentsError } = await supabase.from('contents').select('*').eq('lesson_id', lessonId);
    const { data: quiz, error: quizError } = await supabase.from('quizzes').select('id').eq('lesson_id', lessonId).maybeSingle();

    setLessonDetails({ ...lesson, contents: contents || [], quiz: quiz || null });
    setLoading(false);
  }, [lessonId, supabase]);

  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);


  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        {/* SVG de carga */}
        <svg className="animate-spin h-8 w-8 text-[#FF4500]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }
  
  if (!lessonDetails) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
          <p className="text-red-500 mb-4">No se pudo cargar la lección.</p>
          <Link href={`/cursos/${courseId}`} className="text-white bg-[#FF4500] py-2 px-4 rounded-lg">Volver al curso</Link>
      </div>
    );
  }
  
  const mainContent = lessonDetails.contents[0];
  // Usamos la nueva función para obtener la URL correcta
  const contentUrl = mainContent ? getEmbedUrl(mainContent.url) : '';

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <header className="mb-8">
          <Link href={`/cursos/${courseId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit">
            <ArrowLeft size={18} /> Volver al temario del curso
          </Link>
        </header>
        <main>
            <h1 className="text-3xl sm:text-4xl font-bold mb-6">{lessonDetails.title}</h1>
            <div className="aspect-video bg-[#151515] rounded-xl border border-gray-800 mb-6 overflow-hidden">
              {mainContent ? (
                <>
                  {mainContent.content_type === 'video' && (<iframe width="100%" height="100%" src={contentUrl} title={mainContent.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>)}
                  {mainContent.content_type === 'pdf' && (<iframe src={mainContent.url} width="100%" height="100%" title={mainContent.title}></iframe>)}
                </>
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500"><p>Este módulo aún no tiene material cargado.</p></div>
              )}
            </div>
            {lessonDetails.quiz ? (
                 <Link href={`/cursos/${courseId}/quiz/${lessonDetails.quiz.id}`}
                    className="block text-center w-full bg-[#FF4500] text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-all">
                    <div className="flex items-center justify-center gap-3"><CheckSquare size={20} />Realizar Quiz para Continuar</div>
                </Link>
            ) : (
                <button
                    className="w-full flex items-center justify-center gap-3 bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-500 transition-all">
                    Marcar como Visto y Continuar (Sin Quiz)
                </button>
            )}
        </main>
      </div>
    </div>
  );
}