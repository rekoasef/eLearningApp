// Ruta: app/dashboard/layout.tsx
'use client'; // Necesario para poder usar estado (useState)

import { useState } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { Menu } from 'lucide-react'; // Importamos el ícono del menú

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* El componente de la barra lateral ahora recibe el estado */}
      <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="lg:pl-64">
        {/* ENCABEZADO PARA MÓVILES */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-800 bg-[#1A1A1A] px-4 shadow-sm sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-gray-400" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Abrir menú lateral</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-lg font-semibold leading-6 text-white">
            Plataforma Crucianelli
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}