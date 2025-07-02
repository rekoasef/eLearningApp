// Ruta: app/dashboard/admin/metricas/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, Award, TrendingUp, Building } from 'lucide-react';
import { UserProfile } from '@/types'; // Importamos el tipo centralizado

// --- Tipos de Datos ---
type GeneralStats = {
  total_users: number;
  total_courses: number;
  total_certificates_issued: number;
};

type CourseStat = {
  course_id: string;
  course_title: string;
  enrolled_users: number;
  completed_users: number;
  failed_users: number;
  in_progress_users: number;
  completion_rate: number;
  sector_name: string | null;
};

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <div className="bg-[#151515] p-6 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-400">{title}</p>
            {icon}
        </div>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
);

// --- Página Principal de Métricas ---
export default function MetricasPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
    const [courseStats, setCourseStats] = useState<CourseStat[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const [generalRes, courseRes, profileRes] = await Promise.all([
                supabase.rpc('get_kpi_general_stats'),
                supabase.rpc('get_kpi_course_stats'),
                supabase.from('profiles').select(`role_id, sectors (name)`).eq('id', user.id).single()
            ]);
            
            if (generalRes.data) setGeneralStats(generalRes.data[0]);
            if (courseRes.data) setCourseStats(courseRes.data);
            if (profileRes.data) setProfile(profileRes.data);
            
            setLoading(false);
        };
        fetchData();
    }, [supabase]);

    if (loading) {
        return <div className="p-8 text-center text-white">Cargando métricas...</div>;
    }

    const COLORS = ['#10B981', '#EF4444', '#3B82F6']; // Verde, Rojo, Azul
    const courseStatusData = courseStats.reduce((acc, course: any) => {
        acc[0].value += course.completed_users;
        acc[1].value += course.failed_users;
        acc[2].value += course.in_progress_users;
        return acc;
    }, [{name: 'Completados', value: 0}, {name: 'Desaprobados', value: 0}, {name: 'En Progreso', value: 0}]);
    
    const isSuperAdmin = profile?.role_id === 1;

    return (
        <div className="text-gray-200 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <TrendingUp />
                        Métricas de la Plataforma
                    </h1>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                        <Building size={16} />
                        {isSuperAdmin ? 'Mostrando datos de todos los sectores' : `Mostrando datos del sector: ${profile?.sectors?.[0]?.name || 'Mi Sector'}`}
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title={isSuperAdmin ? "Usuarios Totales" : "Usuarios en tu Sector"} value={generalStats?.total_users || 0} icon={<Users className="w-6 h-6 text-gray-500" />} />
                    <StatCard title={isSuperAdmin ? "Cursos Totales" : "Cursos en tu Sector"} value={generalStats?.total_courses || 0} icon={<BookOpen className="w-6 h-6 text-gray-500" />} />
                    <StatCard title={isSuperAdmin ? "Certificados Totales" : "Certificados en tu Sector"} value={generalStats?.total_certificates_issued || 0} icon={<Award className="w-6 h-6 text-gray-500" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#151515] p-6 rounded-xl border border-gray-800">
                        <h3 className="text-lg font-semibold text-white mb-4">Tasa de Aprobación por Curso (%)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={courseStats} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="course_title" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} formatter={(value) => `${Number(value).toFixed(0)}%`} />
                                <Legend />
                                <Bar dataKey="completion_rate" fill="#FF4500" name="Tasa de Aprobación" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-[#151515] p-6 rounded-xl border border-gray-800">
                        <h3 className="text-lg font-semibold text-white mb-4">Estado General de Inscripciones</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                  data={courseStatusData.filter(d => d.value > 0)} 
                                  cx="50%" 
                                  cy="50%" 
                                  labelLine={false} 
                                  outerRadius={80} 
                                  fill="#8884d8" 
                                  dataKey="value" 
                                  nameKey="name" 
                                  label={({ name, percent }) => percent && typeof percent === 'number' ? `${name} ${(percent * 100).toFixed(0)}%` : name}
                                >
                                    {courseStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}