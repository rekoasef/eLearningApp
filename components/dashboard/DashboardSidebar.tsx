// Ruta: components/dashboard/DashboardSidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, BookCopy, Award, Shield, LogOut, Users } from 'lucide-react';

// --- Tipos ---
type NavLink = { name: string; href: string; icon: React.ElementType; exact?: boolean; };
type Profile = { role_id: number; full_name: string | null; sectors: { name: string | null } | null; };

// --- Definición de Links ---
const navLinks: NavLink[] = [
  { name: 'Mi Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true }, // Marcamos este como de coincidencia exacta
  { name: 'Cursos', href: '/dashboard/cursos', icon: BookCopy },
  { name: 'Mis Certificados', href: '/dashboard/certificados', icon: Award },
];

const adminLinks: NavLink[] = [
  { name: 'Gestión de Cursos', href: '/admin/cursos', icon: Shield },
  { name: 'Progreso de Equipo', href: '/admin/progreso', icon: Users },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select(`role_id, full_name, sectors (name)`).eq('id', user.id).single();
        if (data) {
          setProfile(data as Profile);
          setIsAdmin(data.role_id === 1 || data.role_id === 2);
        }
      }
    };
    fetchProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const NavItem = ({ link }: { link: NavLink }) => {
    // AQUÍ LA CORRECCIÓN: Usamos coincidencia exacta o 'startsWith' según se necesite
    const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
    return (
      <Link href={link.href}>
        <span className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive ? 'bg-[#FF4500] text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}>
          <link.icon className="h-5 w-5" />
          {link.name}
        </span>
      </Link>
    );
  };

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 bg-[#151515] border-r border-gray-800 p-4">
      <div className="flex-grow flex flex-col gap-y-5 overflow-y-auto overflow-x-hidden">
        <div className="flex items-center gap-3 h-16 shrink-0 px-3">
          <span className="text-2xl font-bold text-white">Crucianelli</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400">Navegación</div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {navLinks.map((item) => <NavItem key={item.name} link={item} />)}
              </ul>
            </li>

            {isAdmin && (
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">Panel de Administrador</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {adminLinks.map((item) => <NavItem key={item.name} link={item} />)}
                </ul>
              </li>
            )}

            <li className="-mx-2 mt-auto">
              <div className="p-3 text-sm">
                <p className="font-semibold text-white">{profile?.full_name || 'Cargando...'}</p>
                <p className="text-gray-400">{profile?.sectors?.name || (isAdmin ? 'Superadministrador' : 'Sin sector')}</p>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}