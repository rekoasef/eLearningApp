// Ruta: app/dashboard/layout.tsx

import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <DashboardSidebar />
      <main className="lg:pl-64">
        {children}
      </main>
    </div>
  );
}