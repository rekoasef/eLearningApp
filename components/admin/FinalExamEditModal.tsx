// Ruta: components/admin/FinalExamEditModal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trash2, PlusCircle, Sparkles, Loader2 } from 'lucide-react';

// --- Tipos de Datos ---
type Question = {
  id?: string;
  final_exam_id: string;
  question_text: string;
  question_type: 'single' | 'multiple';
  order: number;
  options: Option[];
};
type Option = { id?: string; option_text: string; is_correct: boolean; };
type FinalExamEditModalProps = {
  examId: string;
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function FinalExamEditModal({ examId, courseId, isOpen, onClose }: FinalExamEditModalProps) {
  const supabase = createClient();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchQuestions = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('questions')
      .select(`*, options (*)`)
      .eq('final_exam_id', examId)
      .order('order', { ascending: true });

    if (error) {
      setError('Error al cargar las preguntas del examen.');
    } else {
      const sanitizedData = data.map(q => ({...q, question_type: q.question_type || 'single'})) as Question[];
      setQuestions(sanitizedData || []);
    }
    setLoading(false);
  }, [isOpen, examId, supabase]);

  useEffect(() => {
    if (isOpen) {
        fetchQuestions();
    }
  }, [isOpen, fetchQuestions]);

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => { const newQuestions = [...questions]; (newQuestions[index] as any)[field] = value; setQuestions(newQuestions); };
  const handleOptionTextChange = (qIndex: number, oIndex: number, text: string) => { const newQuestions = [...questions]; newQuestions[qIndex].options[oIndex].option_text = text; setQuestions(newQuestions); };
  const handleCorrectOptionChange = (qIndex: number, oIndex: number) => { const newQuestions = [...questions]; const question = newQuestions[qIndex]; if (question.question_type === 'single') { question.options.forEach((opt, idx) => { opt.is_correct = idx === oIndex; }); } else { question.options[oIndex].is_correct = !question.options[oIndex].is_correct; } setQuestions(newQuestions); };
  const addQuestion = () => { const newQuestion: Question = { id: `new-${Date.now()}`, final_exam_id: examId, question_text: '', question_type: 'single', order: questions.length + 1, options: [], }; setQuestions([...questions, newQuestion]); };
  const addOption = (qIndex: number) => { const newQuestions = [...questions]; newQuestions[qIndex].options.push({ id: `new-opt-${Date.now()}`, option_text: '', is_correct: false }); setQuestions(newQuestions); };
  const removeQuestion = (index: number) => { setQuestions(questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i + 1 }))); };
  const removeOption = (qIndex: number, oIndex: number) => { const newQuestions = [...questions]; newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex); setQuestions(newQuestions); };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const { data: courseData, error: courseError } = await supabase.from('courses').select('title').eq('id', courseId).single();
      if (courseError || !courseData?.title) {
        throw new Error("No se pudo obtener el título del curso.");
      }

      const { data, error: functionError } = await supabase.functions.invoke('generate-final-exam', {
          body: { courseTitle: courseData.title }
      });

      if (functionError) throw functionError;

      const enrichedQuestions = data.questions.map((q: any, index: number) => ({
          ...q,
          question_type: q.question_type || 'single',
          order: q.order || index + 1,
          final_exam_id: examId,
      }));

      setQuestions(enrichedQuestions);

    } catch (err: any) {
        setError(err.data?.error || err.message || "Ocurrió un error desconocido.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError(null);
    try {
      const questionsToSave = questions.map((q, qIndex) => ({
        quiz_id: null, 
        final_exam_id: examId,
        question_text: q.question_text,
        question_type: q.question_type,
        order: qIndex + 1,
        options: q.options.map(opt => ({
          option_text: opt.option_text,
          is_correct: opt.is_correct
        }))
      }));

      const { error: rpcError } = await supabase.rpc('update_final_exam_questions', {
        exam_id_in: examId,
        questions_in: questionsToSave
      });

      if (rpcError) throw rpcError;

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] text-white rounded-xl border border-gray-700 p-8 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Editar Examen Final</h2>

        <div className="mb-4">
          <button onClick={handleGenerateWithAI} disabled={isGenerating} className="flex items-center gap-2 text-sm bg-purple-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} />}
            {isGenerating ? 'Generando...' : 'Generar 10 Preguntas con IA'}
          </button>
        </div>

        {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}

        <div className="flex-grow overflow-y-auto pr-4 space-y-6">
          {loading ? (<p>Cargando preguntas...</p>) : (
            questions.map((q, qIndex) => (
              <div key={q.id || qIndex} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-bold text-lg">Pregunta {qIndex + 1}</label>
                  <div className="flex items-center gap-4">
                    <div className="flex rounded-md bg-gray-700 p-1 text-sm">
                      <button onClick={() => handleQuestionChange(qIndex, 'question_type', 'single')} className={`px-2 py-1 rounded ${q.question_type === 'single' ? 'bg-[#FF4500]' : ''}`}>Única</button>
                      <button onClick={() => handleQuestionChange(qIndex, 'question_type', 'multiple')} className={`px-2 py-1 rounded ${q.question_type === 'multiple' ? 'bg-[#FF4500]' : ''}`}>Múltiple</button>
                    </div>
                    <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-400"><Trash2 size={20}/></button>
                  </div>
                </div>
                <textarea value={q.question_text} onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                  placeholder="Escribí el enunciado de la pregunta..." className="w-full px-3 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md mb-4" rows={2}/>
                <div className="space-y-3">
                  {q.options.map((opt, oIndex) => (
                    <div key={opt.id || oIndex} className="flex items-center gap-2">
                      <input type={q.question_type === 'single' ? 'radio' : 'checkbox'} name={`question-${qIndex}-correct`}
                        checked={opt.is_correct} onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                        className={`h-5 w-5 text-[#FF4500] bg-gray-700 border-gray-600 focus:ring-[#FF4500] ${q.question_type === 'single' ? 'rounded-full' : 'rounded'}`}/>
                      <input type="text" value={opt.option_text} onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                        placeholder={`Opción ${oIndex + 1}`} className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/>
                      <button onClick={() => removeOption(qIndex, oIndex)} className="text-gray-500 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  <button onClick={() => addOption(qIndex)} className="w-full flex items-center justify-center gap-2 text-sm py-1 border border-dashed border-gray-600 rounded-lg hover:bg-gray-800 text-gray-400">
                    <PlusCircle size={16}/> Añadir Opción
                  </button>
                </div>
              </div>
            ))
          )}
          {!loading && ( <button onClick={addQuestion} className="w-full py-2 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-800 text-gray-300"> + Añadir Pregunta </button> )}
        </div>
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-700 mt-6">
          <button onClick={onClose} disabled={saving} className="py-2 px-4 bg-gray-600 rounded-lg hover:bg-gray-500">Cancelar</button>
          <button onClick={handleSaveChanges} disabled={saving || loading} className="py-2 px-4 bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}