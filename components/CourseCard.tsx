'use client';

import React from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { getUrgencyBadge, formatLimaDate } from '@/lib/dateAlerts';

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  weight: number;
  score: number | null;
  status: string;
}

interface CourseMetrics {
  evaluatedPercentage: number;
  accumulatedPoints: number;
  currentAverage: number;
  minScoreToPass: number | null;
}

interface CourseCardProps {
  course: {
    id: string;
    code: string;
    name: string;
    credits: number;
    tasks: TaskItem[];
    metrics: CourseMetrics;
  };
  onAddTask: (courseId: string, courseName: string) => void;
  onGradeTask: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string, taskTitle: string) => void;
  onDeleteCourse?: (courseId: string, courseName: string) => void;
}

export default function CourseCard({
  course,
  onAddTask,
  onGradeTask,
  onDeleteTask,
  onDeleteCourse,
}: CourseCardProps) {
  const { metrics, tasks } = course;

  const totalPlannedWeight = tasks.reduce((sum, t) => sum + t.weight, 0);
  const weightPercent = Math.min(100, Math.round(totalPlannedWeight * 100));

  const getScoreColor = (avg: number) => {
    if (metrics.evaluatedPercentage === 0) {
      return 'text-zinc-400 dark:text-zinc-500';
    }
    if (avg >= 14) return 'text-emerald-600 dark:text-emerald-400';
    if (avg >= 10.5) return 'text-amber-600 dark:text-amber-400';
    return 'text-[#C8102E] dark:text-rose-400';
  };

  return (
    <article className="group/card bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      {/* Cabecera de Asignatura */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
            {course.credits} créditos
          </span>

          {onDeleteCourse && (
            <button
              type="button"
              onClick={() => onDeleteCourse(course.id, course.name)}
              aria-label={`Eliminar asignatura ${course.name}`}
              title="Eliminar asignatura"
              className="opacity-0 group-hover/card:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-[#C8102E] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-snug line-clamp-2 min-h-[2.75rem]">
          {course.name}
        </h3>

        {/* Métricas de Nota */}
        <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/70 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
              Promedio actual
            </span>
            <p
              className={`text-2xl font-bold font-mono tabular-nums mt-0.5 ${getScoreColor(
                metrics.currentAverage
              )}`}
            >
              {metrics.evaluatedPercentage > 0
                ? metrics.currentAverage.toFixed(2)
                : '—'}
              <span className="text-xs font-normal text-zinc-400 ml-1">/20</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
              Avance evaluado
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">
              {metrics.evaluatedPercentage}
              <span className="text-xs font-normal text-zinc-400 ml-0.5">%</span>
            </p>
          </div>
        </div>

        {/* Barra de Ponderación Planificada */}
        <div className="mt-3.5">
          <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span>Peso planificado</span>
            <span className="font-mono tabular-nums font-medium">
              {weightPercent}% / 100%
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                weightPercent >= 100 ? 'bg-emerald-500' : 'bg-[#C8102E]'
              }`}
              style={{ width: `${weightPercent}%` }}
            />
          </div>
        </div>

        {/* Alerta de nota mínima requerida */}
        {metrics.minScoreToPass !== null && metrics.evaluatedPercentage < 100 && (
          <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-600 dark:text-zinc-400">
              Mínimo para aprobar (10.5):
            </span>
            <span
              className={`font-mono font-bold tabular-nums ${
                metrics.minScoreToPass > 20
                  ? 'text-[#C8102E]'
                  : metrics.minScoreToPass <= 10.5
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {metrics.minScoreToPass > 20
                ? 'Inalcanzable'
                : `${metrics.minScoreToPass.toFixed(1)}`}
            </span>
          </div>
        )}
      </div>

      {/* Lista de Evaluaciones */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-zinc-50/40 dark:bg-zinc-950/30">
        {tasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Sin evaluaciones registradas aún
            </p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {tasks.map((task) => {
              const urgency = getUrgencyBadge(task.dueDate, task.status);
              const isCompleted = task.status === 'COMPLETED';
              return (
                <li
                  key={task.id}
                  className="group/task p-3 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : urgency.isUrgent ? (
                        <AlertCircle className="w-3.5 h-3.5 text-[#C8102E] shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      )}
                      <span
                        className={`text-xs font-semibold truncate ${
                          isCompleted
                            ? 'text-zinc-500 dark:text-zinc-400'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="font-mono tabular-nums font-medium">
                        {Math.round(task.weight * 100)}%
                      </span>
                      <span aria-hidden="true">/</span>
                      <span className="truncate">{formatLimaDate(task.dueDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isCompleted && urgency.isUrgent && (
                      <span className="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-[#C8102E] dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                        {urgency.label}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onGradeTask(task)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold tabular-nums transition-colors cursor-pointer ${
                        task.score !== null
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-950'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#C8102E] hover:text-white'
                      }`}
                    >
                      {task.score !== null ? (
                        task.score.toFixed(1)
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans">
                          <Award className="w-3 h-3" />
                          Nota
                        </span>
                      )}
                    </button>

                    {onDeleteTask && (
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id, task.title)}
                        aria-label={`Eliminar evaluación ${task.title}`}
                        title="Eliminar evaluación"
                        className="opacity-0 group-hover/task:opacity-100 focus:opacity-100 p-1 rounded-md text-zinc-400 hover:text-[#C8102E] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() => onAddTask(course.id, course.name)}
          className="mt-4 w-full py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-[#C8102E] hover:text-[#C8102E] dark:hover:border-rose-400 dark:hover:text-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar evaluación
        </button>
      </div>
    </article>
  );
}
