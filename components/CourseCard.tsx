// components/CourseCard.tsx - Tarjeta de Asignatura con métricas ponderadas en tiempo real (HU02, HU05)
'use client';

import React from 'react';
import { BookOpen, Plus, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getUrgencyBadge, formatLimaDate } from '@/lib/dateAlerts';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  weight: number;
  score: number | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface CourseMetrics {
  evaluatedPercentage: number;
  accumulatedPoints: number;
  currentAverage: number;
  minScoreToPass: number;
}

interface CourseCardProps {
  course: {
    id: string;
    code: string;
    name: string;
    credits: number;
    tasks: Task[];
    metrics: CourseMetrics;
  };
  onAddTask: (courseId: string, courseName: string) => void;
  onGradeTask?: (task: Task) => void;
}

export default function CourseCard({ course, onAddTask, onGradeTask }: CourseCardProps) {
  const { code, name, credits, tasks, metrics } = course;

  const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);
  const totalWeightPercent = Math.round(totalWeight * 100);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
      {/* Cabecera del Curso */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              {code}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200/60 dark:border-red-800/60">
              {credits} {credits === 1 ? 'crédito' : 'créditos'}
            </span>
          </div>

          <button
            onClick={() => onAddTask(course.id, name)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Tarea</span>
          </button>
        </div>

        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {name}
        </h3>

        {/* Panel de Métricas Ponderadas en Vivo (HU05) */}
        <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">Avance</p>
            <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {metrics.evaluatedPercentage}%
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">Acumulado</p>
            <p className="text-base font-extrabold text-red-600 dark:text-red-400">
              {metrics.accumulatedPoints.toFixed(2)} <span className="text-xs text-zinc-400 font-normal">/20</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">Promedio</p>
            <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {metrics.evaluatedPercentage > 0 ? metrics.currentAverage.toFixed(2) : '-'}
            </p>
          </div>
        </div>

        {/* Barra de progreso de ponderación */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1 font-medium">
            <span>Ponderación planificada:</span>
            <span className={totalWeightPercent > 100 ? 'text-red-600 font-bold' : ''}>
              {totalWeightPercent}% / 100%
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                totalWeightPercent > 100
                  ? 'bg-rose-500'
                  : totalWeightPercent === 100
                  ? 'bg-emerald-500'
                  : 'bg-red-600'
              }`}
              style={{ width: `${Math.min(100, totalWeightPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lista de Tareas del Curso */}
      <div className="p-6 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
          Actividades ({tasks.length})
        </p>
        {tasks.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-2">No hay actividades registradas en esta asignatura.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {tasks.map((task) => {
              const badge = getUrgencyBadge(task.dueDate, task.status);
              return (
                <div
                  key={task.id}
                  className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between text-xs"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                      <span>Vence: {formatLimaDate(task.dueDate)}</span>
                      <span>•</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {(task.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] border ${badge.color}`}>
                      {badge.label}
                    </span>

                    {task.score !== null ? (
                      <span className="font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                        {task.score.toFixed(1)}
                      </span>
                    ) : onGradeTask ? (
                      <button
                        onClick={() => onGradeTask(task)}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                      >
                        Calificar
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
