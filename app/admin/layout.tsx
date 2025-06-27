// Ruta: app/admin/layout.tsx

import AdminNavbar from '@/components/admin/AdminNavbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <AdminNavbar />
      <main>
        {children}
      </main>
    </div>
  );
}