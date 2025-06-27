// Ruta: app/cursos/[courseId]/examen/[examId]/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import QuizResultModal from '../../../../../components/cursos/QuizResultModal';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

// --- Tipos ---
type ExamDetails = { id: string; title: string; questions: Question[]; };
type Question = { id: string; question_text: string; question_type: 'single' | 'multiple'; order: number; options: Option[]; };
type Option = { id: string; option_text: string; };
type UserAnswers = { [questionId: string]: string[]; };

type ResultState = {
  score: number;
  total: number;
  passed: boolean;
  certificateUrl?: string;
  isGeneratingCert: boolean;
  attemptsLeft: number;
};

export default function FinalExamPage({ params }: { params: { courseId: string, examId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId, examId } = params;

  // --- Estados ---
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canAttempt, setCanAttempt] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(2);

  const [showResultModal, setShowResultModal] = useState(false);
  const [finalScore, setFinalScore] = useState<ResultState>({ score: 0, total: 0, passed: false, isGeneratingCert: false, attemptsLeft: 2 });

  // --- Carga de datos y verificación de acceso ---
  const fetchExamData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: progress } = await supabase.from('course_progress')
        .select('status, exam_attempts')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

    const currentAttempts = progress?.exam_attempts || 0;
    const currentStatus = progress?.status || 'in_progress';
    const remaining = 2 - currentAttempts;
    setAttemptsLeft(remaining);
    
    if (currentStatus === 'completed' || currentStatus === 'failed' || remaining <= 0) {
        setCanAttempt(false);
        setError("Ya no puedes rendir este examen.");
        setLoading(false);
        return;
    }
    
    setCanAttempt(true);

    const { data, error: examError } = await supabase.from('final_exams').select(`*, questions(*, options(*))`).eq('id', examId).single();
    
    if (examError || !data) {
        setError("No se pudo cargar el examen.");
        setLoading(false);
        return;
    }
    setExam(data);
    setLoading(false);
  }, [examId, courseId, router, supabase]);

  useEffect(() => { fetchExamData(); }, [fetchExamData]);
  
  const handleAnswerChange = (questionId: string, optionId: string, questionType: 'single' | 'multiple') => {
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
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !exam) { setSubmitting(false); return; }

    const { data: correctAnswersData, error: answersError } = await supabase.from('options').select('id, question_id').eq('is_correct', true).in('question_id', exam.questions.map(q => q.id));
    if (answersError) { setError("Error al verificar respuestas."); setSubmitting(false); return; }
    
    let score = 0;
    for (const question of exam.questions) {
      const correctOptions = correctAnswersData.filter(a => a.question_id === question.id).map(a => a.id);
      const userOptions = userAnswers[question.id] || [];
      const isCorrect = correctOptions.length === userOptions.length && correctOptions.every(id => userOptions.includes(id));
      if (isCorrect) { score++; }
    }
    
    const passed = score >= (exam.questions.length * 0.7);
    
    const { data: currentProgress } = await supabase
        .from('course_progress')
        .select('exam_attempts')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

    const newAttempts = (currentProgress?.exam_attempts || 0) + 1;
    const finalStatus = passed ? 'completed' : (newAttempts >= 2 ? 'failed' : 'in_progress');

    // **AQUÍ LA CORRECCIÓN DEFINITIVA: Usamos UPSERT**
    const { data: updatedProgress, error: progressError } = await supabase
        .from('course_progress')
        .upsert({
            user_id: user.id,
            course_id: courseId,
            status: finalStatus,
            exam_attempts: newAttempts,
            final_score: score,
            completed_at: new Date().toISOString()
        }, { 
            onConflict: 'user_id, course_id' // Le indicamos cómo encontrar un conflicto
        })
        .select('id')
        .single();

    if (progressError || !updatedProgress) {
        setError(`Error al guardar tu progreso: ${progressError?.message || 'No se pudo obtener el ID del progreso.'}`);
        setSubmitting(false);
        return;
    }

    const { error: attemptError } = await supabase.from('final_exam_attempts').insert({
        user_id: user.id,
        final_exam_id: examId,
        course_progress_id: updatedProgress.id,
        answers: userAnswers,
        score: score,
        passed: passed
    });

    if (attemptError) { setError('Error al guardar el detalle del intento.'); setSubmitting(false); return; }

    setFinalScore({ score, total: exam.questions.length, passed, isGeneratingCert: passed, attemptsLeft: 2 - newAttempts });
    setShowResultModal(true); 

    if (passed) {
      try {
        const { data, error: funcError } = await supabase.functions.invoke('generate-certificate', { body: { userId: user.id, courseId: courseId } });
        if (funcError) throw funcError;
        setFinalScore(prev => ({ ...prev, certificateUrl: data.pdf_url, isGeneratingCert: false }));
      } catch (err: any) {
        setFinalScore(prev => ({ ...prev, isGeneratingCert: false }));
      }
    }
    setSubmitting(false);
  };
  
  const handleCloseResultModal = () => {
    setShowResultModal(false);
    if(finalScore.passed || finalScore.attemptsLeft <= 0) {
        router.push(`/cursos/${courseId}`);
    } else {
        setUserAnswers({});
        fetchExamData();
    }
    router.refresh();
  };
  
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><p>Cargando Examen Final...</p></div>;
  
  if (error) return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center p-4">
          <ShieldAlert size={60} className="text-red-500 mb-4"/>
          <h1 className="text-2xl font-bold mb-2">Acceso denegado</h1>
          <p className="text-gray-400 mb-6">{error || "No es posible rendir este examen."}</p>
          <Link href={`/cursos/${courseId}`} className="bg-[#FF4500] text-white py-2 px-4 rounded-lg">
             <ArrowLeft className="inline -mt-1 mr-2" size={16}/> Volver al curso
          </Link>
      </div>
  );
  
  if (!canAttempt) return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center p-4">
          <ShieldAlert size={60} className="text-red-500 mb-4"/>
          <h1 className="text-2xl font-bold mb-2">Acceso denegado</h1>
          <p className="text-gray-400 mb-6">Ya no puedes rendir este examen.</p>
          <Link href={`/cursos/${courseId}`} className="bg-[#FF4500] text-white py-2 px-4 rounded-lg">
             <ArrowLeft className="inline -mt-1 mr-2" size={16}/> Volver al curso
          </Link>
      </div>
  )

  return (
    <>
      <QuizResultModal isOpen={showResultModal} onClose={handleCloseResultModal} passed={finalScore.passed} score={finalScore.score} totalQuestions={finalScore.total} certificateUrl={finalScore.certificateUrl} isGeneratingCert={finalScore.isGeneratingCert} isFinalExam={true} attemptsLeft={finalScore.attemptsLeft} />
      
      <div className="min-h-screen bg-black text-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">{exam?.title}</h1>
          <p className="text-gray-400 text-center mb-4">Respondé a las siguientes preguntas para finalizar el curso.</p>
          <p className="text-center font-bold text-amber-400 border border-amber-500/50 bg-amber-900/30 rounded-lg py-2 mb-10">Intento restante: {attemptsLeft}</p>
          
          <div className="space-y-8">
            {exam?.questions.sort((a,b) => a.order - b.order).map((q, qIndex) => (
              <div key={q.id} className="bg-[#151515] p-6 rounded-lg border border-gray-800">
                <p className="font-bold text-lg mb-4">{qIndex + 1}. {q.question_text}</p>
                <div className="space-y-3">
                  {q.options.map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 p-3 rounded-md bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors">
                      <input 
                        type={q.question_type === 'single' ? 'radio' : 'checkbox'} 
                        name={`question-${q.id}`} 
                        checked={(userAnswers[q.id] || []).includes(opt.id)} 
                        onChange={() => handleAnswerChange(q.id, opt.id, q.question_type)} 
                        className={`h-5 w-5 text-[#FF4500] bg-gray-700 border-gray-600 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#FF4500] ${q.question_type === 'single' ? 'rounded-full' : 'rounded'}`}/>
                      <span>{opt.option_text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="w-full max-w-md bg-amber-500 text-white font-bold py-3 text-lg rounded-lg hover:bg-amber-600 disabled:bg-gray-600 transition-colors"
            >
              {submitting ? "Corrigiendo..." : "Finalizar Examen"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}