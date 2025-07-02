// Ruta del archivo: app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { NextPage } from 'next';
import { Eye, EyeOff, Save } from 'lucide-react';

// --- Componente para el formulario de Login ---
const LoginForm = () => {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CORRECCIÓN: Se asigna el componente del ícono a una variable que empieza con mayúscula.
  const PasswordIcon = showPassword ? EyeOff : Eye;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
    } else {
      router.push('/dashboard');
      router.refresh(); 
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Correo Electrónico</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500] outline-none" placeholder="tu.correo@crucianelli.com" disabled={loading} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 pr-10 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500] outline-none" placeholder="••••••••" disabled={loading} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white">
              {/* Se usa la nueva variable como un componente normal */}
              <PasswordIcon size={20} />
            </button>
          </div>
        </div>
        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 text-sm rounded-md p-3 text-center">{error}</div>}
        <button type="submit" disabled={loading} className="w-full bg-[#FF4500] text-white font-bold py-3 rounded-md hover:bg-orange-600 disabled:bg-gray-600">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};

// --- Componente para el formulario de ACTUALIZAR CONTRASEÑA ---
const UpdatePasswordForm = () => {
    const router = useRouter();
    const supabase = createClient();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // CORRECCIÓN: Se asigna el componente del ícono a una variable que empieza con mayúscula.
    const PasswordIcon = showPassword ? EyeOff : Eye;

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="bg-[#1A1A1A] border border-green-500 rounded-lg p-8 shadow-lg text-center">
                <h2 className="text-2xl font-bold mb-4">¡Contraseña Actualizada!</h2>
                <p className="text-gray-300 mb-6">Tu cuenta ha sido activada correctamente.</p>
                <button onClick={() => router.refresh()} className="w-full bg-[#FF4500] text-white font-bold py-3 rounded-md hover:bg-orange-600">
                    Ir a Iniciar Sesión
                </button>
            </div>
        );
    }
    
    return (
        <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Crea tu Contraseña</h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
                 <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Nueva Contraseña</label>
                    <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 pr-10 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500] outline-none" placeholder="Mínimo 6 caracteres" disabled={loading} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white">
                           {/* Se usa la nueva variable como un componente normal */}
                           <PasswordIcon size={20} />
                        </button>
                    </div>
                </div>
                {error && <div className="bg-red-900/50 border border-red-500 text-red-300 text-sm rounded-md p-3 text-center">{error}</div>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#FF4500] text-white font-bold py-3 rounded-md hover:bg-orange-600 disabled:bg-gray-600">
                    <Save size={20} />
                    {loading ? 'Guardando...' : 'Guardar Contraseña y Activar'}
                </button>
            </form>
        </div>
    );
};

// --- Componente Principal de la Página ---
const AuthPage: NextPage = () => {
  const supabase = createClient();
  const [view, setView] = useState<'sign_in' | 'update_password'>('sign_in');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('update_password');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Crucianelli</h1>
          <p className="text-gray-400 mt-2">Plataforma de Capacitación Interna</p>
        </div>
        
        {view === 'sign_in' && <LoginForm />}
        {view === 'update_password' && <UpdatePasswordForm />}

      </div>
    </div>
  );
};

export default AuthPage;