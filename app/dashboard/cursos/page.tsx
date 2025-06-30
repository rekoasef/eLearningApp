// Ruta: app/dashboard/cursos/page.tsx

'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'; // Importamos XCircle
import CourseCard, { CourseCardType } from '@/components/cursos/CourseCard';

// --- Tipos y Helpers ---
type CourseAvailability = 'ACTIVE' | 'UPCOMING' | 'FINISHED';
type Course = CourseCardType;

const getCourseAvailability = (startDate: string | null, endDate: string | null): CourseAvailability => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end && now > end) return 'FINISHED';
    if (start && now < start) return 'UPCOMING';
    return 'ACTIVE';
};

// --- Componente para una sección de cursos ---
const CourseSection = ({ title, courses, icon }: { title: string, courses: Course[], icon: React.ReactNode }) => {
    if (courses.length === 0) {
        return null; 
    }

    return (
        <div>
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                {icon}
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
    );
};


// --- Página Principal de Cursos ---
export default function CoursesListPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const [coursesRes, progressRes] = await Promise.all([
        supabase.rpc('get_courses_for_user'),
        supabase.from('course_progress').select('course_id, status').eq('user_id', user.id)
      ]);

      const coursesData = (coursesRes.data || []) as any[];
      const progressData = progressRes.data || [];

      const coursesWithStatus = coursesData
        .filter(course => course.is_published)
        .map(course => {
            const progress = progressData.find(p => p.course_id === course.id);
            return {
            ...course,
            status: progress?.status || 'in_progress',
            availability: getCourseAvailability(course.start_date, course.end_date)
            };
      });
      
      setCourses(coursesWithStatus);
      setLoading(false);
    };
    fetchData();
  }, [supabase, router]);
  
  // --- LÓGICA DE FILTRADO CORREGIDA ---
  const availableCourses = useMemo(() => courses.filter(c => c.availability === 'ACTIVE' && c.status === 'in_progress'), [courses]);
  const upcomingCourses = useMemo(() => courses.filter(c => c.availability === 'UPCOMING'), [courses]);
  // Un curso está "finalizado" si su fecha pasó, O si su estado es completado O fallido.
  const finishedCourses = useMemo(() => courses.filter(c => c.availability === 'FINISHED' || c.status === 'completed' || c.status === 'failed'), [courses]);

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
    <div className="text-gray-200 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit">
                <ArrowLeft size={18} />
                Volver al Dashboard
            </Link>
        </header>
        <main>
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Mis Cursos</h1>
            <p className="text-lg text-gray-400">
              Explora todas las capacitaciones disponibles para vos.
            </p>
          </div>

          <div className="space-y-16">
            <CourseSection 
              title="Cursos Disponibles" 
              courses={availableCourses}
              icon={<BookOpen className="text-[#FF4500]"/>}
            />
            <CourseSection 
              title="Próximos Cursos" 
              courses={upcomingCourses}
              icon={<Calendar className="text-blue-400"/>}
            />
            <CourseSection 
              title="Cursos Finalizados" 
              courses={finishedCourses}
              icon={<CheckCircle className="text-green-400"/>}
            />
          </div>

          {courses.length === 0 && (
             <div className="bg-[#1A1A1A] rounded-lg p-12 text-center border border-dashed border-gray-700">
                <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white">No hay cursos disponibles</h3>
                <p className="text-gray-400 mt-2">Actualmente no hay cursos publicados para tu sector. Vuelve a consultar más tarde.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}