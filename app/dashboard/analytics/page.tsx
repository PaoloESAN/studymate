'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { calculateSemesterGPA } from '@/lib/gradeCalculator';
import { getStoredUserId } from '@/lib/authClient';
import {
  TrendingUp,
  CheckCircle2,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

interface AnalyticsCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  tasks: Array<{ id: string; status: string; score: number | null }>;
  metrics: {
    evaluatedPercentage: number;
    accumulatedPoints: number;
    currentAverage: number;
  };
}

export default function AnalyticsPage() {
  const [courses, setCourses] = useState<AnalyticsCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getStoredUserId();
    if (!userId) return;
    fetch(`/api/courses?userId=${encodeURIComponent(userId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCourses(data))
      .catch((err) => console.error('Error en analítica:', err))
      .finally(() => setLoading(false));
  }, []);

  const gpa = calculateSemesterGPA(
    courses.map((c) => ({
      credits: c.credits,
      currentAverage: c.metrics.currentAverage,
      evaluatedPercentage: c.metrics.evaluatedPercentage,
    }))
  );

  const allTasks = courses.flatMap((c) => c.tasks || []);
  const completedCount = allTasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const pendingCount = allTasks.filter((t) => t.status === 'PENDING').length;
  const totalTasks = allTasks.length;

  const passingPct = (10.5 / 20) * 100;

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#09090B]">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Analítica académica
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Rendimiento ponderado por créditos, distribución de entregas y umbral aprobatorio.
            </p>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 animate-pulse"
                  />
                ))}
              </div>
              <div className="h-72 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 animate-pulse" />
            </div>
          ) : (
            <>
              {/* 4 KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-rose-200/80 dark:border-rose-900/50">
                  <div className="flex items-center justify-between text-[#C8102E] dark:text-rose-400">
                    <span className="text-xs font-semibold">GPA semestral</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-3xl font-bold font-mono tabular-nums text-[#C8102E] dark:text-rose-400 mt-2">
                    {gpa.semesterGPA > 0 ? gpa.semesterGPA.toFixed(2) : '—'}
                    <span className="text-xs font-normal text-zinc-400 ml-1">/20</span>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span className="text-xs font-medium">Créditos matriculados</span>
                    <GraduationCap className="w-4 h-4 text-zinc-400" />
                  </div>
                  <p className="text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 mt-2">
                    {gpa.totalCredits}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span className="text-xs font-medium">Evaluaciones cerradas</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 mt-2">
                    {completedCount}
                    <span className="text-xs font-normal text-zinc-400 ml-1">
                      /{totalTasks}
                    </span>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span className="text-xs font-medium">Asignaturas activas</span>
                    <BookOpen className="w-4 h-4 text-zinc-400" />
                  </div>
                  <p className="text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 mt-2">
                    {courses.length}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de Barras por Curso */}
                <section className="lg:col-span-2 bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                        Rendimiento comparativo por asignatura
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Promedio actual sobre 20 con línea mínima aprobatoria (10.5)
                      </p>
                    </div>
                  </div>

                  {courses.length === 0 ? (
                    <p className="text-sm text-zinc-400 py-12 text-center">
                      No hay asignaturas registradas.
                    </p>
                  ) : (
                    <div className="relative pt-4 pb-2">
                      {/* Línea de referencia 10.5 */}
                      <div className="space-y-5">
                        {courses.map((course) => {
                          const avg = course.metrics.currentAverage || 0;
                          const widthPct = Math.min(100, (avg / 20) * 100);
                          const isPassing = avg >= 10.5;

                          return (
                            <div key={course.id} className="space-y-1.5">
                              <div className="flex justify-between items-baseline text-xs">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate pr-3">
                                  {course.name}
                                </span>
                                <span className="font-mono font-bold tabular-nums text-zinc-900 dark:text-zinc-100 shrink-0">
                                  {course.metrics.evaluatedPercentage > 0
                                    ? `${avg.toFixed(2)} / 20`
                                    : 'Sin notas'}
                                </span>
                              </div>

                              <div className="relative w-full h-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                                {/* Marca de 10.5 */}
                                <div
                                  title="Nota mínima aprobatoria: 10.5"
                                  className="absolute top-0 bottom-0 w-0.5 bg-zinc-400/70 dark:bg-zinc-500 z-10"
                                  style={{ left: `${passingPct}%` }}
                                />
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    course.metrics.evaluatedPercentage === 0
                                      ? 'bg-zinc-300 dark:bg-zinc-700'
                                      : isPassing
                                        ? 'bg-emerald-500'
                                        : 'bg-[#C8102E]'
                                  }`}
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Aprobado (&ge; 10.5)
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E]" />
                          En riesgo (&lt; 10.5)
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-0.5 h-3 bg-zinc-400" />
                          Umbral 10.5
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                {/* Estado de Evaluaciones y Créditos */}
                <section className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      Estado de evaluaciones
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Distribución del flujo Kanban
                    </p>
                  </div>

                  {/* Barra segmentada */}
                  <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
                    {totalTasks > 0 && (
                      <>
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: `${(completedCount / totalTasks) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-amber-500 h-full"
                          style={{
                            width: `${(inProgressCount / totalTasks) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-zinc-400 dark:bg-zinc-600 h-full"
                          style={{
                            width: `${(pendingCount / totalTasks) * 100}%`,
                          }}
                        />
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Completadas
                      </span>
                      <span className="font-mono font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {completedCount}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        En curso
                      </span>
                      <span className="font-mono font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {inProgressCount}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                        Por hacer
                      </span>
                      <span className="font-mono font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {pendingCount}
                      </span>
                    </li>
                  </ul>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Peso de créditos por curso
                    </p>
                    {courses.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400"
                      >
                        <span className="truncate pr-2">{c.name}</span>
                        <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
                          {c.credits} cr.
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
