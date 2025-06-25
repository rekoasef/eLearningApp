// Ruta: app/admin/cursos/page.tsx

'use client';

import { useEffect, useState } from 'react';
// CORRECCIÓN: Se utiliza una ruta relativa para forzar la correcta localización del archivo.
import { createClient } from '../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

type Course = {
  id: string;
  title: string;
  is_published: boolean;
  start_date: string | null;
  end_date: string | null;
};

export default function AdminCoursesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAndFetchCourses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || (profile.role_id !== 1 && profile.role_id !== 2)) {
        router.push('/dashboard');
        return;
      }
      setIsAdmin(true);

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, is_published, start_date, end_date')
        .order('title', { ascending: true });

      if (coursesError) {
        console.error("Error al cargar los cursos:", coursesError);
      } else {
        setCourses(coursesData || []);
      }
      setLoading(false);
    };

    checkAdminAndFetchCourses();
  }, [router, supabase]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <p>Verificando permisos y cargando datos...</p>
      </div>
    );
  }

  if (!isAdmin) { return null; }
  
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Gestión de Cursos</h1>
          <Link
            href="/admin/cursos/nuevo"
            className="flex items-center gap-2 bg-[#FF4500] text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <PlusCircle size={20} />
            Nuevo Curso
          </Link>
        </div>

        <div className="bg-[#151515] rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="p-4">Título del Curso</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Fecha de Inicio</th>
                <th className="p-4">Fecha de Fin</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-gray-800 hover:bg-[#1A1A1A]">
                  <td className="p-4 font-medium text-white">{course.title}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      course.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {course.is_published ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="p-4">{formatDate(course.start_date)}</td>
                  <td className="p-4">{formatDate(course.end_date)}</td>
                  <td className="p-4 flex justify-end gap-4">
                    {/* --- CORRECCIÓN: El botón ahora es un Link --- */}
                    <Link href={`/admin/cursos/editar/${course.id}`} className="text-gray-400 hover:text-white">
                      <Edit size={18} />
                    </Link>
                    <button className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
