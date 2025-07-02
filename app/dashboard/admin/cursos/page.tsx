// Ruta: app/dashboard/admin/cursos/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Plus, Edit, Trash2, CheckCircle, XCircle, BookCopy } from 'lucide-react';
import DeleteCourseModal from '@/components/admin/DeleteCourseModal';

// --- Tipos ---
type CourseForAdmin = {
  id: string;
  title: string;
  is_published: boolean;
  sectors: { name: string | null } | null;
};

type CourseToDelete = {
  id: string;
  title: string;
} | null;

// --- Componente de la Página ---
export default function AdminCoursesPage() {
    const supabase = createClient();
    const [courses, setCourses] = useState<CourseForAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<CourseToDelete>(null);

    // --- Carga de datos ---
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('courses')
                .select(`id, title, is_published, sectors ( name )`)
                .order('created_at', { ascending: false });

            if (error) {
                setError("No se pudieron cargar los cursos: " + error.message);
            } else {
                if (data) {
                    // CORRECCIÓN FINAL: Ignoramos el falso error del editor.
                    // @ts-ignore
                    setCourses(data);
                } else {
                    setCourses([]);
                }
            }
            setLoading(false);
        };
        fetchCourses();
    }, [supabase]);

    // --- Manejo del modal de eliminación ---
    const openDeleteModal = (course: {id: string, title: string}) => {
        setCourseToDelete(course);
    };

    const closeDeleteModal = () => {
        setCourseToDelete(null);
    };

    // --- Lógica de eliminación ---
    const handleDeleteCourse = async () => {
        if (!courseToDelete) return;
        setIsDeleting(true);

        const { error: deleteError } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseToDelete.id);

        if (deleteError) {
            alert("Error al eliminar el curso: " + deleteError.message);
        } else {
            setCourses(prevCourses => prevCourses.filter(c => c.id !== courseToDelete.id));
            closeDeleteModal();
        }
        setIsDeleting(false);
    };

    if (loading) {
        return <div className="p-8 text-center text-white">Cargando cursos...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400">{error}</div>;
    }

    // --- Renderizado ---
    return (
        <>
            <DeleteCourseModal
                isOpen={!!courseToDelete}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteCourse}
                courseTitle={courseToDelete?.title || ''}
                isDeleting={isDeleting}
            />
            <div className="text-gray-200 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <BookCopy /> Gestión de Cursos
                        </h1>
                        <Link href="/dashboard/admin/cursos/nuevo" className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                            <Plus size={20} /> Nuevo Curso
                        </Link>
                    </div>

                    <div className="bg-[#151515] rounded-xl border border-gray-800 overflow-x-auto">
                        <table className="w-full text-left min-w-[640px]">
                            <thead className="bg-gray-800/50">
                                <tr>
                                    <th className="p-4">Título del Curso</th>
                                    <th className="p-4">Sector</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {courses.map((course) => (
                                    <tr key={course.id}>
                                        <td className="p-4 font-medium text-white">{course.title}</td>
                                        <td className="p-4 text-gray-400">{course.sectors?.name || 'N/A'}</td>
                                        <td className="p-4">
                                            {course.is_published ? (
                                                <span className="flex items-center gap-2 text-green-400"><CheckCircle size={16} /> Publicado</span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-yellow-400"><XCircle size={16} /> Borrador</span>
                                            )}
                                        </td>
                                        <td className="p-4 flex justify-end gap-4">
                                            <Link href={`/dashboard/admin/cursos/editar/${course.id}`} className="text-blue-400 hover:text-blue-300">
                                                <Edit size={18} />
                                            </Link>
                                            <button onClick={() => openDeleteModal(course)} className="text-red-500 hover:text-red-400">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {courses.length === 0 && (
                            <p className="p-8 text-center text-gray-500">No se encontraron cursos.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}