'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  STUDYMATE_AGENT_STATE_EVENT,
  STUDYMATE_UI_COMMAND_EVENT,
  StudyMateUiCommand,
} from '@/lib/webmcp';
import { useToast } from '@/app/providers';
import {
  LayoutDashboard,
  Kanban,
  Award,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Settings,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface StoredUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

const emptySubscribe = () => () => {};
let cachedRawUser: string | null = null;
let cachedParsedUser: StoredUser | null = null;

function getClientUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('studymate_user');
    if (raw === cachedRawUser) return cachedParsedUser;
    cachedRawUser = raw;
    cachedParsedUser = raw ? (JSON.parse(raw) as StoredUser) : null;
    return cachedParsedUser;
  } catch {
    return null;
  }
}

function subscribeAgentState(callback: () => void) {
  window.addEventListener(STUDYMATE_AGENT_STATE_EVENT, callback);
  return () =>
    window.removeEventListener(STUDYMATE_AGENT_STATE_EVENT, callback);
}

function getAgentUnlocked(): boolean {
  try {
    return localStorage.getItem('studymate_agent_unlocked') === 'true';
  } catch {
    return false;
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const user = useSyncExternalStore(
    emptySubscribe,
    getClientUser,
    () => null
  );
  const agentUnlocked = useSyncExternalStore(
    subscribeAgentState,
    getAgentUnlocked,
    () => false
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agentCode, setAgentCode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);

  useEffect(() => {
    const handleUiCommand = (event: Event) => {
      const cmd = (event as CustomEvent<StudyMateUiCommand>).detail;
      if (cmd?.type === 'set_theme') {
        setTheme(cmd.theme);
      }
    };
    window.addEventListener(STUDYMATE_UI_COMMAND_EVENT, handleUiCommand);
    return () =>
      window.removeEventListener(STUDYMATE_UI_COMMAND_EVENT, handleUiCommand);
  }, [setTheme]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [settingsOpen]);

  const handleLogout = () => {
    localStorage.removeItem('studymate_user');
    router.push('/login');
  };

  const handleUnlockAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    setUnlockLoading(true);

    try {
      const res = await fetch('/api/agent-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: agentCode }),
      });
      const data = (await res.json()) as { unlocked?: boolean; error?: string };

      if (!res.ok || !data.unlocked) {
        setUnlockError(data.error || 'Código incorrecto.');
        setUnlockLoading(false);
        return;
      }

      localStorage.setItem('studymate_agent_unlocked', 'true');
      window.dispatchEvent(new CustomEvent(STUDYMATE_AGENT_STATE_EVENT));
      setAgentCode('');
      setUnlockLoading(false);
      showToast('Modo Agente activado');
      setSettingsOpen(false);
    } catch {
      setUnlockError('Error de conexión con el servidor.');
      setUnlockLoading(false);
    }
  };

  const handleDisableAgent = () => {
    localStorage.removeItem('studymate_agent_unlocked');
    window.dispatchEvent(new CustomEvent(STUDYMATE_AGENT_STATE_EVENT));
    showToast('Modo Agente desactivado');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
    { href: '/dashboard/kanban', label: 'Tablero', icon: Kanban },
    { href: '/dashboard/grades', label: 'Notas', icon: Award },
    { href: '/dashboard/analytics', label: 'Analítica', icon: BarChart3 },
  ];

  const isDark = mounted && theme === 'dark';
  const displayName = user?.name || 'Estudiante ESAN';
  const displayEmail = user?.email || 'estudiante@ue.edu.pe';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/90 dark:border-zinc-800/90 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-[#C8102E] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:bg-[#A60D25] transition-colors">
              SM
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                StudyMate
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 border-l border-zinc-200 dark:border-zinc-800 pl-2">
                Gestión Académica
              </span>
            </div>
          </Link>

          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-1"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-[#C8102E] dark:text-rose-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Botón Configuración */}
            <button
              type="button"
              onClick={() => {
                setUnlockError(null);
                setSettingsOpen(true);
              }}
              aria-label="Configuración"
              title="Configuración"
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="hidden lg:flex flex-col items-end pl-2 pr-1">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {displayName}
              </span>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 leading-tight">
                {displayEmail}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-[#C8102E] dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xl:inline">Salir</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileOpen}
              className="md:hidden p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              {mobileOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090B] px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-[#C8102E] dark:text-rose-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3 py-1.5">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {displayName}
                </p>
                <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  {displayEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#C8102E] dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                Salir
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modal de Configuración: Tema + Activar Agente */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/70 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#C8102E]" />
                <h2
                  id="settings-modal-title"
                  className="text-base font-bold text-zinc-900 dark:text-zinc-50"
                >
                  Configuración
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Cerrar configuración"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Opción 1: Cambio de Tema */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Apariencia de la interfaz
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      !isDark
                        ? 'border-[#C8102E] bg-rose-50/60 text-[#C8102E]'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Modo claro
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      isDark
                        ? 'border-[#C8102E] bg-rose-950/40 text-rose-400'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Modo oscuro
                  </button>
                </div>
              </div>

              {/* Opción 2: Activar Agente */}
              <div className="pt-5 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C8102E]" />
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Modo Agente (Voz y Chat IA)
                    </span>
                  </div>
                  {agentUnlocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Activo
                    </span>
                  )}
                </div>

                {agentUnlocked ? (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      El botón <strong>Agente</strong> está habilitado en la esquina inferior derecha.
                    </p>
                    <button
                      type="button"
                      onClick={handleDisableAgent}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#C8102E] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                    >
                      Desactivar
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUnlockAgent} className="space-y-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Ingresa el código de acceso para habilitar el asistente por voz y texto.
                    </p>

                    {unlockError && (
                      <div
                        role="alert"
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#C8102E]" />
                        <span>{unlockError}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="password"
                          required
                          value={agentCode}
                          onChange={(e) => setAgentCode(e.target.value)}
                          placeholder="Código de activación"
                          aria-label="Código de activación del agente"
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={unlockLoading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C8102E] hover:bg-[#A60D25] text-white disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                      >
                        {unlockLoading ? 'Validando...' : 'Activar'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
