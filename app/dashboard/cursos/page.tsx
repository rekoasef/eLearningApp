// Ruta: app/dashboard/cursos/page.tsx

'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import CourseCard, { CourseCardType } from '@/components/cursos/CourseCard';
import { BookCopy, Clock } from 'lucide-react';

type CourseAvailability = 'ACTIVE' | 'UPCOMING' | 'FINISHED';

const getCourseAvailability = (startDate: string | null, endDate: string | null): CourseAvailability => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end && now > end) return 'FINISHED';
    if (start && now < start) return 'UPCOMING';
    return 'ACTIVE';
};

export default function AllCoursesPage() {
    const supabase = createClient();
    const [courses, setCourses] = useState<CourseCardType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllCourses = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { return; }

            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('id, title, description, start_date, end_date')
                .eq('is_published', true);
            
            if (coursesError) { console.error('Error fetching courses:', coursesError); }

            const { data: progressData, error: progressError } = await supabase
                .from('course_progress')
                .select('course_id, status')
                .eq('user_id', user.id);

            if(progressError) { console.error('Error fetching progress:', progressError); }

            const coursesWithDetails = coursesData?.map(course => {
                const progress = progressData?.find(p => p.course_id === course.id);
                return {
                    ...course,
                    status: progress?.status || 'in_progress',
                    availability: getCourseAvailability(course.start_date, course.end_date)
                };
            }) || [];
            
            setCourses(coursesWithDetails);
            setLoading(false);
        };
        fetchAllCourses();
    }, [supabase]);

    const availableCourses = useMemo(() => 
        courses.filter(c => c.availability === 'ACTIVE' || c.availability === 'FINISHED'),
    [courses]);
    
    const upcomingCourses = useMemo(() => 
        courses.filter(c => c.availability === 'UPCOMING'),
    [courses]);

    if (loading) {
        return <div className="p-8 text-center text-white">Cargando cursos...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-10">Catálogo de Cursos</h1>

            {/* Cursos Disponibles */}
            <section>
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3"><BookCopy /> Cursos Disponibles</h2>
                {availableCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {availableCourses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">No hay cursos disponibles en este momento.</p>
                )}
            </section>

            {/* Cursos Próximos */}
            {upcomingCourses.length > 0 && (
                <section className="mt-12 pt-8 border-t border-gray-800">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3"><Clock /> Próximamente</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {upcomingCourses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}