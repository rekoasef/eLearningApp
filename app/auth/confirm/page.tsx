// Ruta: app/auth/confirm/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { NextPage } from 'next';
import { Eye, EyeOff, Save, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const supabase = createClient();

// --- Componente para el formulario de ACTUALIZAR CONTRASEÑA ---
const UpdatePasswordForm = () => {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const PasswordIcon = showPassword ? EyeOff : Eye;

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            setLoading(false);
            return;
        }

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
                <CheckCircle className="mx-auto text-green-500 w-12 h-12 mb-4" />
                <h2 className="text-2xl font-bold mb-4">¡Contraseña Actualizada!</h2>
                <p className="text-gray-300 mb-6">Tu cuenta ha sido activada correctamente.</p>
                <button onClick={() => router.push('/login')} className="w-full bg-[#FF4500] text-white font-bold py-3 rounded-md hover:bg-orange-600">
                    Ir a Iniciar Sesión
                </button>
            </div>
        );
    }
    
    return (
        <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Crea tu Contraseña</h2>
            <p className="text-center text-gray-400 mb-6">Estás activando tu cuenta. Elige una contraseña segura para continuar.</p>
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
                 <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Nueva Contraseña</label>
                    <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 pr-10 bg-[#0D0D0D] border border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF4500] outline-none" placeholder="Mínimo 6 caracteres" disabled={loading} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white">
                           <PasswordIcon size={20} />
                        </button>
                    </div>
                </div>
                {error && <div className="bg-red-900/50 border border-red-500 text-red-300 text-sm rounded-md p-3 text-center flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#FF4500] text-white font-bold py-3 rounded-md hover:bg-orange-600 disabled:bg-gray-600">
                    <Save size={20} />
                    {loading ? 'Guardando...' : 'Guardar y Activar Cuenta'}
                </button>
            </form>
        </div>
    );
};

// --- Componente Principal de la Página de Confirmación ---
const ConfirmPage: NextPage = () => {
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('Verificando invitación...');

    useEffect(() => {
        // CORRECCIÓN: Revisamos si la URL ya viene con un error.
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.substring(1)); // Quita el '#' inicial
        const errorDescription = urlParams.get('error_description');

        if (errorDescription) {
            setErrorMessage("El enlace de invitación es inválido o ha expirado. Por favor, contacta a un administrador.");
            setStatus('error');
            return;
        }

        // Si no hay error en la URL, escuchamos el evento de Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setStatus('ready');
          }
        });
    
        return () => subscription.unsubscribe();
    }, []);

    const renderContent = () => {
        switch (status) {
            case 'ready':
                return <UpdatePasswordForm />;
            case 'error':
                return (
                    <div className="bg-[#1A1A1A] border border-red-500 rounded-lg p-8 shadow-lg text-center">
                        <AlertTriangle className="mx-auto text-red-500 w-12 h-12 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Error de Invitación</h2>
                        <p className="text-gray-300">{errorMessage}</p>
                    </div>
                );
            default: // 'loading'
                return (
                    <div className="text-center text-gray-400 flex flex-col items-center gap-4 p-8">
                        <Loader2 className="animate-spin h-8 w-8" />
                        <p>{errorMessage}</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white">Crucianelli</h1>
                    <p className="text-gray-400 mt-2">Plataforma de Capacitación Interna</p>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default ConfirmPage;