// Ruta: components/cursos/CourseCard.tsx

'use client';

import Link from 'next/link';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';

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
  const isFailed = course.status === 'failed';
  const isFinished = course.availability === 'FINISHED';
  const isUpcoming = course.availability === 'UPCOMING';

  let badge = null;
  if(isFinished) {
    badge = <span className="absolute top-4 right-4 text-xs font-bold bg-gray-700 text-gray-300 py-1 px-3 rounded-full">Finalizado</span>;
  } else if (isUpcoming && course.start_date) {
    const startDate = new Date(course.start_date);
    badge = <span className="absolute top-4 right-4 text-xs font-bold bg-blue-900/80 text-blue-300 py-1 px-3 rounded-full">Inicia: {startDate.toLocaleDateString('es-AR', { timeZone: 'UTC' })}</span>;
  }
  
  let borderColor = 'border-gray-800';
  if (isCompleted) borderColor = 'border-green-500/50';
  if (isFailed) borderColor = 'border-red-500/50';

  let icon = <BookOpen size={28} className="text-gray-500" />;
  if (isCompleted) icon = <BookOpen size={28} className="text-green-400" />;
  if (isFailed) icon = <XCircle size={28} className="text-red-400" />;

  // Creamos el contenido de la tarjeta como una variable para no repetirlo
  const cardContent = (
    <div className={`relative group h-full bg-[#151515] rounded-xl p-6 transition-all ease-in-out flex flex-col border ${borderColor}
        ${isUpcoming ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] hover:border-[#FF4500]/30 cursor-pointer'}
    `}>
      {badge}
      
      {isCompleted && (
        <div className="absolute top-4 left-4 bg-green-500 text-black rounded-full p-1"><CheckCircle size={20} /></div>
      )}
      {isFailed && (
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
  );

  // --- RENDERIZADO CONDICIONAL CORREGIDO ---
  // Si el curso está por venir, lo renderizamos dentro de un <div>.
  // Si no, lo renderizamos dentro de un <Link> para que sea clickeable.
  return isUpcoming ? (
    <div>{cardContent}</div>
  ) : (
    <Link href={`/dashboard/cursos/${course.id}`}>
      {cardContent}
    </Link>
  );
};