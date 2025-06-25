// Ruta del archivo: app/cursos/[courseId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
// CORRECCIÓN: Se vuelve a usar el alias de ruta estándar de Next.js.
// Es crucial que el archivo tsconfig.json esté configurado correctamente para que esto funcione.
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, Lock, FileText, CheckCircle } from 'lucide-react';

type CourseDetails = {
  id: string;
  title: string;
  description: string | null;
};

type Lesson = {
  id: string;
  title: string;
  order: number;
  content_type: string;
};

export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId } = params;

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: courseData, error: courseError } = await supabase
        .from('courses').select('id, title, description').eq('id', courseId).single();

      if (courseError || !courseData) {
        router.push('/dashboard');
        return;
      }
      setCourse(courseData);

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons').select('id, title, order, content_type')
        .eq('course_id', courseId).order('order', { ascending: true });

      if (lessonsError) {
        console.error("Error al cargar los módulos:", lessonsError);
      }
      const currentLessons = lessonsData || [];
      setLessons(currentLessons);

      if (currentLessons.length > 0) {
        const lessonIds = currentLessons.map(l => l.id);
        const { data: progressData, error: progressError } = await supabase
          .from('lesson_progress').select('lesson_id')
          .eq('user_id', user.id).in('lesson_id', lessonIds).eq('is_completed', true);
        
        if (progressError) {
          console.error("Error al cargar el progreso:", progressError);
        } else {
          setCompletedLessonIds(progressData?.map(p => p.lesson_id) || []);
        }
      }

      setLoading(false);
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, router, supabase]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#FF4500]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-200 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit">
            <ArrowLeft size={18} />
            Volver al Dashboard
          </Link>
        </header>
        
        <main>
            {course ? (
                <div className="bg-[#151515] rounded-xl p-8 border border-gray-800">
                    <h1 className="text-4xl font-bold text-white mb-4">{course.title}</h1>
                    <p className="text-lg text-gray-400 mb-8">{course.description}</p>
                    
                    <div className="border-t border-gray-800 pt-8">
                        <h2 className="text-2xl font-semibold text-white mb-6">Módulos del Curso</h2>
                        <div className="space-y-4">
                          {lessons.length > 0 ? (
                            lessons.map((lesson, index) => {
                              const isCompleted = completedLessonIds.includes(lesson.id);
                              const isUnlocked = index === 0 || completedLessonIds.includes(lessons[index - 1]?.id);
                              const Icon = isCompleted ? CheckCircle : (isUnlocked ? (lesson.content_type === 'video' ? PlayCircle : FileText) : Lock);
                              const iconColor = isCompleted ? "text-green-500" : (isUnlocked ? "text-[#FF4500]" : "text-gray-500");
                              const statusText = isCompleted ? "COMPLETADO" : (isUnlocked ? "" : "BLOQUEADO");

                              const ModuleContent = () => (
                                <div className={`flex items-center justify-between p-4 rounded-lg transition-all ${!isUnlocked ? 'bg-gray-800/30 cursor-not-allowed' : 'bg-gray-800/70 hover:bg-gray-700/80 cursor-pointer'}`}>
                                  <div className="flex items-center gap-4">
                                    <Icon className={iconColor} size={20} />
                                    <span className={`font-medium ${!isUnlocked ? 'text-gray-500' : 'text-white'}`}>
                                      {lesson.order}. {lesson.title}
                                    </span>
                                  </div>
                                  {statusText && (
                                    <span className={`text-xs font-semibold ${isCompleted ? 'text-green-500' : 'text-gray-500'}`}>{statusText}</span>
                                  )}
                                </div>
                              );
                              
                              return isUnlocked ? (
                                <Link href={`/cursos/${courseId}/leccion/${lesson.id}`} key={lesson.id}>
                                  <ModuleContent />
                                </Link>
                              ) : (
                                <div key={lesson.id}>
                                  <ModuleContent />
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center text-gray-500 bg-gray-900/50 p-6 rounded-lg">
                              <p>Este curso aún no tiene módulos.</p>
                            </div>
                          )}
                        </div>
                    </div>
                </div>
            ) : (
                <p>Curso no encontrado.</p>
            )}
        </main>
      </div>
    </div>
  );
}
