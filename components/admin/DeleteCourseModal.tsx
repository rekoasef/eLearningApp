// Ruta: components/admin/DeleteCourseModal.tsx
'use client';
import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courseTitle: string;
  isDeleting: boolean;
}

const CONFIRMATION_TEXT = 'CONFIRMAR';

export default function DeleteCourseModal({ isOpen, onClose, onConfirm, courseTitle, isDeleting }: DeleteCourseModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  if (!isOpen) return null;
  
  const isConfirmationMatch = confirmationInput === CONFIRMATION_TEXT;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] text-white rounded-xl border-2 border-red-500/50 p-8 w-full max-w-lg text-center">
        <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">¿Estás absolutamente seguro?</h2>
        <p className="text-gray-400 mb-4">
          Esta acción es irreversible. Se eliminará permanentemente el curso <strong className="text-white">{`"${courseTitle}"`}</strong>, incluyendo todos sus módulos, contenidos, quizzes, y el progreso de todos los usuarios.
        </p>
        <div className="my-6 text-left">
          <label htmlFor="confirmation" className="text-sm font-bold text-gray-300">
            Para confirmar, por favor escribe <strong className="text-red-400">{CONFIRMATION_TEXT}</strong> en el campo de abajo:
          </label>
          <input 
            id="confirmation" 
            type="text" 
            value={confirmationInput} 
            onChange={(e) => setConfirmationInput(e.target.value)} 
            className="mt-2 w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex justify-end items-center gap-4">
          <button onClick={onClose} className="py-2 px-4 text-gray-300 font-medium rounded-lg hover:bg-gray-700">Cancelar</button>
          <button 
            onClick={onConfirm} 
            disabled={!isConfirmationMatch || isDeleting} 
            className="flex items-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={18} />
            {isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
          </button>
        </div>
      </div>
    </div>
  );
}