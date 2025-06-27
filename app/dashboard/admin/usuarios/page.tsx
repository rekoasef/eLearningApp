// Ruta: app/dashboard/admin/usuarios/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { User, Edit, Trash2, UserPlus } from 'lucide-react';

// --- Tipos ---
type ManagedUser = {
    id: string;
    full_name: string | null;
    email: string | null;
    role_name: string | null;
    sector_name: string | null;
};

export default function ManageUsersPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchManagedUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_managed_users');

        if (error) {
            console.error("Error fetching users:", error);
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchManagedUsers();
    }, []);

    const handleDeleteUser = async (userId: string, userName: string) => {
        if(window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${userName}"? Esta acción es irreversible.`)) {
            try {
                const { error } = await supabase.functions.invoke('delete-user', { 
                    body: { user_id_to_delete: userId }
                });
                if (error) throw error;
                // Refrescamos la lista de usuarios tras el borrado
                fetchManagedUsers();
            } catch (err: any) {
                alert("Error al eliminar el usuario: " + err.message);
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Cargando usuarios...</div>;

    return (
        <div className="text-gray-200 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3"><User /> Gestión de Usuarios</h1>
                    <Link href="/dashboard/admin/usuarios/nuevo" className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                        <UserPlus size={20} /> Nuevo Usuario
                    </Link>
                </div>
                
                <div className="bg-[#151515] rounded-xl border border-gray-800 overflow-x-auto">
                    <table className="w-full text-left min-w-[640px]">
                        <thead className="bg-gray-800/50">
                            <tr>
                                <th className="p-4">Nombre Completo</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">Sector</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="p-4 font-medium text-white">{user.full_name || 'N/A'}</td>
                                    <td className="p-4 text-gray-400">{user.email || 'N/A'}</td>
                                    <td className="p-4 text-gray-300">{user.role_name || 'N/A'}</td>
                                    <td className="p-4 text-gray-300">{user.sector_name || 'N/A'}</td>
                                    <td className="p-4 flex justify-end gap-4">
                                        <Link href={`/dashboard/admin/usuarios/editar/${user.id}`} className="text-blue-400 hover:text-blue-300">
                                            <Edit size={18}/>
                                        </Link>
                                        <button onClick={() => handleDeleteUser(user.id, user.full_name || user.email || 'usuario')} className="text-red-500 hover:text-red-400"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}