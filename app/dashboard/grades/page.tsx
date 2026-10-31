// app/dashboard/grades/page.tsx - Calculadora y Simulador de Calificaciones Ponderadas (HU05 / HU06)
// Genera la evidencia para FOTO 18 (Cálculo automático de promedio ponderado y nota necesaria)
'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ScoreModal from '@/components/ScoreModal';
import { Calculator, Award, ArrowUpRight, HelpCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { calculateCourseMetrics } from '@/lib/gradeCalculator';

export default function GradesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTaskForScore, setActiveTaskForScore] = useState<any | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/courses?userId=default-user');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Simulador Matemático Ponderado (HU05 / RF-05)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Calculadora de Promedios y Calificaciones
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Revisa tus notas vigesimales (0 a 20) y simula la nota exacta requerida para aprobar cada materia.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-400 text-sm">Calculando promedios...</div>
        ) : (
          <div className="space-y-8">
            {courses.map((course) => {
              const metrics = course.metrics;
              const hasGrades = metrics.evaluatedPercentage > 0;

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden"
                >
                  {/* Cabecera del Curso y Métricas */}
                  <div className="p-6 bg-gradient-to-r from-zinc-50 via-white to-red-50/20 dark:from-zinc-900 dark:to-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                          {course.code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                          {course.credits} créditos
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                        {course.name}
                      </h2>
                    </div>

                    {/* Resumen de Métricas Clave */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                          Nota Acumulada
                        </p>
                        <p className="text-2xl font-black text-red-600 dark:text-red-400">
                          {metrics.accumulatedPoints.toFixed(2)}{' '}
                          <span className="text-xs font-normal text-zinc-400">/20</span>
                        </p>
                      </div>

                      <div className="text-right pl-6 border-l border-zinc-200 dark:border-zinc-800">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                          Promedio Relativo
                        </p>
                        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                          {hasGrades ? metrics.currentAverage.toFixed(2) : '-'}
                        </p>
                      </div>

                      <div className="text-right pl-6 border-l border-zinc-200 dark:border-zinc-800">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Para Aprobar (10.5)
                        </p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {metrics.evaluatedPercentage >= 100
                            ? (metrics.accumulatedPoints >= 10.5 ? '¡Aprobado!' : 'Desaprobado')
                            : `${metrics.minScoreToPass.toFixed(1)}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Evaluaciones */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          <th className="py-3 px-6">Evaluación</th>
                          <th className="py-3 px-6">Peso (%)</th>
                          <th className="py-3 px-6">Calificación (0 - 20)</th>
                          <th className="py-3 px-6">Puntos Aportados</th>
                          <th className="py-3 px-6 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {(course.tasks || []).map((task: any) => {
                          const pointsContributed =
                            task.score !== null ? (task.weight * task.score).toFixed(2) : '-';

                          return (
                            <tr key={task.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                              <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100">
                                {task.title}
                              </td>
                              <td className="py-4 px-6 font-medium text-zinc-600 dark:text-zinc-400">
                                {(task.weight * 100).toFixed(0)}%
                              </td>
                              <td className="py-4 px-6 font-black">
                                {task.score !== null ? (
                                  <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                                    {task.score.toFixed(1)} / 20
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 italic">Pendiente</span>
                                )}
                              </td>
                              <td className="py-4 px-6 font-bold text-zinc-700 dark:text-zinc-300">
                                {pointsContributed !== '-' ? `+${pointsContributed} pts` : '-'}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => {
                                    setActiveTaskForScore(task);
                                    setIsScoreModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:hover:bg-red-950/40 text-zinc-700 dark:text-zinc-300 transition-colors"
                                >
                                  {task.score !== null ? 'Modificar Nota' : '+ Ingresar Nota'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {activeTaskForScore && (
        <ScoreModal
          isOpen={isScoreModalOpen}
          onClose={() => {
            setIsScoreModalOpen(false);
            setActiveTaskForScore(null);
          }}
          taskId={activeTaskForScore.id}
          taskTitle={activeTaskForScore.title}
          currentScore={activeTaskForScore.score}
          onScoreUpdated={loadCourses}
        />
      )}
    </div>
  );
}
