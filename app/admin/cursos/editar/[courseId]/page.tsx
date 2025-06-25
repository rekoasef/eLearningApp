// Ruta: app/admin/cursos/editar/[courseId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
// CORRECCIÓN: Se utiliza una ruta relativa para forzar la correcta localización del archivo.
import { createClient } from '../../../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, PlusCircle, Edit, Trash2 } from 'lucide-react';

// Tipos para los datos que vamos a manejar
type CourseData = {
  title: string;
  description: string | null;
  is_published: boolean;
  sectors: { name: string } | null;
};

type Lesson = {
  id: string;
  title: string;
  order: number;
};

export default function EditCoursePage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId } = params;

  // Estados del formulario del curso
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [sectorName, setSectorName] = useState('');
  
  // Estados para la gestión de módulos
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseAndLessonsData = async () => {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`title, description, is_published, sectors (name)`)
        .eq('id', courseId)
        .single();
      
      if (courseError || !courseData) {
        setError("No se pudo cargar el curso para editar.");
        setLoading(false);
        return;
      }
      
      setTitle(courseData.title);
      setDescription(courseData.description || '');
      setIsPublished(courseData.is_published);
      setSectorName(courseData.sectors?.name || 'Sin sector');

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, order')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (lessonsError) {
        setError("No se pudieron cargar los módulos.");
      } else {
        setLessons(lessonsData || []);
      }
      
      setLoading(false);
    };
    fetchCourseAndLessonsData();
  }, [courseId, supabase]);

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error: updateError } = await supabase
      .from('courses')
      .update({ title, description, is_published })
      .eq('id', courseId);
    if (updateError) {
      setError("No se pudo actualizar el curso.");
    } else {
      // Usaremos un método más amigable que alert() en el futuro
      alert('¡Curso actualizado con éxito!');
    }
    setLoading(false);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newLessonTitle) return;

      const newOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) + 1 : 1;

      const { data: newLesson, error: insertError } = await supabase
        .from('lessons')
        .insert({
            title: newLessonTitle,
            course_id: courseId,
            order: newOrder,
            content_type: 'video'
        })
        .select()
        .single();

      if (insertError) {
          setError('Error al crear el módulo.');
      } else if (newLesson) {
          setLessons([...lessons, newLesson]);
          setNewLessonTitle('');
          setIsCreatingLesson(false);
      }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const { error: deleteError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);
    
    if (deleteError) {
        setError('Error al borrar el módulo.');
        console.error('Delete error:', deleteError);
    } else {
        setLessons(lessons.filter(l => l.id !== lessonId));
    }
  };
  
  if (loading) {
    return <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-white"><p>Cargando datos del curso...</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <Link href="/admin/cursos" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft size={18} />
            Volver a la lista de cursos
          </Link>
        </header>

        <form onSubmit={handleUpdateCourse} className="bg-[#151515] rounded-xl border border-gray-800 p-8 space-y-6">
          <h1 className="text-3xl font-bold text-white">Editar Curso</h1>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Título del Curso</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md" required/>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sector</label>
            <div className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-700 rounded-md text-gray-400 cursor-not-allowed">
              {sectorName}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <label className="block text-sm font-medium text-gray-300">Publicado</label>
             <button type="button" onClick={() => setIsPublished(!isPublished)}
                className={`${isPublished ? 'bg-[#FF4500]' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full`}>
                <span className={`${isPublished ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end pt-4 border-t border-gray-800">
             <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-[#FF4500] text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 disabled:bg-gray-500">
              <Save size={20} />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        <div className="bg-[#151515] rounded-xl border border-gray-800 p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Módulos del Curso</h2>
                {!isCreatingLesson && (
                    <button onClick={() => setIsCreatingLesson(true)} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                        <PlusCircle size={20} />
                        Nuevo Módulo
                    </button>
                )}
            </div>

            {isCreatingLesson && (
                <form onSubmit={handleCreateLesson} className="bg-gray-800/50 p-4 rounded-lg mb-6 flex items-center gap-4">
                    <input
                        type="text"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        placeholder="Título del nuevo módulo"
                        className="flex-grow px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md"
                        autoFocus
                    />
                    <button type="submit" className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700">
                        <Save size={20} />
                    </button>
                    <button type="button" onClick={() => setIsCreatingLesson(false)} className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700">
                        X
                    </button>
                </form>
            )}

            <div className="space-y-3">
                {lessons.length > 0 ? lessons.map(lesson => (
                    <div key={lesson.id} className="flex items-center justify-between bg-gray-800/70 p-4 rounded-lg">
                        <p className="font-medium text-white">{lesson.order}. {lesson.title}</p>
                        <div className="flex gap-4">
                            <button className="text-gray-400 hover:text-white"><Edit size={18}/></button>
                            <button onClick={() => handleDeleteLesson(lesson.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                        </div>
                    </div>
                )) : (
                    !isCreatingLesson && <p className="text-gray-500 text-center py-4">Este curso aún no tiene módulos. ¡Añade el primero!</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
