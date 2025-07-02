// Ruta: components/dashboard/DashboardSidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, BookCopy, Award, Shield, LogOut, Users, UserPlus, BarChart } from 'lucide-react';

// --- Tipos ---
type NavLink = {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
};

// CORRECCIÓN: El tipo 'Profile' ahora espera un objeto para 'sectors' y 'roles'.
type Profile = {
  role_id: number;
  full_name: string | null;
  sectors: { name: string | null } | null; // Objeto, no array
  roles: { name: string | null } | null;   // Objeto, no array
};

// --- Definición de Links ---
const navLinks: NavLink[] = [
  { name: 'Mi Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Cursos', href: '/dashboard/cursos', icon: BookCopy },
  { name: 'Mis Certificados', href: '/dashboard/certificados', icon: Award },
];

const adminLinks: NavLink[] = [
  { name: 'Gestión de Cursos', href: '/dashboard/admin/cursos', icon: Shield },
  { name: 'Métricas', href: '/dashboard/admin/metricas', icon: BarChart },
  { name: 'Progreso de Equipo', href: '/dashboard/admin/progreso', icon: Users },
  { name: 'Gestión de Usuarios', href: '/dashboard/admin/usuarios', icon: UserPlus },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // CORRECCIÓN: Seleccionamos también el nombre del rol.
        const { data } = await supabase
          .from('profiles')
          .select(`role_id, full_name, sectors (name), roles (name)`)
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile(data as Profile);
        }
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const NavItem = ({ link }: { link: NavLink }) => {
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
  
  if (isLoading) {
    return (
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 bg-[#151515] border-r border-gray-800 p-4">
            <div className="animate-pulse space-y-8">
                <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                </div>
            </div>
        </div>
    );
  }

  const isAdmin = profile?.role_id === 1 || profile?.role_id === 2;

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
                <p className="font-semibold text-white">{profile?.full_name || 'Usuario'}</p>
                {/* --- USO CORREGIDO --- */}
                <p className="text-gray-400">{profile?.roles?.name || 'Rol no definido'}</p>
                {profile?.sectors?.name && <p className="text-gray-400 text-xs">{profile.sectors.name}</p>}
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