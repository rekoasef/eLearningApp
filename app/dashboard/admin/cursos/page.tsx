// Ruta: app/dashboard/admin/cursos/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import DeleteCourseModal from '@/components/admin/DeleteCourseModal';

// --- Tipos ---
type Course = {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export default function AdminCoursesPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    // --- CAMBIO CLAVE: Usamos la nueva función específica para admins ---
    const { data, error } = await supabase.rpc('get_admin_courses');

    if (error) {
        console.error('Error fetching admin courses via rpc:', error);
        setCourses([]);
    } else {
        const sortedData = (data || []).sort((a: Course, b: Course) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setCourses(sortedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openDeleteModal = (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const { error } = await supabase.rpc('delete_course_with_dependencies', {
      course_id_to_delete: courseToDelete.id
    });
    
    if (error) {
      console.error("Error al eliminar el curso:", error);
      setDeleteError("No se pudo eliminar el curso. " + error.message);
    } else {
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
      await fetchCourses();
    }
    setIsDeleting(false);
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-AR', { timeZone: 'UTC' });
  };

  if (loading) return <div className="p-8 text-white text-center">Cargando cursos...</div>;

  return (
    <>
      <DeleteCourseModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        courseTitle={courseToDelete?.title || ''}
        isDeleting={isDeleting}
      />
      <div className="text-gray-200 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Gestión de Cursos</h1>
            <Link href="/dashboard/admin/cursos/nuevo" className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
              <PlusCircle size={20} /> Crear Nuevo Curso
            </Link>
          </div>
          
          {deleteError && (
              <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm mb-6">{deleteError}</p>
          )}

          <div className="bg-[#151515] rounded-xl border border-gray-800 overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-gray-800/50">
                  <tr>
                      <th className="p-4">Título del Curso</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4">Fecha de Inicio</th>
                      <th className="p-4">Fecha de Fin</th>
                      <th className="p-4 text-right">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                  {courses.map((course) => (
                      <tr key={course.id}>
                          <td className="p-4 font-medium text-white">{course.title}</td>
                          <td className="p-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${course.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-300'}`}>
                                  {course.is_published ? 'Publicado' : 'Borrador'}
                              </span>
                          </td>
                          <td className="p-4 text-gray-400">{formatDate(course.start_date)}</td>
                          <td className="p-4 text-gray-400">{formatDate(course.end_date)}</td>
                          <td className="p-4 flex justify-end gap-4">
                              <Link href={`/dashboard/admin/cursos/editar/${course.id}`} className="text-blue-400 hover:text-blue-300"><Edit size={18}/></Link>
                              <button onClick={() => openDeleteModal(course)} className="text-red-500 hover:text-red-400"><Trash2 size={18}/></button>
                          </td>
                      </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}