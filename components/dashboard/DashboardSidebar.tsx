// Ruta: components/dashboard/DashboardSidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react'; // <-- Se importa la librería instalada
import { LayoutDashboard, BookCopy, Award, Shield, LogOut, Users, UserPlus, BarChart, X } from 'lucide-react';

// --- Tipos ---
type NavLink = { name: string; href: string; icon: React.ElementType; exact?: boolean; };
type Profile = { role_id: number; full_name: string | null; sectors: { name: string | null } | null; roles: { name: string | null } | null; };
const navLinks: NavLink[] = [ { name: 'Mi Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true }, { name: 'Cursos', href: '/dashboard/cursos', icon: BookCopy }, { name: 'Mis Certificados', href: '/dashboard/certificados', icon: Award }, ];
const adminLinks: NavLink[] = [ { name: 'Gestión de Cursos', href: '/dashboard/admin/cursos', icon: Shield }, { name: 'Métricas', href: '/dashboard/admin/metricas', icon: BarChart }, { name: 'Progreso de Equipo', href: '/dashboard/admin/progreso', icon: Users }, { name: 'Gestión de Usuarios', href: '/dashboard/admin/usuarios', icon: UserPlus }, ];

// --- Nuevas props para el componente ---
interface DashboardSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function DashboardSidebar({ sidebarOpen, setSidebarOpen }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select(`role_id, full_name, sectors (name), roles (name)`).eq('id', user.id).single();
        if (data) {
          // @ts-ignore
          setProfile(data);
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
      <Link href={link.href} onClick={() => setSidebarOpen(false)}>
        <span className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${ isActive ? 'bg-[#FF4500] text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white' }`}>
          <link.icon className="h-5 w-5" />
          {link.name}
        </span>
      </Link>
    );
  };
  
  const isAdmin = profile?.role_id === 1 || profile?.role_id === 2;

  const sidebarNavigation = (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#151515] p-4">
      <div className="flex h-16 shrink-0 items-center px-3">
        <span className="text-2xl font-bold text-white">Crucianelli</span>
      </div>
      {isLoading ? (
        <div className="animate-pulse space-y-4 p-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-700 rounded w-4/6"></div>
        </div>
      ) : (
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
      )}
    </div>
  );

  return (
    <>
      {/* MENÚ LATERAL PARA MÓVIL (OFF-CANVAS) */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>
          <div className="fixed inset-0 flex">
            <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <X className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                {sidebarNavigation}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* MENÚ LATERAL ESTÁTICO PARA ESCRITORIO */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col bg-[#151515] border-r border-gray-800">
        {sidebarNavigation}
      </div>
    </>
  );
}