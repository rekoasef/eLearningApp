// Ruta: app/cursos/[courseId]/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, Lock, CheckCircle, ShieldCheck, XCircle, Award, Eye } from 'lucide-react';

// --- Tipos ---
type CourseDetails = { id: string; title: string; description: string | null; lessons: Lesson[]; };
type Lesson = { id: string; title: string; order: number; };
type FinalExam = { id: string; };
// NUEVO: Tipo para el estado del progreso del curso
type CourseProgress = {
  status: 'in_progress' | 'completed' | 'failed';
  exam_attempts: number;
} | null;
type Certificate = { pdf_url: string; } | null;


export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId } = params;

  // Estados separados para mayor claridad
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress>(null);
  const [certificate, setCertificate] = useState<Certificate>(null);
  const [loading, setLoading] = useState(true);

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // 1. Obtenemos el curso y sus lecciones
    const { data: courseData, error: courseError } = await supabase
      .from('courses').select(`*, lessons (*)`).eq('id', courseId)
      .order('order', { foreignTable: 'lessons', ascending: true }).single();
    if (courseError || !courseData) { router.push('/dashboard'); return; }
    setCourse(courseData);

    // 2. Obtenemos el progreso de las lecciones
    const lessonIds = courseData.lessons.map(l => l.id);
    if (lessonIds.length > 0) {
      const { data: progressData } = await supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id).in('lesson_id', lessonIds).eq('is_completed', true);
      if (progressData) { setCompletedLessonIds(new Set(progressData.map(p => p.lesson_id))); }
    }
    
    // 3. Obtenemos el examen final
    const { data: examData } = await supabase.from('final_exams').select('id').eq('course_id', courseId).maybeSingle();
    if (examData) { setFinalExam(examData); }

    // 4. Obtenemos el estado general del curso para el usuario (la nueva tabla)
    const { data: progress } = await supabase.from('course_progress').select('*').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
    if (progress) { setCourseProgress(progress); }

    // 5. Buscamos si ya existe un certificado
    if (progress?.status === 'completed') {
        const { data: certData } = await supabase.from('certificates').select('pdf_url').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
        if (certData) { setCertificate(certData); }
    }

    setLoading(false);
  }, [courseId, router, supabase]);

  useEffect(() => { fetchCourseData(); }, [fetchCourseData]);

  // --- Lógica para la UI ---
  const allLessonsCompleted = course ? completedLessonIds.size === course.lessons.length : false;
  const courseStatus = courseProgress?.status || 'in_progress';
  const examAttempts = courseProgress?.exam_attempts || 0;
  const canAttemptExam = allLessonsCompleted && examAttempts < 2 && courseStatus !== 'completed';

  if (loading) {
    return <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center"><p>Cargando curso...</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-200 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit"><ArrowLeft size={18} /> Volver al Dashboard</Link>
        </header>
        <main>
            {course ? (
                <>
                <div className="bg-[#151515] rounded-xl p-8 border border-gray-800">
                    <h1 className="text-4xl font-bold text-white mb-4">{course.title}</h1>
                    <p className="text-lg text-gray-400 mb-8">{course.description}</p>
                    <div className="border-t border-gray-800 pt-8">
                        <h2 className="text-2xl font-semibold text-white mb-6">Módulos del Curso</h2>
                        <div className="space-y-4">{course.lessons.map((lesson, index) => {
                            const isCompleted = completedLessonIds.has(lesson.id);
                            const isUnlocked = index === 0 || completedLessonIds.has(course.lessons[index - 1]?.id);
                            const Icon = isCompleted ? CheckCircle : (isUnlocked ? PlayCircle : Lock);
                            const iconColor = isCompleted ? "text-green-500" : (isUnlocked ? "text-[#FF4500]" : "text-gray-500");
                            const statusText = isCompleted ? "COMPLETADO" : (isUnlocked ? "DISPONIBLE" : "BLOQUEADO");
                            const ModuleContent = () => (<div className={`flex items-center justify-between p-4 rounded-lg transition-all ${!isUnlocked ? 'bg-gray-800/30 cursor-not-allowed opacity-50' : 'bg-gray-800/70 hover:bg-gray-700/80 cursor-pointer'}`}><div className="flex items-center gap-4"><Icon className={iconColor} size={20} /><span className={`font-medium ${!isUnlocked ? 'text-gray-500' : 'text-white'}`}>{lesson.order}. {lesson.title}</span></div><span className={`text-xs font-semibold tracking-wider ${isCompleted ? 'text-green-500' : 'text-gray-500'}`}>{statusText}</span></div>);
                            return isUnlocked ? (<Link href={`/cursos/${courseId}/leccion/${lesson.id}`} key={lesson.id}><ModuleContent /></Link>) : (<div key={lesson.id}><ModuleContent /></div>);
                        })}</div>
                    </div>
                </div>

                {/* --- SECCIÓN DEL EXAMEN FINAL CON NUEVA LÓGICA --- */}
                {finalExam && (
                    <div className={`mt-8 rounded-xl p-8 border ${courseStatus === 'completed' ? 'bg-green-900/30 border-green-500/30' : courseStatus === 'failed' ? 'bg-red-900/30 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'}`}>
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3"><ShieldCheck className={`${courseStatus === 'completed' ? 'text-green-400' : courseStatus === 'failed' ? 'text-red-400' : 'text-amber-400'}`}/>Examen Final</h2>
                        
                        {courseStatus === 'completed' ? (
                            <div>
                                <p className="text-green-300 mb-6">¡Curso aprobado! Ya podés descargar tu certificado o revisar el examen.</p>
                                <div className="flex gap-4">
                                    {certificate?.pdf_url && <a href={certificate.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"> <Award size={18}/> Ver Certificado </a>}
                                    <button className="inline-flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500"> <Eye size={18}/> Revisar Examen </button>
                                </div>
                            </div>
                        ) : courseStatus === 'failed' ? (
                            <div>
                                <p className="text-red-300 mb-6">Curso desaprobado. No te quedan más intentos. Podés revisar el examen para ver tus errores.</p>
                                <button className="inline-flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500"> <Eye size={18}/> Revisar Examen </button>
                            </div>
                        ) : allLessonsCompleted ? (
                            <div>
                                <p className="text-amber-300 mb-6">¡Ya podés rendir el examen final! Tenés {2 - examAttempts} intento(s) restante(s).</p>
                                <Link href={`/cursos/${courseId}/examen/${finalExam.id}`} className="inline-block bg-amber-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-amber-600"> Realizar Examen Final </Link>
                            </div>
                        ) : (
                            <p className="text-gray-400">Debés completar todos los módulos para acceder al examen.</p>
                        )}
                    </div>
                )}
                </>
            ) : (<p>Curso no encontrado.</p>)}
        </main>
      </div>
    </div>
  );
}
