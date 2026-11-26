'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { useToast } from '@/app/providers';
import { getStoredUser } from '@/lib/authClient';

const emptySubscribe = () => () => {};

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredUser()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isRegister ? 'register' : 'login',
          email: email.trim(),
          password,
          name: isRegister ? name.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudo completar la autenticación.');
        setLoading(false);
        return;
      }

      localStorage.setItem('studymate_user', JSON.stringify(data.user));
      showToast(
        isRegister ? 'Cuenta creada correctamente' : 'Sesión iniciada'
      );
      router.replace('/dashboard');
    } catch {
      setError('Error de conexión con el servidor.');
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setIsRegister(false);
    setEmail('24100383@ue.edu.pe');
    setPassword('admin123');
    setError(null);
  };

  const isDark = mounted && theme === 'dark';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8F9FA] dark:bg-[#09090B]">
      {/* Columna Izquierda: Editorial ESAN */}
      <div className="lg:w-[44%] bg-[#C8102E] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#C8102E] flex items-center justify-center font-bold text-base tracking-tight">
              SM
            </div>
            <span className="font-bold text-lg tracking-tight">StudyMate</span>
          </div>

          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
          >
            {mounted && isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="my-12 lg:my-0 space-y-5 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Control académico de precisión para tu ciclo universitario.
          </h1>
          <p className="text-rose-100 text-sm sm:text-base leading-relaxed max-w-md">
            Organiza tus evaluaciones por curso, calcula promedios ponderados en escala vigesimal y simula la nota necesaria para aprobar.
          </p>
        </div>

        <div className="text-xs text-rose-100/90 flex items-center justify-between border-t border-white/20 pt-5 relative z-10">
          <span>Universidad ESAN — Ciclo 2026-II</span>
          <span className="font-mono">ue.edu.pe</span>
        </div>
      </div>

      {/* Columna Derecha: Formulario */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {isRegister ? 'Crear cuenta institucional' : 'Iniciar sesión'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isRegister
                ? 'Usa tu correo @ue.edu.pe para registrar tu perfil.'
                : 'Ingresa con tu correo universitario para acceder al panel.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C8102E]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label
                  htmlFor="login-name"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Paolo Guzmán"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Correo institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="24100383@ue.edu.pe"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#C8102E] hover:bg-[#A60D25] text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>
                {loading
                  ? 'Procesando...'
                  : isRegister
                    ? 'Registrar cuenta'
                    : 'Ingresar al panel'}
              </span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {!isRegister && (
            <div className="pt-2">
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Completar con cuenta de demostración (24100383@ue.edu.pe)
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister((prev) => !prev);
                setError(null);
              }}
              className="text-xs font-semibold text-[#C8102E] dark:text-rose-400 hover:underline cursor-pointer"
            >
              {isRegister
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿Aún no tienes cuenta? Regístrate con tu correo ESAN'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
