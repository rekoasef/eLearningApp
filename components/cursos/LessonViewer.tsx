// Ruta: components/cursos/LessonViewer.tsx

'use client'; // Este componente SÍ es de cliente

import Link from 'next/link';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Tipos ---
type LessonData = {
  id: string;
  title: string;
  course_id: string;
  contents: Content[];
  quiz: Quiz | null;
};
type Content = { id: string; content_type: 'video' | 'pdf'; title: string; url: string; };
type Quiz = { id: string; };

type LessonViewerProps = {
  lesson: LessonData;
  courseId: string;
};

/**
 * CORRECCIÓN 1: Helper para convertir la URL de YouTube
 * Esta función transforma una URL normal de YouTube (watch?v=...)
 * a la URL correcta para insertarla en la página (embed/...).
 */
const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        let videoId: string | null = null;

        if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
        } else if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.slice(1);
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
    } catch (e) {
        console.error("URL de video no válida:", e);
        // Si hay un error, devolvemos la URL original para no romper la app.
        return url;
    }
    // Si no es una URL de YouTube, la devuelve sin cambios (para Vimeo, etc.).
    return url;
};


// --- Componente ---
export default function LessonViewer({ lesson, courseId }: LessonViewerProps) {
  const router = useRouter();

  // La lógica para marcar como completado irá aquí
  const handleMarkAsCompleted = async () => {
    alert("Módulo completado (sin quiz).");
    router.push(`/dashboard/cursos/${courseId}`);
  };

  const mainContent = lesson.contents && lesson.contents[0];
  // Usamos la función helper para obtener la URL correcta
  const videoUrl = mainContent?.content_type === 'video' ? getEmbedUrl(mainContent.url) : '';

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <header className="mb-8">
          <Link href={`/dashboard/cursos/${courseId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit">
            <ArrowLeft size={18} /> Volver al temario del curso
          </Link>
        </header>
        <main>
            <h1 className="text-3xl sm:text-4xl font-bold mb-6">{lesson.title}</h1>
            <div className="aspect-video bg-[#151515] rounded-xl border border-gray-800 mb-6 overflow-hidden">
              {mainContent ? (
                <>
                  {mainContent.content_type === 'video' && (<iframe width="100%" height="100%" src={videoUrl} title={mainContent.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>)}
                  {mainContent.content_type === 'pdf' && (<iframe src={mainContent.url} width="100%" height="100%" title={mainContent.title}></iframe>)}
                </>
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500"><p>Este módulo aún no tiene material cargado.</p></div>
              )}
            </div>
            {lesson.quiz ? (
                 // CORRECCIÓN 2: Se agrega '/dashboard' al inicio de la ruta del quiz.
                 <Link href={`/dashboard/cursos/${courseId}/quiz/${lesson.quiz.id}`}
                    className="block text-center w-full bg-[#FF4500] text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-all">
                    <div className="flex items-center justify-center gap-3"><CheckSquare size={20} />Realizar Quiz para Continuar</div>
                </Link>
            ) : (
                <button onClick={handleMarkAsCompleted}
                    className="w-full flex items-center justify-center gap-3 bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-500 transition-all">
                    Marcar como Visto y Continuar (Sin Quiz)
                </button>
            )}
        </main>
      </div>
    </div>
  );
}