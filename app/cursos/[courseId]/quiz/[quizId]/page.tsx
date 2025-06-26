// Ruta: app/cursos/[courseId]/quiz/[quizId]/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import QuizResultModal from '../../../../../components/cursos/QuizResultModal';

// --- Tipos ---
type QuizDetails = { id: string; lesson_id: string; title: string; questions: Question[]; };
type Question = { id: string; question_text: string; question_type: 'single' | 'multiple'; order: number; options: Option[]; };
type Option = { id: string; option_text: string; };
type UserAnswers = { [questionId: string]: string[]; };

export default function QuizPage({ params }: { params: { courseId: string, quizId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId, quizId } = params;

  // ... (estados sin cambios)
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [finalScore, setFinalScore] = useState({ score: 0, total: 0, passed: false });

  const fetchQuiz = useCallback(async () => {
    // ... (fetch sin cambios)
    setLoading(true);
    const { data, error } = await supabase.from('quizzes').select(`*, questions(*, options(*))`).eq('id', quizId).single();
    if (error || !data) { setError("No se pudo cargar el quiz."); setLoading(false); return; }
    setQuiz(data); setLoading(false);
  }, [quizId, supabase]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  const handleAnswerChange = (questionId: string, optionId: string, questionType: 'single' | 'multiple') => {
    // ... (lógica de cambio sin cambios)
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      const currentAnswers = newAnswers[questionId] || [];
      if (questionType === 'single') { newAnswers[questionId] = [optionId]; }
      else { if (currentAnswers.includes(optionId)) { newAnswers[questionId] = currentAnswers.filter(id => id !== optionId); } else { newAnswers[questionId] = [...currentAnswers, optionId]; } }
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const { data: correctAnswersData, error } = await supabase.from('options').select('id, question_id').eq('is_correct', true).in('question_id', quiz!.questions.map(q => q.id));
    if (error) { setError("Error al verificar respuestas."); setSubmitting(false); return; }
    
    let score = 0;
    for (const question of quiz!.questions) {
      const correctOptions = correctAnswersData.filter(a => a.question_id === question.id).map(a => a.id);
      const userOptions = userAnswers[question.id] || [];
      if (correctOptions.length === userOptions.length && correctOptions.every(id => userOptions.includes(id))) { score++; }
    }
    
    const passed = score >= 3;
    const { data: { user } } = await supabase.auth.getUser();

    // Guardar intento de quiz
    await supabase.from('quiz_attempts').insert({ user_id: user?.id, quiz_id: quizId, score, passed });

    // Si aprobó, marcamos la lección como completada
    if (passed) {
      const progressData = { 
        user_id: user?.id, 
        lesson_id: quiz!.lesson_id, 
        is_completed: true, 
        completed_at: new Date().toISOString() 
      };

      // Log para ver qué estamos mandando
      console.log("Intentando guardar en lesson_progress:", progressData);

      const { error: progressError } = await supabase.from('lesson_progress').upsert(progressData);

      if (progressError) {
        console.error("¡ERROR AL GUARDAR EL PROGRESO!", progressError);
        setError(`Error al guardar el progreso: ${progressError.message}`);
      }
    }

    setFinalScore({ score, total: quiz!.questions.length, passed });
    setShowResultModal(true);
    setSubmitting(false);
  };

  const handleCloseResultModal = () => {
    // ... (función sin cambios)
    setShowResultModal(false);
    router.push(`/cursos/${courseId}?updated_at=${new Date().getTime()}`);
  };
  
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><p>Cargando Quiz...</p></div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500"><p>{error}</p></div>;

  return (
    <>
      <QuizResultModal isOpen={showResultModal} onClose={handleCloseResultModal} passed={finalScore.passed} score={finalScore.score} totalQuestions={finalScore.total} />
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-3xl mx-auto">
          {/* ... (resto del JSX sin cambios) ... */}
          <h1 className="text-4xl font-bold text-center mb-2">{quiz?.title}</h1>
          <p className="text-gray-400 text-center mb-10">Seleccioná la respuesta correcta para cada pregunta. ¡Mucha suerte!</p>
          <div className="space-y-8">
            {quiz?.questions.sort((a, b) => a.order - b.order).map((q, qIndex) => (
              <div key={q.id} className="bg-[#151515] p-6 rounded-lg border border-gray-800">
                <p className="font-bold text-lg mb-4">{qIndex + 1}. {q.question_text}</p>
                <div className="space-y-3">
                  {q.options.map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 p-3 rounded-md bg-gray-800 hover:bg-gray-700 cursor-pointer">
                      <input type={q.question_type === 'single' ? 'radio' : 'checkbox'} name={`question-${q.id}`} checked={(userAnswers[q.id] || []).includes(opt.id)}
                        onChange={() => handleAnswerChange(q.id, opt.id, q.question_type)}
                        className={`h-5 w-5 text-[#FF4500] bg-gray-700 border-gray-600 focus:ring-[#FF4500] ${q.question_type === 'single' ? 'rounded-full' : 'rounded'}`} />
                      <span>{opt.option_text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <button onClick={handleSubmit} disabled={submitting || Object.keys(userAnswers).length === 0}
              className="w-full max-w-md bg-[#FF4500] text-white font-bold py-3 text-lg rounded-lg hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed">
              {submitting ? "Corrigiendo..." : "Finalizar Quiz"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}