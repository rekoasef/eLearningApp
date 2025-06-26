// Ruta: app/admin/cursos/editar/[courseId]/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '../../../../../lib/supabase/client';
import Link from 'next/link';
import { useRouter, notFound } from 'next/navigation';
import { ArrowLeft, Save, PlusCircle, Edit, Trash2, ShieldCheck } from 'lucide-react';
import FinalExamEditModal from '../../../../../components/admin/FinalExamEditModal'; // IMPORTAMOS EL NUEVO MODAL

// --- Tipos ---
type Lesson = { id: string; title: string; order: number; };
type FinalExam = { id: string; course_id: string; };

// --- Componente Principal ---
export default function EditCoursePage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId } = params;

  // --- Estados ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [sectorName, setSectorName] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  
  // Estados para el examen final
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // ... (lógica para traer datos del curso y lecciones sin cambios)
    setLoading(true);
    const { data: courseData, error: courseError } = await supabase.from('courses').select(`title, description, is_published, sectors (name)`).eq('id', courseId).single();
    if (courseError || !courseData) { setError("No se pudo cargar el curso."); setLoading(false); return; }
    setTitle(courseData.title); setDescription(courseData.description || ''); setIsPublished(courseData.is_published); setSectorName(courseData.sectors?.name || 'Sin sector');
    const { data: lessonsData, error: lessonsError } = await supabase.from('lessons').select('id, title, order').eq('course_id', courseId).order('order', { ascending: true });
    if (lessonsError) { setError("No se pudieron cargar los módulos."); } else { setLessons(lessonsData || []); }
    
    // NUEVO: Buscamos si existe un examen final para este curso
    const { data: examData, error: examError } = await supabase.from('final_exams').select('*').eq('course_id', courseId).maybeSingle();
    if (!examError && examData) { setFinalExam(examData); }

    setLoading(false);
  }, [courseId, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Lógica de Guardado y Borrado ---
  const handleUpdateCourse = async (e: React.FormEvent) => { /* ... (sin cambios) ... */  e.preventDefault(); setLoading(true); const { error } = await supabase.from('courses').update({ title, description, is_published }).eq('id', courseId); if (error) { setError("No se pudo actualizar."); } else { alert('¡Curso actualizado!'); } setLoading(false); };
  const handleCreateLesson = async (e: React.FormEvent) => { /* ... (sin cambios) ... */ e.preventDefault(); if (!newLessonTitle) return; const order = lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) + 1 : 1; const { data, error } = await supabase.from('lessons').insert({ title: newLessonTitle, course_id: courseId, order, content_type: 'video' }).select().single(); if (error) { setError('Error al crear módulo.'); } else if (data) { setLessons([...lessons, data]); setNewLessonTitle(''); setIsCreatingLesson(false); } };
  const handleDeleteLesson = async (lessonId: string) => { /* ... (sin cambios) ... */ if (window.confirm("¿Seguro?")) { const { error } = await supabase.from('lessons').delete().eq('id', lessonId); if (error) { setError('Error al borrar.'); } else { setLessons(lessons.filter(l => l.id !== lessonId)); } } };

  // --- NUEVA LÓGICA PARA EL EXAMEN FINAL ---
  const handleCreateFinalExam = async () => {
    const { data, error } = await supabase.from('final_exams').insert({ course_id: courseId }).select().single();
    if (error) {
        setError("Error al crear el examen final.");
    } else {
        setFinalExam(data);
        setIsExamModalOpen(true); // Abrimos el modal para editarlo
    }
  };

  const handleDeleteFinalExam = async () => {
    if (!finalExam) return;
    if (window.confirm("¿Seguro que querés borrar el examen final? Se borrarán todas sus preguntas.")) {
        const { error } = await supabase.from('final_exams').delete().eq('id', finalExam.id);
        if (error) {
            setError("Error al borrar el examen final.");
        } else {
            setFinalExam(null);
        }
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-white"><p>Cargando...</p></div>;
  
  return (
    <>
      {/* Añadimos el nuevo modal a la página */}
      {finalExam && <FinalExamEditModal examId={finalExam.id} isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} />}

      <div className="min-h-screen bg-[#0D0D0D] text-gray-200 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <Link href="/admin/cursos" className="flex items-center gap-2 text-gray-400 hover:text-white"><ArrowLeft size={18} /> Volver a la lista</Link>
          </header>

          {/* Formulario de Edición del Curso (sin cambios) */}
          <form onSubmit={handleUpdateCourse} className="bg-[#151515] rounded-xl border border-gray-800 p-8 space-y-6">
            <h1 className="text-3xl font-bold text-white">Editar Curso</h1>
            <div><label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Título del Curso</label><input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md" required/></div>
            <div><label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Descripción</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md"/></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-2">Sector</label><div className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-700 rounded-md text-gray-400 cursor-not-allowed">{sectorName}</div></div>
            <div className="flex items-center gap-4"><label className="block text-sm font-medium text-gray-300">Publicado</label><button type="button" onClick={() => setIsPublished(!isPublished)} className={`${isPublished ? 'bg-[#FF4500]' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full`}><span className={`${isPublished ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}/>
            </button></div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex justify-end pt-4 border-t border-gray-800"><button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#FF4500] text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 disabled:bg-gray-500"><Save size={20} />{loading ? 'Guardando...' : 'Guardar Cambios'}</button></div>
          </form>

          {/* Sección de Módulos (sin cambios) */}
          <div className="bg-[#151515] rounded-xl border border-gray-800 p-8">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-white">Módulos del Curso</h2>
              {!isCreatingLesson && (<button onClick={() => setIsCreatingLesson(true)} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"><PlusCircle size={20} />Nuevo Módulo</button>)}
            </div>
            {isCreatingLesson && (<form onSubmit={handleCreateLesson} className="bg-gray-800/50 p-4 rounded-lg mb-6 flex items-center gap-4"><input type="text" value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder="Título del nuevo módulo" className="flex-grow px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md" autoFocus/><button type="submit" className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700"><Save size={20} /></button><button type="button" onClick={() => setIsCreatingLesson(false)} className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700">X</button></form>)}
            <div className="space-y-3">{lessons.length > 0 ? lessons.map(lesson => (<div key={lesson.id} className="flex items-center justify-between bg-gray-800/70 p-4 rounded-lg group"><Link href={`/admin/cursos/editar/${courseId}/leccion/${lesson.id}`} className="flex-grow"><p className="font-medium text-white group-hover:text-[#FF4500] transition-colors">{lesson.order}. {lesson.title}</p></Link><div className="flex gap-4"><Link href={`/admin/cursos/editar/${courseId}/leccion/${lesson.id}`} className="text-gray-400 hover:text-white"><Edit size={18}/></Link><button onClick={() => handleDeleteLesson(lesson.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button></div></div>)) : (!isCreatingLesson && <p className="text-gray-500 text-center py-4">Este curso aún no tiene módulos.</p>)}</div>
          </div>
          
          {/* --- NUEVA SECCIÓN PARA EL EXAMEN FINAL --- */}
          <div className="bg-[#151515] rounded-xl border border-gray-800 p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <ShieldCheck className="text-amber-400"/>
                Examen Final
            </h2>
            {finalExam ? (
                <div>
                    <p className="text-gray-300 mb-4">Este curso tiene un examen final. Podés editar sus preguntas o eliminarlo.</p>
                    <div className="flex gap-4">
                        <button onClick={() => setIsExamModalOpen(true)} className="flex items-center gap-2 bg-amber-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-600">
                            <Edit size={18} /> Editar Examen
                        </button>
                         <button onClick={handleDeleteFinalExam} className="flex items-center gap-2 bg-red-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">
                            <Trash2 size={18} /> Eliminar Examen
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <p className="text-gray-400 mb-4">Este curso aún no tiene un examen final.</p>
                    <button onClick={handleCreateFinalExam} className="flex items-center gap-2 bg-amber-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-600">
                        <PlusCircle size={18} /> Crear Examen Final
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}