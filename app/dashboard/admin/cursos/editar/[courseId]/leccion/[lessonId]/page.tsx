// Ruta: app/dashboard/admin/cursos/editar/[courseId]/leccion/[lessonId]/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Film, FileText, BrainCircuit, Edit, Trash2, PlusCircle } from 'lucide-react';

import AddContentModal from '@/components/admin/AddContentModal';
import EditContentModal from '@/components/admin/EditContentModal';
import QuizEditModal from '@/components/admin/QuizEditModal';

// --- Tipos ---
type LessonDetails = { id: string; title: string; course_id: string; };
type Content = { id: string; lesson_id: string; content_type: 'video' | 'pdf'; title: string; url: string; };
type Quiz = { id: string; lesson_id: string; };

// --- Componente Principal ---
export default function LessonEditPage({ params }: { params: { courseId: string, lessonId: string } }) {
  const supabase = createClient();
  const { courseId, lessonId } = params;

  // --- Estados ---
  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [isEditContentModalOpen, setIsEditContentModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  const fetchLessonData = useCallback(async () => {
    setLoading(true); setError(null);
    const { data: lessonData, error: lessonError } = await supabase.from('lessons').select('id, title, course_id').eq('id', lessonId).eq('course_id', courseId).single();
    if (lessonError || !lessonData) { setLoading(false); return notFound(); }
    setLesson(lessonData);
    const { data: contentsData, error: contentsError } = await supabase.from('contents').select('*').eq('lesson_id', lessonId).order('created_at', { ascending: true });
    if (contentsError) { setError('Error al cargar los contenidos.'); } else { setContents(contentsData || []); }
    const { data: quizData, error: quizError } = await supabase.from('quizzes').select('id, lesson_id').eq('lesson_id', lessonId).maybeSingle();
    if (!quizError && quizData) { setQuiz(quizData); }
    setLoading(false);
  }, [courseId, lessonId, supabase, notFound]);

  useEffect(() => { fetchLessonData(); }, [fetchLessonData]);
  
  const handleContentAdded = (newContent: Content) => setContents(prev => [...prev, newContent]);
  const handleOpenEditModal = (content: Content) => { setSelectedContent(content); setIsEditContentModalOpen(true); };
  const handleContentUpdated = (updatedContent: Content) => setContents(prev => prev.map(c => c.id === updatedContent.id ? updatedContent : c));
  
  const handleDeleteContent = async (contentId: string) => {
    if (window.confirm("¿Estás seguro de que querés borrar este contenido?")) {
      const { error } = await supabase.from('contents').delete().eq('id', contentId);
      if (error) { setError("Error al borrar el contenido: " + error.message); } 
      else { setContents(prev => prev.filter(c => c.id !== contentId)); }
    }
  };

  const handleCreateQuiz = async () => {
    setError(null);
    const { data, error } = await supabase.from('quizzes').insert({ lesson_id: lessonId }).select().single();
    if (error) { setError("Error al crear el quiz."); } else { setQuiz(data); setIsQuizModalOpen(true); }
  };
  
  const handleDeleteQuiz = async () => {
    if (!quiz) return;
    if (window.confirm("¿Estás seguro de que querés borrar este quiz y todas sus preguntas? Esta acción es irreversible.")) {
        const { error } = await supabase.from('quizzes').delete().eq('id', quiz.id);
        if (error) {
            setError("Error al borrar el quiz: " + error.message);
        } else {
            setQuiz(null);
        }
    }
  };

  if (loading) return <div className="p-8 text-white text-center">Cargando datos del módulo...</div>;
  if (!lesson) return notFound();

  return (
    <>
      <AddContentModal lessonId={lessonId} courseId={courseId} isOpen={isAddContentModalOpen} onClose={() => setIsAddContentModalOpen(false)} onContentAdded={handleContentAdded} />
      <EditContentModal content={selectedContent} isOpen={isEditContentModalOpen} onClose={() => setIsEditContentModalOpen(false)} onContentUpdated={handleContentUpdated} />
      {quiz && <QuizEditModal quizId={quiz.id} isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} />}

      <div className="text-gray-200 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            {/* RUTA CORREGIDA */}
            <Link href={`/dashboard/admin/cursos/editar/${courseId}`} className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft size={18} /> Volver a la edición del curso
            </Link>
          </header>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Gestionar Módulo: {lesson.title}</h1>
            <p className="text-gray-400">Añadí, editá o eliminá el material de este módulo.</p>
          </div>
          {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
          <div className="bg-[#151515] rounded-xl border border-gray-800 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Contenidos del Módulo</h2>
              <button onClick={() => setIsAddContentModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">
                <PlusCircle size={18} /> Agregar Contenido
              </button>
            </div>
            <div className="space-y-3">
              {contents.length > 0 ? contents.map(content => (
                <div key={content.id} className="flex items-center justify-between bg-gray-800/70 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    {content.content_type === 'video' ? <Film className="text-blue-400" size={20} /> : <FileText className="text-red-400" size={20} />}
                    <span className="font-medium text-white">{content.title}</span>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => handleOpenEditModal(content)} className="text-gray-400 hover:text-white"><Edit size={18}/></button>
                    <button onClick={() => handleDeleteContent(content.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 bg-gray-900/50 p-6 rounded-lg"><p>Este módulo todavía no tiene contenido.</p></div>
              )}
            </div>
          </div>
          
          <div className="bg-[#151515] rounded-xl border border-gray-800 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Quiz Evaluatorio</h2>
            {quiz ? (
                <div>
                    <p className="text-green-400 mb-4">Este módulo ya tiene un quiz. Podés editarlo o eliminarlo.</p>
                    <div className="flex gap-4">
                        <button onClick={() => setIsQuizModalOpen(true)} className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                            <Edit size={18} /> Editar Preguntas
                        </button>
                        <button onClick={handleDeleteQuiz} className="flex items-center gap-2 bg-red-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">
                            <Trash2 size={18} /> Eliminar Quiz
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <p className="text-gray-500 mb-4">Este módulo aún no tiene un quiz.</p>
                    <button onClick={handleCreateQuiz} className="flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700">
                        Crear Quiz Manualmente
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}