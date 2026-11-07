// components/KanbanBoard.tsx - Tablero Kanban Interactivo de 3 Columnas (HU04 / HU07)
// Mitiga BUG-04 (implementación de Optimistic UI Update para eliminar latencia visual)
'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Filter, 
  Award,
  AlertCircle 
} from 'lucide-react';
import { getUrgencyBadge, formatLimaDate } from '@/lib/dateAlerts';

export interface KanbanTask {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  weight: number;
  score: number | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  course: {
    id: string;
    code: string;
    name: string;
  };
}

interface KanbanBoardProps {
  initialTasks: KanbanTask[];
  courses: Array<{ id: string; code: string; name: string }>;
  onOpenGradeModal: (task: KanbanTask) => void;
}

export default function KanbanBoard({
  initialTasks,
  courses,
  onOpenGradeModal,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [isUpdating, setIsUpdating] = useState(false);

  // CA-07.2: Filtrado reactivo por curso sin recargar la página
  const filteredTasks = selectedCourse === 'ALL'
    ? tasks
    : tasks.filter((t) => t.course.id === selectedCourse);

  const columns: Array<{
    id: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    title: string;
    description: string;
    color: string;
    badgeColor: string;
  }> = [
    {
      id: 'PENDING',
      title: 'Por Hacer',
      description: 'Actividades programadas',
      color: 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40',
      badgeColor: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
    },
    {
      id: 'IN_PROGRESS',
      title: 'En Curso',
      description: 'En desarrollo activo',
      color: 'border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
    },
    {
      id: 'COMPLETED',
      title: 'Completado',
      description: 'Listas para calificar o evaluadas',
      color: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    },
  ];

  // Mitigación BUG-04 / CA-04.2: Actualización Optimista de Estado en React (< 10ms visual)
  const moveTaskStatus = async (taskId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    const previousTasks = [...tasks];

    // 1. Actualización inmediata en UI
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // 2. Persistencia en base de datos PostgreSQL
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Reversión automática en caso de fallo
        setTasks(previousTasks);
        alert('No se pudo actualizar el estado en el servidor. Revirtiendo.');
      }
    } catch (err) {
      setTasks(previousTasks);
      alert('Error de red al actualizar la tarea.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtro por Curso (HU07 / CA-07.2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Filtrar por Asignatura:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCourse('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedCourse === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            Todas ({tasks.length})
          </button>
          {courses.map((course) => {
            const count = tasks.filter((t) => t.course.id === course.id).length;
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCourse === course.id
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                {course.code} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Las 3 Columnas del Tablero Kanban (HU04 / CA-04.1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.color} p-4 flex flex-col min-h-[500px] shadow-xs`}
            >
              {/* Cabecera de Columna */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {col.title}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeColor}`}>
                      {colTasks.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{col.description}</p>
                </div>
              </div>

              {/* Lista de Tarjetas */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-xs text-zinc-400 italic">
                    Sin tareas en este estado
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const badge = getUrgencyBadge(task.dueDate, task.status);

                    return (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                      >
                        <div>
                          {/* Badges superiores: Curso y Semáforo de Urgencia (HU07) */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                              {task.course.code}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Metadatos: Ponderación y Fecha Límite */}
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between text-xs text-zinc-500">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            Peso: {(task.weight * 100).toFixed(0)}%
                          </span>
                          <span>Vence: {formatLimaDate(task.dueDate)}</span>
                        </div>

                        {/* Controles de Transición de Estados en un Clic (CA-04.2) */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          {col.id === 'PENDING' && (
                            <button
                              onClick={() => moveTaskStatus(task.id, 'IN_PROGRESS')}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                            >
                              <span>Iniciar</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {col.id === 'IN_PROGRESS' && (
                            <>
                              <button
                                onClick={() => moveTaskStatus(task.id, 'PENDING')}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-colors"
                              >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Regresar</span>
                              </button>
                              <button
                                onClick={() => moveTaskStatus(task.id, 'COMPLETED')}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              >
                                <span>Terminar</span>
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                            </>
                          )}

                          {col.id === 'COMPLETED' && (
                            <div className="w-full flex items-center justify-between gap-2">
                              <button
                                onClick={() => moveTaskStatus(task.id, 'IN_PROGRESS')}
                                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>

                              {task.score !== null ? (
                                <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 font-extrabold text-xs">
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Nota: {task.score.toFixed(1)} / 20</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => onOpenGradeModal(task)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Registrar Nota</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
