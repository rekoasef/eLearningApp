// Ruta del archivo: app/dashboard/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import Link from 'next/link';
import CourseCard, { CourseCardType } from '@/components/cursos/CourseCard';

// --- Tipos y Helpers ---
type CourseAvailability = 'ACTIVE' | 'UPCOMING' | 'FINISHED';
type Course = CourseCardType;
type Profile = { full_name: string | null };

const getCourseAvailability = (startDate: string | null, endDate: string | null): CourseAvailability => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end && now > end) return 'FINISHED';
    if (start && now < start) return 'UPCOMING';
    return 'ACTIVE';
};

const StatCard = ({ icon, label, value, colorClass, isLink = false, href = '#' }: { icon: React.ReactNode, label: string, value: number, colorClass: string, isLink?: boolean, href?: string }) => {
    const content = (
        <div className={`bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 flex items-center gap-5 ${isLink ? 'transition-colors hover:border-amber-500/30' : ''}`}>
            <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-sm text-gray-400">{label}</p>
            </div>
        </div>
    );
    return isLink ? <Link href={href}>{content}</Link> : <div>{content}</div>;
};

// --- Página Principal ---
export default function DashboardPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // Estado para el perfil
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificateCount, setCertificateCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { return; }
      setUser(user);

      // Hacemos todas las peticiones en paralelo para más eficiencia
      const [coursesRes, progressRes, certRes, profileRes] = await Promise.all([
        supabase.from('courses').select('id, title, description, start_date, end_date').eq('is_published', true),
        supabase.from('course_progress').select('course_id, status').eq('user_id', user.id),
        supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('profiles').select('full_name').eq('id', user.id).single()
      ]);

      const coursesData = coursesRes.data || [];
      const progressData = progressRes.data || [];
      const certCount = certRes.count || 0;
      
      setProfile(profileRes.data);
      setCertificateCount(certCount);

      const coursesWithStatus = coursesData.map(course => {
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
  }, [supabase]);
  
  const courseStats = useMemo(() => {
    const activeAndFinishedCourses = courses.filter(c => c.availability === 'ACTIVE' || c.availability === 'FINISHED');
    const completed = activeAndFinishedCourses.filter(c => c.status === 'completed').length;
    const failed = activeAndFinishedCourses.filter(c => c.status === 'failed').length;
    const inProgress = activeAndFinishedCourses.filter(c => c.status === 'in_progress').length;
    return { completed, failed, inProgress };
  }, [courses]);

  // Filtramos para mostrar solo los cursos activos y finalizados en el dashboard
  const relevantCourses = useMemo(() =>
    courses.filter(c => c.availability === 'ACTIVE' || c.availability === 'FINISHED'),
  [courses]);

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
        <main>
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-white mb-2">¡Hola, {profile?.full_name || user?.email?.split('@')[0]}!</h2>
            <p className="text-lg text-gray-400">Este es un resumen de tu progreso.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            <StatCard icon={<CheckCircle size={24} className="text-green-400" />} label="Cursos Aprobados" value={courseStats.completed} colorClass="bg-green-500/10" />
            <StatCard icon={<XCircle size={24} className="text-red-400" />} label="Cursos Desaprobados" value={courseStats.failed} colorClass="bg-red-500/10" />
            <StatCard icon={<Clock size={24} className="text-blue-400" />} label="Cursos En Progreso" value={courseStats.inProgress} colorClass="bg-blue-500/10" />
            <StatCard icon={<Award size={24} className="text-amber-400" />} label="Certificados" value={certificateCount} colorClass="bg-amber-500/10" isLink={true} href="/dashboard/certificados" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-6">Mis Cursos Activos</h3>
            {relevantCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relevantCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="bg-[#1A1A1A] rounded-lg p-8 text-center border border-gray-800">
                <p className="text-gray-400">No tienes cursos activos en este momento.</p>
              </div>
            )}
          </div>
        </main>
    </div>
  );
}