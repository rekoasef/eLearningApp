// Ruta: app/cursos/[courseId]/examen/[examId]/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import QuizResultModal from '../../../../../components/cursos/QuizResultModal';

// --- Tipos ---
type ExamDetails = { id: string; title: string; questions: Question[]; lesson_id: string; };
type Question = { id: string; question_text: string; question_type: 'single' | 'multiple'; order: number; options: Option[]; };
type Option = { id: string; option_text: string; };
type UserAnswers = { [questionId: string]: string[]; };

type ResultState = {
  score: number;
  total: number;
  passed: boolean;
  certificateUrl?: string;
  isGeneratingCert: boolean;
};

export default function FinalExamPage({ params }: { params: { courseId: string, examId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId, examId } = params;

  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showResultModal, setShowResultModal] = useState(false);
  const [finalScore, setFinalScore] = useState<ResultState>({ score: 0, total: 0, passed: false, isGeneratingCert: false });

  const fetchExam = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('final_exams').select(`*, questions(*, options(*))`).eq('id', examId).single();
    if (error || !data) { setError("No se pudo cargar el examen."); setLoading(false); return; }
    setExam(data); setLoading(false);
  }, [examId, supabase]);

  useEffect(() => { fetchExam(); }, [fetchExam]);

  const handleAnswerChange = (questionId: string, optionId: string, questionType: 'single' | 'multiple') => {
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      const currentAnswers = newAnswers[questionId] || [];
      if (questionType === 'single') { newAnswers[questionId] = [optionId]; } else { if (currentAnswers.includes(optionId)) { newAnswers[questionId] = currentAnswers.filter(id => id !== optionId); } else { newAnswers[questionId] = [...currentAnswers, optionId]; } }
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const { data: correctAnswersData, error } = await supabase.from('options').select('id, question_id').eq('is_correct', true).in('question_id', exam!.questions.map(q => q.id));
    if (error) { setError("Error al verificar respuestas."); setSubmitting(false); return; }
    
    let score = 0;
    for (const question of exam!.questions) {
      const correctOptions = correctAnswersData.filter(a => a.question_id === question.id).map(a => a.id);
      const userOptions = userAnswers[question.id] || [];
      if (correctOptions.length === userOptions.length && correctOptions.every(id => userOptions.includes(id))) { score++; }
    }
    
    const passed = score >= (exam!.questions.length * 0.7);
    const { data: { user } } = await supabase.auth.getUser();

    setFinalScore({ score, total: exam!.questions.length, passed, isGeneratingCert: passed });
    setShowResultModal(true); 

    if (passed) {
      await supabase.from('course_progress').upsert({ user_id: user?.id, course_id: courseId, is_completed: true, completed_at: new Date().toISOString() });
      try {
        const { data, error: funcError } = await supabase.functions.invoke('generate-certificate', { body: { userId: user?.id, courseId: courseId } });
        if (funcError) throw funcError;
        setFinalScore(prev => ({...prev, certificateUrl: data.pdf_url, isGeneratingCert: false }));
      } catch (err: any) {
        console.error("Error al generar el certificado:", err);
        setError("Hubo un problema al generar tu certificado.");
        setFinalScore(prev => ({...prev, isGeneratingCert: false }));
      }
    }
    setSubmitting(false);
  };
  
  const handleCloseResultModal = () => {
    setShowResultModal(false);
    router.refresh();
    router.push(`/cursos/${courseId}`);
  };
  
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><p>Cargando Examen Final...</p></div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500"><p>{error}</p></div>;

  return (
    <>
      <QuizResultModal isOpen={showResultModal} onClose={handleCloseResultModal} passed={finalScore.passed} score={finalScore.score} totalQuestions={finalScore.total} certificateUrl={finalScore.certificateUrl} isGeneratingCert={finalScore.isGeneratingCert} />
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2">{exam?.title}</h1>
          <p className="text-gray-400 text-center mb-10">Respondé a las siguientes preguntas para finalizar el curso.</p>
          <div className="space-y-8">
            {exam?.questions.sort((a,b) => a.order - b.order).map((q, qIndex) => (
              <div key={q.id} className="bg-[#151515] p-6 rounded-lg border border-gray-800">
                <p className="font-bold text-lg mb-4">{qIndex + 1}. {q.question_text}</p>
                <div className="space-y-3">
                  {q.options.map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 p-3 rounded-md bg-gray-800 hover:bg-gray-700 cursor-pointer">
                      <input type={q.question_type === 'single' ? 'radio' : 'checkbox'} name={`question-${q.id}`} checked={(userAnswers[q.id] || []).includes(opt.id)} onChange={() => handleAnswerChange(q.id, opt.id, q.question_type)} className={`h-5 w-5 text-[#FF4500] bg-gray-700 border-gray-600 focus:ring-[#FF4500] ${q.question_type === 'single' ? 'rounded-full' : 'rounded'}`}/>
                      <span>{opt.option_text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <button onClick={handleSubmit} disabled={submitting} className="w-full max-w-md bg-amber-500 text-white font-bold py-3 text-lg rounded-lg hover:bg-amber-600 disabled:bg-gray-600">
              {submitting ? "Corrigiendo..." : "Finalizar Examen"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}