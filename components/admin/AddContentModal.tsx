// Ruta: components/admin/AddContentModal.tsx

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload } from 'lucide-react';
import { Content } from '@/types'; // Importamos el tipo centralizado

type AddContentModalProps = {
  lessonId: string;
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onContentAdded: (newContent: Content) => void; // Usamos el tipo 'Content'
};

export default function AddContentModal({ lessonId, courseId, isOpen, onClose, onContentAdded }: AddContentModalProps) {
  const supabase = createClient();

  const [contentType, setContentType] = useState<'video' | 'pdf'>('video');
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setTitle('');
    setVideoUrl('');
    setPdfFile(null);
    setError(null);
    setIsUploading(false);
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lessonId) {
        setError("Error: No se ha proporcionado un ID de lección válido.");
        return;
    }

    setIsUploading(true);
    setError(null);

    let contentUrl = videoUrl;

    if (contentType === 'pdf') {
      if (!pdfFile) {
        setError('Por favor, selecciona un archivo PDF.');
        setIsUploading(false);
        return;
      }
      const filePath = `courses/${courseId}/${lessonId}/${Date.now()}-${pdfFile.name}`;
      const { error: uploadError } = await supabase.storage.from('course-materials').upload(filePath, pdfFile);
      
      if (uploadError) {
        setError(`Error al subir el PDF: ${uploadError.message}`);
        setIsUploading(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('course-materials').getPublicUrl(filePath);
      contentUrl = urlData.publicUrl;
    }

    const contentToInsert = {
      lesson_id: lessonId,
      content_type: contentType,
      title: title,
      url: contentUrl,
    };
    
    const { data: newContent, error: insertError } = await supabase
      .from('contents')
      .insert(contentToInsert)
      .select()
      .single();

    if (insertError) {
      setError(`Error al guardar en la base de datos: ${insertError.message}`);
      setIsUploading(false);
      return;
    }

    onContentAdded(newContent);
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] text-white rounded-xl border border-gray-700 p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">Agregar Nuevo Contenido</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4">
            <button type="button" onClick={() => setContentType('video')}
              className={`flex-1 py-2 rounded-md transition-colors ${contentType === 'video' ? 'bg-[#FF4500] text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>
              Video
            </button>
            <button type="button" onClick={() => setContentType('pdf')}
              className={`flex-1 py-2 rounded-md transition-colors ${contentType === 'pdf' ? 'bg-[#FF4500] text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>
              PDF
            </button>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Título del Contenido</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md" required />
          </div>
          {contentType === 'video' ? (
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-300 mb-2">URL del Video (YouTube, Vimeo, etc.)</label>
              <input id="videoUrl" type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md" placeholder="https://..." required />
            </div>
          ) : (
            <div>
              <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-300 mb-2">Subir Archivo PDF</label>
              <label htmlFor="pdfFile" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0D0D0D] border-2 border-dashed border-gray-600 rounded-md cursor-pointer hover:border-gray-500">
                <Upload size={18} />
                <span>{pdfFile ? pdfFile.name : 'Seleccionar archivo...'}</span>
              </label>
              <input id="pdfFile" type="file" onChange={handleFileChange} accept=".pdf" className="hidden" required />
            </div>
          )}
          {error && <p className="text-red-400 text-sm bg-red-900/50 p-3 rounded-md">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={handleClose} disabled={isUploading}
              className="py-2 px-4 bg-gray-600 rounded-lg hover:bg-gray-500 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isUploading}
              className="py-2 px-4 bg-[#FF4500] rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {isUploading ? 'Guardando...' : 'Guardar Contenido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}