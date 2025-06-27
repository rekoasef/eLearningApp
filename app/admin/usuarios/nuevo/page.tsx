// Ruta: app/admin/usuarios/nuevo/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Save, UserPlus, Eye, EyeOff } from 'lucide-react';

// Tipos
type AdminProfile = {
    role_id: number;
    sector_id: string | null;
};
type Sector = {
    id: string;
    name: string;
};

export default function NewUserPage() {
    const router = useRouter();
    const supabase = createClient();

    // Estados del Formulario
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState('3');
    const [selectedSectorId, setSelectedSectorId] = useState('');

    // Estados de la Página
    const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
    const [allSectors, setAllSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const isSuperAdmin = adminProfile?.role_id === 1;

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data: profile } = await supabase.from('profiles').select('role_id, sector_id').eq('id', user.id).single();
            if (!profile) {
                setError("No se pudo cargar tu perfil de administrador.");
                setLoading(false);
                return;
            }
            setAdminProfile(profile);

            if (profile.role_id === 1) {
                const { data: sectorsData, error: sectorsError } = await supabase.from('sectors').select('id, name');
                if (sectorsError) { setError("No se pudieron cargar los sectores."); } 
                else { setAllSectors(sectorsData || []); }
            }
            setLoading(false);
        };
        fetchInitialData();
    }, [supabase, router]);
    
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const finalRoleId = parseInt(selectedRoleId);
        const finalSectorId = isSuperAdmin ? selectedSectorId : adminProfile?.sector_id;

        if (!finalSectorId) {
            setError("Error: El sector no está definido.");
            setLoading(false);
            return;
        }

        const payload = {
            email,
            password,
            sector_id: finalSectorId,
            role_id: finalRoleId,
            full_name: fullName
        };

        try {
            const { error: functionError } = await supabase.functions.invoke('create-user', { body: payload });

            if (functionError) {
                const errorContext = functionError.context || {};
                if (typeof errorContext.json === 'function') {
                    const errorJson = await errorContext.json();
                    throw new Error(errorJson.error || "Ocurrió un error en la función.");
                }
                throw functionError;
            }
            
            setSuccess(`¡Usuario ${email} creado con éxito!`);
            setFullName('');
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = isSuperAdmin ? selectedSectorId : adminProfile?.sector_id;

    return (
        <div className="text-gray-200 p-8">
            <div className="max-w-2xl mx-auto">
                <header className="mb-4">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3"><UserPlus /> Crear Nuevo Usuario</h1>
                </header>
                <form onSubmit={handleCreateUser} className="bg-[#151515] rounded-xl border border-gray-800 p-8 space-y-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Nombre y Apellido</label>
                        <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500]" required/>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Correo Electrónico</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500]" required/>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Contraseña Temporal</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder='Mínimo 6 caracteres'
                                className="w-full px-4 py-2 pr-10 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500]"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    
                    {isSuperAdmin && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-700">
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">Asignar Rol</label>
                                <select id="role" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500]">
                                    <option value="3">Usuario Técnico</option>
                                    <option value="2">Administrador de Sector</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="sector" className="block text-sm font-medium text-gray-300 mb-2">Asignar Sector</label>
                                <select id="sector" value={selectedSectorId} onChange={(e) => setSelectedSectorId(e.target.value)} className="w-full px-4 py-2 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500]" required>
                                    <option value="" disabled>Selecciona un sector...</option>
                                    {allSectors.map(sector => (
                                        <option key={sector.id} value={sector.id}>{sector.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    
                    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm">{error}</p>}
                    {success && <p className="text-green-400 bg-green-900/50 p-3 rounded-md text-sm">{success}</p>}

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={loading || !canSubmit} className="flex items-center gap-2 bg-[#FF4500] text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">
                            <Save size={20} />{loading ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}