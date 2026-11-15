'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import VoiceWebMcpAssistant from '@/components/VoiceWebMcpAssistant';

const emptySubscribe = () => () => {};

function getStoredAuth(): boolean {
  try {
    const raw = localStorage.getItem('studymate_user');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.email);
  } catch {
    return false;
  }
}

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const isAuthorized = useSyncExternalStore(
    emptySubscribe,
    getStoredAuth,
    () => false
  );

  useEffect(() => {
    if (!isAuthorized) {
      router.replace('/login');
    }
  }, [isAuthorized, router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090B]">
        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-28 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
          <div className="w-24 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="space-y-2">
            <div className="w-64 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-96 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <VoiceWebMcpAssistant />
    </>
  );
}
