// Ruta: app/admin/cursos/nuevo/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save } from 'lucide-react';

type Sector = {
  id: string;
  name: string;
};

type AdminProfile = {
  role_id: number;
  sector_id: string | null;
  sectors: { name: string } | null;
};

export default function NewCoursePage() {
  const router = useRouter();
  const supabase = createClient();

  // Estados del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Estados de la página
  const [allSectors, setAllSectors] = useState<Sector[]>([]);
  const [userProfile, setUserProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`role_id, sector_id, sectors (name)`)
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        setError("No se pudo cargar tu perfil de administrador.");
        setLoading(false);
        return;
      }
      setUserProfile(profile as AdminProfile);

      if (profile.role_id === 1) {
        const { data: sectorsData, error: sectorsError } = await supabase.from('sectors').select('id, name');
        if (sectorsError) {
          setError("No se pudieron cargar los sectores.");
        } else {
          setAllSectors(sectorsData || []);
        }
      }
      setLoading(false);
    };
    fetchInitialData();
  }, [supabase, router]);

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !userProfile) {
      setError("No estás autenticado.");
      setLoading(false);
      return;
    }

    const finalSectorId = userProfile.role_id === 1 ? sectorId : userProfile.sector_id;

    if (!title || !finalSectorId) {
      setError("El título y el sector son obligatorios.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('courses').insert({
      title,
      description,
      sector_id: finalSectorId,
      is_published: isPublished,
      creator_id: user.id,
      start_date: startDate || null,
      end_date: endDate || null,
    });

    if (insertError) {
      console.error("Error al guardar el curso:", insertError);
      setError("No se pudo guardar el curso. " + insertError.message);
      setLoading(false);
    } else {
      router.push('/admin/cursos');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-white flex items-center justify-center">
        <p>Cargando formulario...</p>
      </div>
    );
  }
  
  return (
    <div className="text-gray-200 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-4">
            <h1 className="text-3xl font-bold text-white">Crear Nuevo Curso</h1>
        </header>

        <form onSubmit={handleSaveCourse} className="bg-[#151515] rounded-xl border border-gray-800 p-8 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Título del Curso</label>
            <input
              id="title" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500]"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
            <textarea
              id="description" value={description} onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500]"
            />
          </div>

          {userProfile?.role_id === 1 ? (
            <div>
              <label htmlFor="sector" className="block text-sm font-medium text-gray-300 mb-2">Sector</label>
              <select
                id="sector" value={sectorId} onChange={(e) => setSectorId(e.target.value)}
                className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500]"
                required
              >
                <option value="" disabled>Selecciona un sector...</option>
                {allSectors.map(sector => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sector</label>
                <div className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-700 rounded-md text-gray-400">
                    {userProfile?.sectors?.name || 'Sector no asignado'}
                </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">Fecha de Inicio (Opcional)</label>
              <input
                id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500] text-gray-300"
              />
            </div>
             <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">Fecha de Fin (Opcional)</label>
              <input
                id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500] text-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
             <label htmlFor="isPublished" className="block text-sm font-medium text-gray-300">¿Publicar ahora?</label>
             <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`${isPublished ? 'bg-[#FF4500]' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span className={`${isPublished ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
            </button>
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <div className="flex justify-end pt-4 border-t border-gray-800 mt-2">
             <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#FF4500] text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 disabled:bg-gray-500 transition-colors"
            >
              <Save size={20} />
              {loading ? 'Guardando...' : 'Guardar Curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}