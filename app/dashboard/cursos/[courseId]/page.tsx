// Ruta: app/dashboard/cursos/[courseId]/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, Lock, CheckCircle, ShieldCheck, Award, Eye, XCircle, CalendarOff, Bell } from 'lucide-react';

// --- Tipos ---
type CourseDetails = { id: string; title: string; description: string | null; lessons: Lesson[]; start_date: string | null; end_date: string | null; };
type Lesson = { id: string; title: string; order: number; };
type FinalExam = { id: string; };
type CourseProgress = { status: 'in_progress' | 'completed' | 'failed'; exam_attempts: number; } | null;
type Certificate = { pdf_url: string; } | null;
type CourseAvailability = 'ACTIVE' | 'UPCOMING' | 'FINISHED';

// --- Helper ---
const getCourseAvailability = (startDate: string | null, endDate: string | null): CourseAvailability => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end && now > end) return 'FINISHED';
    if (start && now < start) return 'UPCOMING';
    return 'ACTIVE';
};

export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId } = params;

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseAvailability, setCourseAvailability] = useState<CourseAvailability>('ACTIVE');

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: courseData, error: courseError } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (courseError || !courseData) {
        router.push('/dashboard');
        return;
    }

    const availability = getCourseAvailability(courseData.start_date, courseData.end_date);
    setCourseAvailability(availability);

    if (availability === 'UPCOMING') {
        setCourse({ ...courseData, lessons: [] });
        setLoading(false);
        return;
    }

    const { data: lessonsData, error: lessonsError } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order', { ascending: true });
    setCourse({ ...courseData, lessons: lessonsError ? [] : (lessonsData || []) });

    const lessonIds = lessonsData?.map(l => l.id) || [];
    if (lessonIds.length > 0) {
      const { data: progressData } = await supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id).in('lesson_id', lessonIds).eq('is_completed', true);
      if (progressData) { setCompletedLessonIds(new Set(progressData.map(p => p.lesson_id))); }
    }
    
    const { data: examData } = await supabase.from('final_exams').select('id').eq('course_id', courseId).maybeSingle();
    if (examData) { setFinalExam(examData); }

    const { data: progress } = await supabase.from('course_progress').select('*').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
    if (progress) { setCourseProgress(progress); }

    if (progress?.status === 'completed') {
        const { data: certData } = await supabase.from('certificates').select('pdf_url').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
        if (certData) { setCertificate(certData); }
    }

    setLoading(false);
  }, [courseId, router, supabase]);

  useEffect(() => { fetchCourseData(); }, [fetchCourseData]);
  
  const allLessonsCompleted = course ? (course.lessons?.length > 0 && completedLessonIds.size === course.lessons.length) : false;
  const courseStatus = courseProgress?.status || 'in_progress';
  const examAttempts = courseProgress?.exam_attempts || 0;
  const isCourseFinished = courseAvailability === 'FINISHED';

  const ModuleItem = ({ lesson }: { lesson: Lesson }) => {
    const isCompleted = completedLessonIds.has(lesson.id);
    const prevLessonId = course?.lessons?.find(l => l.order === lesson.order - 1)?.id;
    const isUnlocked = isCourseFinished || lesson.order === 1 || (prevLessonId ? completedLessonIds.has(prevLessonId) : false);

    const Icon = isCompleted ? CheckCircle : (isUnlocked ? PlayCircle : Lock);
    const iconColor = isCompleted ? "text-green-500" : (isUnlocked ? "text-[#FF4500]" : "text-gray-500");
    
    const content = (
      <div className={`flex items-center justify-between p-4 rounded-lg transition-all ${!isUnlocked ? 'bg-gray-800/30 cursor-not-allowed opacity-50' : 'bg-gray-800/70 hover:bg-gray-700/80 cursor-pointer'}`}>
        <div className="flex items-center gap-4"><Icon className={iconColor} size={20} /><span className={`font-medium ${!isUnlocked ? 'text-gray-500' : 'text-white'}`}>{lesson.order}. {lesson.title}</span></div>
      </div>
    );
    
    // --- CORRECCIÓN DEFINITIVA ---
    // Usamos renderizado condicional en lugar de un Wrapper dinámico para evitar el error de tipos.
    if (isUnlocked) {
      return (
        <Link href={`/dashboard/cursos/${courseId}/leccion/${lesson.id}`}>
          {content}
        </Link>
      );
    }

    return <div>{content}</div>;
  };

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
                {courseAvailability === 'UPCOMING' && (
                     <div className="bg-blue-900/50 border border-blue-500/50 text-blue-300 p-6 rounded-lg text-center">
                        <Bell size={32} className="mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
                        <p className="text-lg">Esta capacitación aún no ha comenzado.</p>
                        {course.start_date && <p>Estará disponible a partir del {new Date(course.start_date).toLocaleDateString('es-AR', {timeZone: 'UTC'})}.</p>}
                    </div>
                )}
                
                {courseAvailability !== 'UPCOMING' && (
                    <div className='space-y-8'>
                        {isCourseFinished && courseStatus !== 'completed' && (
                            <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-4 rounded-lg flex items-center gap-4">
                                <CalendarOff size={24} />
                                <div>
                                    <h3 className="font-bold">Capacitación Finalizada</h3>
                                    <p className="text-sm">La fecha límite para completar este curso ha pasado. El curso se ha marcado como desaprobado.</p>
                                </div>
                            </div>
                        )}
                        <div className="bg-[#151515] rounded-xl p-8 border border-gray-800">
                            <h1 className="text-4xl font-bold text-white mb-4">{course.title}</h1>
                            <p className="text-lg text-gray-400 mb-8">{course.description}</p>
                            <div className="border-t border-gray-800 pt-8">
                                <h2 className="text-2xl font-semibold text-white mb-6">Módulos del Curso</h2>
                                <div className="space-y-4">
                                    {course.lessons && course.lessons.length > 0 ? (
                                        course.lessons.map((lesson) => (
                                            <ModuleItem key={lesson.id} lesson={lesson} />
                                        ))
                                    ) : (
                                        <p className="text-gray-500">Este curso aún no tiene módulos cargados.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {finalExam && (
                            <div className={`rounded-xl p-8 border ${ courseStatus === 'completed' ? 'bg-green-900/30 border-green-500/30' : courseStatus === 'failed' ? 'bg-red-900/30 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'}`}>
                                <h2 className={`text-2xl font-semibold mb-4 flex items-center gap-3 ${ courseStatus === 'completed' ? 'text-green-400' : courseStatus === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>
                                {courseStatus === 'failed' ? <XCircle/> : <ShieldCheck />}
                                Examen Final
                                </h2>
                                {courseStatus === 'completed' ? (
                                <div>
                                    <p className="text-green-300 mb-6">¡Curso aprobado! Ya podés descargar tu certificado o revisar el examen.</p>
                                    <div className="flex flex-wrap gap-4">
                                        {certificate?.pdf_url && <a href={certificate.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"> <Award size={18}/> Ver Certificado </a>}
                                        <Link href={`/dashboard/cursos/${courseId}/examen/${finalExam.id}/revision`} className="inline-flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500"><Eye size={18}/> Revisar Examen</Link>
                                    </div>
                                </div>
                                ) : courseStatus === 'failed' ? (
                                <div>
                                    <p className="text-red-300 mb-6">Curso desaprobado. No te quedan más intentos.</p>
                                    <Link href={`/dashboard/cursos/${courseId}/examen/${finalExam.id}/revision`} className="inline-flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500"><Eye size={18}/> Revisar Examen</Link>
                                </div>
                                ) : allLessonsCompleted ? (
                                <div>
                                    <p className="text-amber-300 mb-6">¡Todos los módulos completos! Ya podés rendir el examen final. Tenés {2 - examAttempts} intento(s) restante(s).</p>
                                    <Link href={!isCourseFinished ? `/dashboard/cursos/${courseId}/examen/${finalExam.id}` : '#'} className={`inline-block font-bold py-3 px-6 rounded-lg ${ isCourseFinished ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600' }`} aria-disabled={isCourseFinished} onClick={(e) => isCourseFinished && e.preventDefault()}>
                                        {isCourseFinished ? 'Examen Cerrado' : 'Realizar Examen Final'}
                                    </Link>
                                </div>
                                ) : (
                                <p className="text-gray-400">Debés completar todos los módulos para desbloquear el examen final.</p>
                                )}
                            </div>
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