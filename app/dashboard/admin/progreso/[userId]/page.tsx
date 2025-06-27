// Ruta: app/dashboard/admin/progreso/[userId]/page.tsx

'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import { User, CheckCircle, XCircle, Clock } from 'lucide-react';

// --- Tipos ---
type UserProgressDetails = {
    user_id: string;
    user_full_name: string;
    user_email: string;
    course_id: string;
    course_title: string;
    status: 'in_progress' | 'completed' | 'failed' | null;
    completed_at: string | null;
    final_score: number | null;
};

// --- Componentes ---
const StatCard = ({ label, value, icon, colorClass }: { label: string, value: number, icon: React.ReactNode, colorClass: string }) => (
    <div className={`p-4 rounded-lg flex items-start gap-4 ${colorClass}`}>
        {icon}
        <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm font-medium text-gray-300">{label}</p>
        </div>
    </div>
);

// --- Página Principal ---
export default function UserProgressDetailPage({ params }: { params: { userId: string } }) {
    const supabase = createClient();
    const { userId } = params;
    const [progress, setProgress] = useState<UserProgressDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_user_progress_details', { user_id_in: userId });
            
            if (error) {
                console.error("Error fetching user details:", error);
                setError("No se pudo cargar el progreso del usuario.");
                setLoading(false);
                return;
            }

            if (!data) {
                return notFound();
            }

            setProgress(data);
            setLoading(false);
        };

        fetchDetails();
    }, [userId, supabase]);

    const userDetails = useMemo(() => {
        if (progress.length === 0) return { name: 'Cargando...', email: '' };
        return {
            name: progress[0].user_full_name || 'Usuario sin nombre',
            email: progress[0].user_email
        };
    }, [progress]);
    
    const stats = useMemo(() => {
        const completed = progress.filter(p => p.status === 'completed').length;
        const failed = progress.filter(p => p.status === 'failed').length;
        const inProgress = progress.filter(p => p.status === 'in_progress' || p.status === null).length;
        return { completed, failed, inProgress };
    }, [progress]);

    if (loading) return <div className="p-8 text-center text-white">Cargando detalle...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="text-gray-200 p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{userDetails.name}</h1>
                        <p className="text-gray-400">{userDetails.email}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard label="Aprobados" value={stats.completed} icon={<CheckCircle className="text-green-400" />} colorClass="bg-green-500/10" />
                    <StatCard label="Desaprobados" value={stats.failed} icon={<XCircle className="text-red-400" />} colorClass="bg-red-500/10" />
                    <StatCard label="En Curso / Pendientes" value={stats.inProgress} icon={<Clock className="text-blue-400" />} colorClass="bg-blue-500/10" />
                </div>
                
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-green-400">Capacitaciones Aprobadas</h2>
                        <div className="bg-[#151515] p-4 rounded-lg border border-gray-800 space-y-2">
                           {progress.filter(p => p.status === 'completed').map(p => (
                               <p key={p.course_id} className="text-gray-300">{p.course_title}</p>
                           ))}
                           {stats.completed === 0 && <p className="text-gray-500">Sin cursos aprobados.</p>}
                        </div>
                    </div>
                     <div>
                        <h2 className="text-xl font-semibold mb-4 text-red-400">Capacitaciones Desaprobadas</h2>
                         <div className="bg-[#151515] p-4 rounded-lg border border-gray-800 space-y-2">
                           {progress.filter(p => p.status === 'failed').map(p => (
                               <p key={p.course_id} className="text-gray-300">{p.course_title}</p>
                           ))}
                           {stats.failed === 0 && <p className="text-gray-500">Sin cursos desaprobados.</p>}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-blue-400">Capacitaciones Pendientes o en Curso</h2>
                         <div className="bg-[#151515] p-4 rounded-lg border border-gray-800 space-y-2">
                           {progress.filter(p => p.status === 'in_progress' || p.status === null).map(p => (
                               <p key={p.course_id} className="text-gray-300">{p.course_title}</p>
                           ))}
                           {stats.inProgress === 0 && <p className="text-gray-500">Ningún curso pendiente.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}