// Ruta: components/cursos/CourseCard.tsx

'use client';

import Link from 'next/link';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react'; // Importamos XCircle

// --- Tipos ---
type CourseAvailability = 'ACTIVE' | 'UPCOMING' | 'FINISHED';

export type CourseCardType = {
  id: string; 
  title: string;
  description: string | null;
  status?: 'completed' | 'failed' | 'in_progress';
  start_date: string | null;
  end_date: string | null;
  availability: CourseAvailability;
};

// --- Componente ---
export default function CourseCard({ course }: { course: CourseCardType }) {
  const isCompleted = course.status === 'completed';
  const isFailed = course.status === 'failed'; // Añadimos una variable para el estado 'failed'
  const isFinished = course.availability === 'FINISHED';
  const isUpcoming = course.availability === 'UPCOMING';

  let badge = null;
  if(isFinished) {
    badge = <span className="absolute top-4 right-4 text-xs font-bold bg-gray-700 text-gray-300 py-1 px-3 rounded-full">Finalizado</span>;
  } else if (isUpcoming && course.start_date) {
    const startDate = new Date(course.start_date);
    startDate.setDate(startDate.getDate() + 1);
    badge = <span className="absolute top-4 right-4 text-xs font-bold bg-blue-900/80 text-blue-300 py-1 px-3 rounded-full">Inicia: {startDate.toLocaleDateString('es-AR')}</span>;
  }
  
  const Wrapper = isUpcoming ? 'div' : Link;
  const linkProps = isUpcoming ? {} : { href: `/dashboard/cursos/${course.id}` };

  // --- LÓGICA DE ESTILOS CORREGIDA ---
  let borderColor = 'border-gray-800';
  if (isCompleted) borderColor = 'border-green-500/50';
  if (isFailed) borderColor = 'border-red-500/50';

  let icon = <BookOpen size={28} className="text-gray-500" />;
  if (isCompleted) icon = <BookOpen size={28} className="text-green-400" />;
  if (isFailed) icon = <XCircle size={28} className="text-red-400" />; // Usamos el ícono XCircle para desaprobado

  return (
    <Wrapper {...linkProps}>
      <div className={`relative group h-full bg-[#151515] rounded-xl p-6 transition-all ease-in-out flex flex-col border ${borderColor}
          ${(isFinished || isUpcoming) ? 'opacity-70 hover:opacity-100' : 'hover:scale-[1.02] hover:border-[#FF4500]/30'}
          ${isUpcoming ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}>
        {badge}
        
        {/* Mostramos un ícono de estado si está completado o fallado */}
        {isCompleted && !isFinished && !isUpcoming && (
          <div className="absolute top-4 left-4 bg-green-500 text-black rounded-full p-1"><CheckCircle size={20} /></div>
        )}
        {isFailed && !isFinished && !isUpcoming && (
          <div className="absolute top-4 left-4 bg-red-800 text-white rounded-full p-1"><XCircle size={20} /></div>
        )}

        <div className="w-14 h-14 rounded-lg flex items-center justify-center my-5 bg-gray-800/50 transition-colors">
            {icon}
        </div>
        <h4 className="text-lg font-bold text-white mb-2">{course.title}</h4>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">{course.description}</p>
        <span className="text-[#FF4500] font-semibold text-sm self-start mt-auto">
          {isFinished ? 'Ver contenido' : isUpcoming ? 'Curso no disponible' : 'Continuar curso →'}
        </span>
      </div>
    </Wrapper>
  );
};