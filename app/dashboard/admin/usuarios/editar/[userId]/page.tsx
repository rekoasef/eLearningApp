// Ruta: app/dashboard/admin/usuarios/editar/[userId]/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Save, UserCog } from 'lucide-react';

type UserDetails = {
    id: string;
    full_name: string;
    email: string;
    role_id: number;
    sector_id: string;
};
type Sector = { id: string; name: string; };

export default function EditUserPage({ params }: { params: { userId: string } }) {
    const { userId } = params;
    const router = useRouter();
    const supabase = createClient();
    
    // Estados del formulario
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState('3');
    const [selectedSectorId, setSelectedSectorId] = useState('');

    const [allSectors, setAllSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchUserData = useCallback(async () => {
        setLoading(true);
        const { data: userData, error: rpcError } = await supabase.rpc('get_user_details_for_editing', { user_id_in: userId });
        const { data: sectorsData, error: sectorsError } = await supabase.from('sectors').select('id, name');

        if (rpcError || sectorsError || !userData || userData.length === 0) {
            setError("No se pudieron cargar los datos del usuario o los sectores.");
            setLoading(false);
            return;
        }
        
        const user = userData[0];
        setFullName(user.full_name || '');
        setEmail(user.email || '');
        setSelectedRoleId(user.role_id.toString());
        setSelectedSectorId(user.sector_id || '');
        setAllSectors(sectorsData || []);
        setLoading(false);
    }, [userId, supabase]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { error: functionError } = await supabase.functions.invoke('update-user', {
                body: {
                    user_id_to_update: userId,
                    full_name: fullName,
                    role_id: parseInt(selectedRoleId),
                    sector_id: selectedSectorId,
                }
            });

            if (functionError) throw functionError;
            
            setSuccess('¡Usuario actualizado con éxito!');
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Cargando datos del usuario...</div>;

    return (
        <div className="text-gray-200 p-8">
            <div className="max-w-2xl mx-auto">
                <header className="mb-4">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3"><UserCog /> Editar Usuario</h1>
                    <p className="text-gray-400 mt-2">Modificando el perfil de: <strong className='text-white'>{email}</strong></p>
                </header>

                <form onSubmit={handleUpdateUser} className="bg-[#151515] rounded-xl border border-gray-800 p-8 space-y-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Nombre y Apellido</label>
                        <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md" required/>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">Rol</label>
                            <select id="role" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md">
                                <option value="3">Usuario Técnico</option>
                                <option value="2">Administrador de Sector</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sector" className="block text-sm font-medium text-gray-300 mb-2">Sector</label>
                            <select id="sector" value={selectedSectorId} onChange={(e) => setSelectedSectorId(e.target.value)} className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md" required>
                                <option value="" disabled>Selecciona un sector...</option>
                                {allSectors.map(sector => (
                                    <option key={sector.id} value={sector.id}>{sector.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm">{error}</p>}
                    {success && <p className="text-green-400 bg-green-900/50 p-3 rounded-md text-sm">{success}</p>}

                    <div className="flex justify-end pt-4 border-t border-gray-700">
                        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#FF4500] text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50">
                            <Save size={20} />{loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}