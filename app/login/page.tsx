// Ruta del archivo: app/login/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { NextPage } from 'next';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage: NextPage = () => {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
        console.error('Supabase login error:', error.message);
      } else {
        router.push('/dashboard');
        router.refresh(); 
      }
    } catch (e) {
        setError('Ocurrió un error inesperado. Intenta de nuevo.');
        console.error('Unexpected error:', e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Crucianelli</h1>
          <p className="text-gray-400 mt-2">Plataforma de Capacitación Interna</p>
        </div>
        <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Correo Electrónico</label>
              <input type="email" id="email" name="email" required className="w-full px-4 py-3 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500] focus:border-[#FF4500] outline-none transition-all duration-200" placeholder="tu.correo@crucianelli.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}/>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password" name="password" required
                  className="w-full px-4 py-3 pr-10 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500] focus:border-[#FF4500] outline-none transition-all duration-200"
                  placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && ( <div className="bg-red-900/50 border border-red-500 text-red-300 text-sm rounded-md p-3 text-center">{error}</div> )}
            <button type="submit" disabled={loading} className="w-full bg-[#FF4500] text-white font-bold py-3 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/50 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:scale-100">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
          <div className="text-center mt-6">
            <a href="#" className="text-sm text-gray-400 hover:text-[#FF4500] hover:underline transition-colors">¿Olvidaste tu contraseña?</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;