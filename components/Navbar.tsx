'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('studymate_user');
    router.push('/login');
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
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={
              isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
            }
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
          >
            {mounted ? (
              isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700" />
              )
            ) : (
              <Sun className="w-4 h-4 opacity-0" />
            )}
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
  );
}
