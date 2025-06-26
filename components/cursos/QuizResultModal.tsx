// Ruta: components/cursos/QuizResultModal.tsx

'use client';

import { CheckCircle, XCircle, Download, Loader } from 'lucide-react';

type QuizResultModalProps = {
  isOpen: boolean;
  onClose: () => void;
  passed: boolean;
  score: number;
  totalQuestions: number;
  certificateUrl?: string;
  isGeneratingCert?: boolean;
};

export default function QuizResultModal({ isOpen, onClose, passed, score, totalQuestions, certificateUrl, isGeneratingCert }: QuizResultModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className={`bg-[#1A1A1A] text-white rounded-xl border-2 ${passed ? 'border-green-500' : 'border-red-500'} p-8 w-full max-w-md text-center transform transition-all animate-in fade-in-0 zoom-in-95`}>
        {passed ? (
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        ) : (
          <XCircle size={64} className="mx-auto text-red-500 mb-4" />
        )}

        <h2 className="text-3xl font-bold mb-2">{passed ? '¡Felicitaciones!' : '¡A seguir intentando!'}</h2>
        <p className="text-gray-300 text-lg mb-6">
          Tu resultado fue de <span className="font-bold text-white">{score}</span> de <span className="font-bold text-white">{totalQuestions}</span> correctas.
        </p>
        
        {/* Lógica de visualización mejorada para el certificado */}
        {passed && (
          <div className="my-6 h-14 flex items-center justify-center">
            {isGeneratingCert && (
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Loader className="animate-spin" />
                <span>Generando tu certificado...</span>
              </div>
            )}
            {certificateUrl && (
              <a
                href={certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={20} />
                Descargar Certificado
              </a>
            )}
            {/* Si no se está generando y no hay URL, podría ser un error. */}
            {!isGeneratingCert && !certificateUrl && <p className="text-red-500 text-sm">No se pudo generar el certificado.</p>}
          </div>
        )}
        
        <button
          onClick={onClose}
          className="w-full bg-[#FF4500] text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          {passed ? 'Volver al Curso' : 'Intentar de Nuevo'}
        </button>
      </div>
    </div>
  );
}