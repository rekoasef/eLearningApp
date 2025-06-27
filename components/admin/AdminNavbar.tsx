// Ruta: components/admin/AdminNavbar.tsx

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BookCopy, Users, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navLinks = [
    { name: 'Gestión de Cursos', href: '/admin/cursos', icon: BookCopy },
    { name: 'Progreso de Equipo', href: '/admin/progreso', icon: Users },
];

export default function AdminNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <nav className="bg-[#151515] border-b border-gray-800 p-4 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard">
                        <span className="text-xl font-bold text-white">Crucianelli Admin</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => {
                            const isActive = pathname.startsWith(link.href);
                            return (
                                <Link key={link.name} href={link.href}>
                                    <span className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                                        isActive ? 'text-[#FF4500]' : 'text-gray-400 hover:text-white'
                                    }`}>
                                        <link.icon size={16} />
                                        {link.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
                <div className="flex items-center gap-6">
                     <Link href="/dashboard">
                        <span className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                            <LayoutDashboard size={16}/> Ir al Dashboard
                        </span>
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </nav>
    );
}