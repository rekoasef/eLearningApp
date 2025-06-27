// Ruta: app/admin/progreso/page.tsx

'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Users, ChevronRight, UserPlus, Filter } from 'lucide-react';

// --- Tipos ---
type TeamProgress = {
    user_id: string;
    user_full_name: string;
    user_email: string;
    course_id: string;
    course_title: string;
    status: 'in_progress' | 'completed' | 'failed' | null;
    completed_at: string | null;
    sector_name: string | null;
};

type Sector = {
    id: string;
    name: string;
};

const getStatusBadge = (status: TeamProgress['status']) => {
    const currentStatus = status || 'in_progress';
    switch (currentStatus) {
        case 'completed':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">Aprobado</span>;
        case 'failed':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">Desaprobado</span>;
        default:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400">En Progreso</span>;
    }
};

export default function TeamProgressPage() {
    const supabase = createClient();
    const [teamProgress, setTeamProgress] = useState<TeamProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Estados para el Superadministrador ---
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [selectedSector, setSelectedSector] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role_id').eq('id', user.id).single();
                if (profile?.role_id === 1) {
                    setIsSuperAdmin(true);
                    const { data: sectorsData } = await supabase.rpc('get_all_sectors');
                    if (sectorsData) setSectors(sectorsData);
                }
            }

            const { data, error: rpcError } = await supabase.rpc('get_team_progress');
            if (rpcError) {
                console.error("Error al llamar a la función RPC:", rpcError);
                setError("No se pudo cargar el progreso. Asegúrate de tener un rol de administrador.");
            } else {
                setTeamProgress(data || []);
            }
            setLoading(false);
        };
        fetchData();
    }, [supabase]);

    const filteredProgress = useMemo(() => {
        if (!isSuperAdmin || selectedSector === 'all') {
            return teamProgress;
        }
        return teamProgress.filter(p => p.sector_name === selectedSector);
    }, [teamProgress, selectedSector, isSuperAdmin]);


    if (loading) return <div className="p-8 text-center text-white">Cargando progreso del equipo...</div>;

    return (
        <div className="text-gray-200 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Users /> Progreso del Equipo</h1>
                    <div className="flex items-center gap-4">
                        {isSuperAdmin && (
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-gray-400" />
                                <select
                                    value={selectedSector}
                                    onChange={(e) => setSelectedSector(e.target.value)}
                                    className="bg-[#1A1A1A] border border-gray-700 rounded-md px-3 py-1.5 text-white focus:ring-2 focus:ring-[#FF4500]"
                                >
                                    <option value="all">Todos los Sectores</option>
                                    {sectors.map(sector => (
                                        <option key={sector.id} value={sector.name}>{sector.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <Link href="/admin/usuarios/nuevo" className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            <UserPlus size={20} /> Nuevo Usuario
                        </Link>
                    </div>
                </div>

                {error ? (
                     <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg text-center"><p>{error}</p></div>
                ) : filteredProgress.length > 0 ? (
                    <div className="bg-[#151515] rounded-xl border border-gray-800 overflow-x-auto">
                        <table className="w-full text-left min-w-[720px]">
                            <thead className="bg-gray-800/50">
                                <tr>
                                    <th className="p-4">Usuario</th>
                                    {isSuperAdmin && <th className="p-4">Sector</th>}
                                    <th className="p-4">Curso</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4">Fecha de Finalización</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProgress.map((progress) => (
                                    <tr className="border-b border-gray-800 hover:bg-[#1A1A1A]" key={`${progress.user_id}-${progress.course_id}`}>
                                        <td className="p-4 font-medium text-white">
                                            <Link href={`/admin/progreso/${progress.user_id}`} className="hover:text-[#FF4500] transition-colors group">
                                                {progress.user_full_name || progress.user_email}
                                                <ChevronRight size={16} className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        </td>
                                        {isSuperAdmin && <td className="p-4 text-gray-400">{progress.sector_name || 'Sin sector'}</td>}
                                        <td className="p-4 text-gray-300">{progress.course_title || 'N/A'}</td>
                                        <td className="p-4">{getStatusBadge(progress.status)}</td>
                                        <td className="p-4 text-gray-400">{progress.completed_at ? new Date(progress.completed_at).toLocaleDateString('es-AR') : '---'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-[#151515] rounded-xl border border-dashed border-gray-700 p-12 text-center">
                        <p className="text-gray-400">No se encontraron datos de progreso.</p>
                    </div>
                )}
            </div>
        </div>
    );
}