'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import ScoreModal from '@/components/ScoreModal';
import {
  STUDYMATE_DATA_UPDATED_EVENT,
  STUDYMATE_UI_COMMAND_EVENT,
  StudyMateUiCommand,
} from '@/lib/webmcp';
import { Award, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

interface GradeTask {
  id: string;
  title: string;
  weight: number;
  score: number | null;
}

interface GradeCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  tasks: GradeTask[];
  metrics: {
    evaluatedPercentage: number;
    accumulatedPoints: number;
    currentAverage: number;
    minScoreToPass: number | null;
  };
}

export default function GradesPage() {
  const [courses, setCourses] = useState<GradeCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetGrade, setTargetGrade] = useState<number>(() => {
    if (typeof window === 'undefined') return 14.0;
    const pending = sessionStorage.getItem('studymate_pending_target_grade');
    if (pending) {
      sessionStorage.removeItem('studymate_pending_target_grade');
      const parsed = parseFloat(pending);
      if (!isNaN(parsed)) return parsed;
    }
    return 14.0;
  });
  const [activeTaskForScore, setActiveTaskForScore] =
    useState<GradeTask | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/courses?userId=default-user');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error('Error cargando calificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/courses?userId=default-user')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCourses(data))
      .catch((err) => console.error('Error cargando calificaciones:', err))
      .finally(() => setLoading(false));

    const handleRefresh = () => {
      loadCourses();
    };
    const handleUiCommand = (event: Event) => {
      const cmd = (event as CustomEvent<StudyMateUiCommand>).detail;
      if (cmd?.type === 'set_target_grade') {
        setTargetGrade(cmd.targetGrade);
        sessionStorage.removeItem('studymate_pending_target_grade');
      }
    };

    window.addEventListener(STUDYMATE_DATA_UPDATED_EVENT, handleRefresh);
    window.addEventListener(STUDYMATE_UI_COMMAND_EVENT, handleUiCommand);
    return () => {
      window.removeEventListener(STUDYMATE_DATA_UPDATED_EVENT, handleRefresh);
      window.removeEventListener(STUDYMATE_UI_COMMAND_EVENT, handleUiCommand);
    };
  }, [loadCourses]);

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#09090B]">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Cabecera + Simulador */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Registro de calificaciones
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Control vigesimal (0 – 20) y simulación de nota necesaria en evaluaciones pendientes.
              </p>
            </div>

            {/* Simulador de Meta */}
            <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:min-w-[320px] space-y-2">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="target-grade-slider"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#C8102E]" />
                  Simular nota final objetivo
                </label>
                <span className="font-mono text-base font-bold tabular-nums text-[#C8102E] dark:text-rose-400">
                  {targetGrade.toFixed(1)} / 20
                </span>
              </div>
              <input
                id="target-grade-slider"
                type="range"
                min="10.5"
                max="19.5"
                step="0.5"
                value={targetGrade}
                onChange={(e) => setTargetGrade(parseFloat(e.target.value))}
                className="w-full accent-[#C8102E] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>10.5 (Mínimo)</span>
                <span>14.0 (Bueno)</span>
                <span>19.5</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 animate-pulse"
                />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#111114] rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <Award className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-500">
                No hay asignaturas registradas para mostrar calificaciones.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {courses.map((course) => {
                const { metrics } = course;
                const remainingRatio = Math.max(
                  0,
                  (100 - metrics.evaluatedPercentage) / 100
                );
                const neededForTarget =
                  remainingRatio > 0
                    ? (targetGrade - metrics.accumulatedPoints) / remainingRatio
                    : null;

                return (
                  <section
                    key={course.id}
                    className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
                  >
                    {/* Cabecera del Curso */}
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/40">
                      <div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums block mb-0.5">
                          {course.credits} créditos
                        </span>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                          {course.name}
                        </h2>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            Puntos acumulados
                          </p>
                          <p className="text-xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                            {metrics.accumulatedPoints.toFixed(2)}
                            <span className="text-xs font-normal text-zinc-400 ml-1">
                              ({metrics.evaluatedPercentage}%)
                            </span>
                          </p>
                        </div>

                        <div className="pl-6 border-l border-zinc-200 dark:border-zinc-800">
                          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            Promedio actual
                          </p>
                          <p className="text-xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                            {metrics.evaluatedPercentage > 0
                              ? metrics.currentAverage.toFixed(2)
                              : '—'}
                          </p>
                        </div>

                        <div className="pl-6 border-l border-zinc-200 dark:border-zinc-800">
                          <p className="text-[11px] font-medium text-[#C8102E] dark:text-rose-400">
                            Para llegar a {targetGrade.toFixed(1)}
                          </p>
                          {neededForTarget === null ? (
                            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              {metrics.accumulatedPoints >= targetGrade
                                ? 'Logrado'
                                : 'Cerrado'}
                            </p>
                          ) : neededForTarget <= 0 ? (
                            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              Asegurado
                            </p>
                          ) : neededForTarget > 20 ? (
                            <p className="text-xl font-bold font-mono text-zinc-400">
                              &gt; 20.0
                            </p>
                          ) : (
                            <p className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                              {neededForTarget.toFixed(1)}
                              <span className="text-xs font-normal text-zinc-400 ml-1">
                                prom.
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tabla de Evaluaciones */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50/40 dark:bg-zinc-900/20">
                            <th className="py-3 px-6">Evaluación</th>
                            <th className="py-3 px-6">Peso</th>
                            <th className="py-3 px-6">Calificación</th>
                            <th className="py-3 px-6">Aporte al promedio</th>
                            <th className="py-3 px-6 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                          {(course.tasks || []).map((task) => {
                            const pointsContributed =
                              task.score !== null
                                ? (task.weight * task.score).toFixed(2)
                                : null;

                            return (
                              <tr
                                key={task.id}
                                className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                              >
                                <td className="py-3.5 px-6 font-medium text-zinc-900 dark:text-zinc-100">
                                  {task.title}
                                </td>
                                <td className="py-3.5 px-6 font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                                  {(task.weight * 100).toFixed(0)}%
                                </td>
                                <td className="py-3.5 px-6">
                                  {task.score !== null ? (
                                    <span
                                      className={`inline-block font-mono font-bold tabular-nums px-2.5 py-0.5 rounded-lg text-xs border ${
                                        task.score >= 14
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
                                          : task.score >= 10.5
                                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900'
                                            : 'bg-rose-50 text-[#C8102E] border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                                      }`}
                                    >
                                      {task.score.toFixed(1)} / 20
                                    </span>
                                  ) : (
                                    <span className="text-xs text-zinc-400">
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-6 font-mono tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                                  {pointsContributed !== null
                                    ? `+${pointsContributed} pts`
                                    : '—'}
                                </td>
                                <td className="py-3.5 px-6 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTaskForScore(task);
                                      setIsScoreModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-[#C8102E] hover:text-white dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-[#C8102E] transition-colors cursor-pointer"
                                  >
                                    {task.score !== null
                                      ? 'Editar nota'
                                      : 'Ingresar nota'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>

        {activeTaskForScore && (
          <ScoreModal
            key={activeTaskForScore.id}
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
    </AuthGuard>
  );
}
