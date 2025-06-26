// Ruta: components/admin/EditContentModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Tipos
type Content = {
  id: string;
  content_type: 'video' | 'pdf';
  title: string;
  url: string;
};

type EditContentModalProps = {
  content: Content | null;
  isOpen: boolean;
  onClose: () => void;
  onContentUpdated: (updatedContent: Content) => void;
};

export default function EditContentModal({ content, isOpen, onClose, onContentUpdated }: EditContentModalProps) {
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cuando el modal se abre, cargamos los datos del contenido a editar
    if (content) {
      setTitle(content.title);
      setUrl(content.url);
    }
  }, [content]);

  if (!isOpen || !content) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data: updatedContent, error: updateError } = await supabase
      .from('contents')
      .update({ title, url })
      .eq('id', content.id)
      .select()
      .single();

    if (updateError) {
      setError(`Error al actualizar: ${updateError.message}`);
      setSaving(false);
      return;
    }

    onContentUpdated(updatedContent);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] text-white rounded-xl border border-gray-700 p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">Editar Contenido</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Título del Contenido</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md" required />
          </div>
          {/* Solo mostramos la URL para videos, ya que cambiar el PDF es más complejo */}
          {content.content_type === 'video' && (
             <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">URL del Video</label>
                <input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md" required />
             </div>
          )}
           {content.content_type === 'pdf' && (
             <p className="text-sm text-gray-400">La edición del archivo PDF no está disponible. Para cambiarlo, eliminá este contenido y creá uno nuevo.</p>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} disabled={saving} className="py-2 px-4 bg-gray-600 rounded-lg hover:bg-gray-500">Cancelar</button>
            <button type="submit" disabled={saving || content.content_type === 'pdf'}
              className="py-2 px-4 bg-[#FF4500] rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}