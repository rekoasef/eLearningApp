// Ruta: components/cursos/LessonViewer.tsx

'use client'; // Este componente SÍ es de cliente

import Link from 'next/link';
import { ArrowLeft, CheckSquare, FileText, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Tipos ---
// Definimos los tipos de datos que este componente espera recibir como props
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

// --- Componente ---
export default function LessonViewer({ lesson, courseId }: LessonViewerProps) {
  const router = useRouter();

  // La lógica para marcar como completado irá aquí
  const handleMarkAsCompleted = async () => {
    alert("Módulo completado (sin quiz).");
    router.push(`/cursos/${courseId}`);
  };

  const mainContent = lesson.contents && lesson.contents[0];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <header className="mb-8">
          <Link href={`/cursos/${courseId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit">
            <ArrowLeft size={18} /> Volver al temario del curso
          </Link>
        </header>
        <main>
            <h1 className="text-3xl sm:text-4xl font-bold mb-6">{lesson.title}</h1>
            <div className="aspect-video bg-[#151515] rounded-xl border border-gray-800 mb-6 overflow-hidden">
              {mainContent ? (
                <>
                  {mainContent.content_type === 'video' && (<iframe width="100%" height="100%" src={mainContent.url} title={mainContent.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>)}
                  {mainContent.content_type === 'pdf' && (<iframe src={mainContent.url} width="100%" height="100%" title={mainContent.title}></iframe>)}
                </>
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500"><p>Este módulo aún no tiene material cargado.</p></div>
              )}
            </div>
            {lesson.quiz ? (
                 <Link href={`/cursos/${courseId}/quiz/${lesson.quiz.id}`}
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