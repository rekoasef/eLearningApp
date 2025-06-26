// Ruta del archivo: app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { LogOut, BookOpen, Wrench, BarChartHorizontal, Award } from 'lucide-react'; // Importamos el ícono de premio
import Link from 'next/link';

// --- Tipos ---
type Course = {
  id: string; 
  title: string;
  description: string | null;
};

// NUEVO: Tipo para los certificados, incluyendo el título del curso anidado
type Certificate = {
  id: string;
  pdf_url: string;
  courses: {
    title: string;
  } | null;
};

const courseIcons: { [key: string]: React.ReactNode } = {
  'Introducción a Cosechadoras V2': <BookOpen size={28} className="text-gray-500" />,
  'Mantenimiento Preventivo de Sembradoras': <Wrench size={28} className="text-gray-500" />,
  'Protocolo de Ventas Consultivas': <BarChartHorizontal size={28} className="text-gray-500" />,
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  // NUEVO: Estado para guardar los certificados
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { router.push('/login'); return; }
      setUser(user);

      // Fetch de cursos (sin cambios)
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, description')
        .eq('is_published', true);

      if (coursesError) { console.error('Error fetching courses:', coursesError); } 
      else if (coursesData) { setCourses(coursesData); }

      // NUEVO: Fetch de certificados del usuario
      // Hacemos un "join" para traernos el título del curso junto con el certificado
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('certificates')
        .select(`
          id,
          pdf_url,
          courses ( title )
        `)
        .eq('user_id', user.id);
      
      if (certificatesError) {
        console.error('Error fetching certificates:', certificatesError);
      } else if (certificatesData) {
        setCertificates(certificatesData);
      }

      setLoading(false);
    };
    fetchData();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
             <svg className="animate-spin h-8 w-8 text-[#FF4500]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-200 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Plataforma Crucianelli</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 font-medium py-2 px-4 rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </header>
        <main>
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-white mb-2">¡Hola, {user?.email?.split('@')[0]}!</h2>
            <p className="text-lg text-gray-400">¿Qué aprenderemos hoy?</p>
          </div>

          {/* --- NUEVA SECCIÓN DE CERTIFICADOS --- */}
          {certificates.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Award className="text-amber-400" />
                Mis Certificados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <a
                    key={cert.id}
                    href={cert.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="group bg-[#151515] rounded-xl p-6 transition-all ease-in-out hover:bg-amber-500/10 hover:scale-[1.02] cursor-pointer border border-transparent hover:border-amber-500/30 flex flex-col"
                  >
                    <div className="w-14 h-14 bg-amber-800/50 rounded-lg flex items-center justify-center mb-5 group-hover:bg-amber-500/20 transition-colors">
                        <Award size={28} className="text-amber-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{cert.courses?.title}</h4>
                    <p className="text-gray-400 text-sm mb-4 flex-grow">Certificado de finalización</p>
                    <span className="text-amber-400 font-semibold text-sm self-start mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      Descargar PDF →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Sección de Cursos Disponibles */}
          <div className={certificates.length > 0 ? "border-t border-gray-800 pt-12" : ""}>
            <h3 className="text-xl font-semibold text-white mb-6">Cursos Disponibles</h3>
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Link href={`/cursos/${course.id}`} key={course.id}>
                    <div className="group h-full bg-[#151515] rounded-xl p-6 transition-all ease-in-out hover:bg-[#1A1A1A] hover:scale-[1.02] cursor-pointer border border-transparent hover:border-[#FF4500]/30 flex flex-col">
                      <div className="w-14 h-14 bg-gray-800/50 rounded-lg flex items-center justify-center mb-5 group-hover:bg-[#FF4500]/10 transition-colors">
                        {courseIcons[course.title] || <BookOpen size={28} className="text-gray-500" />}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{course.title}</h4>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">{course.description}</p>
                      <span className="text-[#FF4500] font-semibold text-sm self-start mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        Comenzar curso →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-[#1A1A1A] rounded-lg p-8 text-center border border-gray-800">
                <p className="text-gray-400">No hay cursos disponibles.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
