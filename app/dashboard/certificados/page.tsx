// Ruta: app/dashboard/certificados/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, ArrowLeft, Download } from 'lucide-react';

// --- Tipos ---
type Certificate = {
  id: string;
  pdf_url: string;
  courses: {
    title: string;
  } | null;
  completed_at: string;
};

// --- Componente de la tarjeta de certificado ---
const CertificateCard = ({ certificate }: { certificate: Certificate }) => (
    <a 
        href={certificate.pdf_url} 
        target="_blank" 
        rel="noopener noreferrer" 
        download
        className="group bg-[#1A1A1A] rounded-xl p-6 transition-all ease-in-out hover:bg-amber-500/10 hover:scale-[1.02] cursor-pointer border border-gray-800 hover:border-amber-500/30 flex flex-col"
    >
        <div className="w-16 h-16 bg-amber-800/50 rounded-lg flex items-center justify-center mb-5 group-hover:bg-amber-500/20 transition-colors">
            <Award size={32} className="text-amber-400" />
        </div>
        <h4 className="text-xl font-bold text-white mb-2 flex-grow">{certificate.courses?.title || 'Curso sin Título'}</h4>
        <p className="text-sm text-gray-400 mb-5">
            Obtenido el: {new Date(certificate.completed_at).toLocaleDateString('es-AR')}
        </p>
        <div className="flex items-center justify-between text-amber-400 font-semibold text-sm mt-auto">
            <span>Ver y Descargar</span>
            <Download size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    </a>
);


// --- Componente Principal de la página ---
export default function CertificatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { 
        router.push('/login'); 
        return; 
      }

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      setUserName(profile?.full_name || user.email?.split('@')[0] || 'Usuario');
      
      const { data, error } = await supabase
        .from('certificates')
        .select(`
            id,
            pdf_url,
            courses ( title ),
            completed_at
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error("Error al cargar los certificados:", error);
      } else if (data) {
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // Le decimos a TypeScript que cada 'item' es de tipo 'any' para que no se queje.
        const formattedCertificates: Certificate[] = data.map((item: any) => ({
          id: item.id,
          pdf_url: item.pdf_url,
          courses: item.courses,
          completed_at: item.completed_at
        }));
        setCertificates(formattedCertificates);
      } else {
        setCertificates([]);
      }
      setLoading(false);
    };
    fetchCertificates();
  }, [router, supabase]);

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
        <header className="mb-10">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit">
                <ArrowLeft size={18} />
                Volver al Dashboard
            </Link>
        </header>
        <main>
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Mis Certificados</h1>
            <p className="text-lg text-gray-400">
              {userName}, aquí están todos los certificados que has obtenido. ¡Felicitaciones!
            </p>
          </div>

          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map(cert => (
                    <CertificateCard key={cert.id} certificate={cert} />
                ))}
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-lg p-12 text-center border border-dashed border-gray-700">
                <Award size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white">Aún no tienes certificados</h3>
                <p className="text-gray-400 mt-2">Completa un curso y aprueba el examen final para obtener tu primer certificado.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}