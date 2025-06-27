// Ruta: app/cursos/[courseId]/examen/[examId]/revision/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../../../lib/supabase/client';
import { useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';

// --- Tipos ---
type ExamDetails = { id: string; title: string; questions: Question[]; };
type Question = { id: string; question_text: string; order: number; options: Option[]; };
type Option = { id: string; option_text: string; is_correct: boolean; };
type UserAnswers = { [questionId: string]: string[]; };

export default function ExamRevisionPage({ params }: { params: { courseId: string; examId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { courseId, examId } = params;

  // --- Estados ---
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Carga de datos ---
  const fetchExamForReview = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data, error: examError } = await supabase
      .from('final_exams')
      .select('id, title, questions (id, question_text, order, options ( id, option_text, is_correct ))')
      .eq('id', examId)
      .single();

    if (examError || !data) { setError("No se pudo cargar la revisión del examen."); setLoading(false); return notFound(); }
    
    const { data: attemptsData, error: attemptError } = await supabase
        .from('final_exam_attempts')
        .select('answers')
        .eq('user_id', user.id)
        .eq('final_exam_id', examId)
        .order('submitted_at', { ascending: false });

    if (attemptError || !attemptsData || attemptsData.length === 0) {
        setError("No se encontró un intento guardado para este examen.");
    } else {
        setUserAnswers(attemptsData[0].answers || {});
    }

    data.questions.sort((a, b) => a.order - b.order);
    setExam(data);
    setLoading(false);
  }, [examId, supabase, router]);

  useEffect(() => {
    fetchExamForReview();
  }, [fetchExamForReview]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><p>Cargando revisión...</p></div>;
  
  if (error) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center p-4">
        <p className="text-red-500 mb-6">{error}</p>
        <Link href={`/cursos/${courseId}`} className="bg-[#FF4500] text-white py-2 px-4 rounded-lg">
             <ArrowLeft className="inline -mt-1 mr-2" size={16}/> Volver al curso
        </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
            <Link href={`/cursos/${courseId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit">
                <ArrowLeft size={18} /> Volver al temario del curso
            </Link>
        </header>

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Revisión: {exam?.title}</h1>
        <p className="text-gray-400 text-center mb-10">Aquí puedes ver tus respuestas y las soluciones correctas.</p>
        
        <div className="space-y-8">
          {exam?.questions.map((q, qIndex) => (
            <div key={q.id} className="bg-[#151515] p-6 rounded-lg border border-gray-800">
              <p className="font-bold text-lg mb-4">{qIndex + 1}. {q.question_text}</p>
              <div className="space-y-3">
                {q.options.map(opt => {
                  const isCorrect = opt.is_correct;
                  const userAnswered = (userAnswers[q.id] || []).includes(opt.id);

                  let bgColor = 'bg-gray-800';
                  let borderColor = 'border-gray-700';
                  let textColor = 'text-gray-300';
                  let Icon = null;

                  if (isCorrect) {
                      bgColor = 'bg-green-500/10';
                      borderColor = 'border-green-500/30';
                      textColor = 'text-green-300 font-semibold';
                      Icon = <Check size={20} className="text-green-500 flex-shrink-0" />;
                  }
                  
                  if (userAnswered && !isCorrect) {
                      bgColor = 'bg-red-500/10';
                      borderColor = 'border-red-500/30';
                      textColor = 'text-red-300';
                      Icon = <X size={20} className="text-red-500 flex-shrink-0" />;
                  }

                  return (
                    <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-md border ${bgColor} ${borderColor} ${textColor} transition-colors`}>
                      {Icon ? Icon : <div className="w-5 h-5 flex-shrink-0" />}
                      <span className="flex-grow">{opt.option_text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}