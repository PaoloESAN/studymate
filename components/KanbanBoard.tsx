'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Filter,
  Award,
  AlertCircle,
  Search,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { getUrgencyBadge, formatLimaDate } from '@/lib/dateAlerts';
import {
  STUDYMATE_UI_COMMAND_EVENT,
  StudyMateUiCommand,
} from '@/lib/webmcp';
import { useToast } from '@/app/providers';

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
  onTasksChanged?: () => void;
}

export default function KanbanBoard({
  initialTasks,
  courses,
  onOpenGradeModal,
  onTasksChanged,
}: KanbanBoardProps) {
  const { showToast } = useToast();
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>
  >({});
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});
  const [selectedCourse, setSelectedCourse] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ALL';
    try {
      const raw = sessionStorage.getItem('studymate_pending_kanban_filter');
      if (raw) {
        const parsed = JSON.parse(raw) as { courseId?: string };
        if (parsed.courseId !== undefined) return parsed.courseId;
      }
    } catch {
      // Ignorar
    }
    return 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = sessionStorage.getItem('studymate_pending_kanban_filter');
      if (raw) {
        const parsed = JSON.parse(raw) as { searchQuery?: string };
        sessionStorage.removeItem('studymate_pending_kanban_filter');
        if (parsed.searchQuery !== undefined) return parsed.searchQuery;
      }
    } catch {
      // Ignorar
    }
    return '';
  });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    const handleUiCommand = (event: Event) => {
      const cmd = (event as CustomEvent<StudyMateUiCommand>).detail;
      if (cmd?.type === 'filter_kanban') {
        if (cmd.courseId !== undefined) setSelectedCourse(cmd.courseId);
        if (cmd.searchQuery !== undefined) setSearchQuery(cmd.searchQuery);
        sessionStorage.removeItem('studymate_pending_kanban_filter');
      }
    };
    window.addEventListener(STUDYMATE_UI_COMMAND_EVENT, handleUiCommand);
    return () =>
      window.removeEventListener(STUDYMATE_UI_COMMAND_EVENT, handleUiCommand);
  }, []);

  const tasks = initialTasks
    .filter((t) => !deletedIds[t.id])
    .map((t) =>
      statusOverrides[t.id] ? { ...t, status: statusOverrides[t.id] } : t
    );

  const filteredTasks = tasks.filter((t) => {
    const matchesCourse =
      selectedCourse === 'ALL' || t.course.id === selectedCourse;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      t.title.toLowerCase().includes(query) ||
      t.course.code.toLowerCase().includes(query) ||
      t.course.name.toLowerCase().includes(query);
    return matchesCourse && matchesQuery;
  });

  const columns: Array<{
    id: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    title: string;
    description: string;
    accent: string;
    badge: string;
  }> = [
    {
      id: 'PENDING',
      title: 'Por hacer',
      description: 'Evaluaciones programadas',
      accent: 'border-t-zinc-400 dark:border-t-zinc-600',
      badge: 'bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
    },
    {
      id: 'IN_PROGRESS',
      title: 'En curso',
      description: 'En desarrollo activo',
      accent: 'border-t-amber-500',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      id: 'COMPLETED',
      title: 'Completado',
      description: 'Entregadas o calificadas',
      accent: 'border-t-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
  ];

  const moveTaskStatus = async (
    taskId: string,
    newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  ) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status === newStatus) return;

    const prevOverride = statusOverrides[taskId];
    setStatusOverrides((prev) => ({ ...prev, [taskId]: newStatus }));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setStatusOverrides((prev) => {
          const next = { ...prev };
          if (prevOverride) next[taskId] = prevOverride;
          else delete next[taskId];
          return next;
        });
        showToast('No se pudo actualizar el estado de la tarea', 'error');
      } else {
        const label =
          newStatus === 'PENDING'
            ? 'Por hacer'
            : newStatus === 'IN_PROGRESS'
              ? 'En curso'
              : 'Completado';
        showToast(`"${target.title}" movida a ${label}`);
      }
    } catch {
      setStatusOverrides((prev) => {
        const next = { ...prev };
        if (prevOverride) next[taskId] = prevOverride;
        else delete next[taskId];
        return next;
      });
      showToast('Error de conexión al mover la tarea', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    setDeletedIds((prev) => ({ ...prev, [taskId]: true }));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        setDeletedIds((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
        showToast('No se pudo eliminar la evaluación', 'error');
        return;
      }
      showToast(`Evaluación "${taskTitle}" eliminada`);
      onTasksChanged?.();
    } catch {
      setDeletedIds((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      showToast('Error de conexión al eliminar', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda y filtro por asignatura */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#111114] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar evaluación o código de curso..."
            aria-label="Buscar evaluaciones"
            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 focus:border-[#C8102E]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Curso:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCourse('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedCourse === 'ALL'
                ? 'bg-[#C8102E] text-white'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            Todas ({tasks.length})
          </button>

          {courses.map((course) => {
            const count = tasks.filter((t) => t.course.id === course.id).length;
            const active = selectedCourse === course.id;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourse(course.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#C8102E] text-white'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {course.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tablero 3 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((col) => {
          const columnTasks = filteredTasks.filter((t) => t.status === col.id);
          const isDropTarget = dragOverColumn === col.id;

          return (
            <section
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverColumn !== col.id) setDragOverColumn(col.id);
              }}
              onDragLeave={() => {
                if (dragOverColumn === col.id) setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const droppedId =
                  e.dataTransfer.getData('text/plain') || draggedTaskId;
                setDragOverColumn(null);
                setDraggedTaskId(null);
                if (droppedId) {
                  moveTaskStatus(droppedId, col.id);
                }
              }}
              className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 border-t-4 ${
                col.accent
              } bg-zinc-50/70 dark:bg-zinc-900/40 p-4 flex flex-col min-h-[460px] transition-all ${
                isDropTarget
                  ? 'ring-2 ring-[#C8102E] bg-rose-50/30 dark:bg-rose-950/10'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                    {col.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {col.description}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tabular-nums ${col.badge}`}
                >
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {columnTasks.length === 0 ? (
                  <div className="h-36 flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl text-xs text-zinc-400 dark:text-zinc-500 text-center px-4">
                    Arrastra una tarjeta aquí o usa las flechas de movimiento
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const urgency = getUrgencyBadge(task.dueDate, task.status);
                    const isDragging = draggedTaskId === task.id;

                    return (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedTaskId(task.id);
                          e.dataTransfer.setData('text/plain', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverColumn(null);
                        }}
                        className={`group p-4 rounded-xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3 cursor-grab active:cursor-grabbing ${
                          isDragging ? 'opacity-50 scale-[0.98]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-[#C8102E] dark:text-rose-400 truncate max-w-[140px]">
                              {task.course.name}
                            </span>
                            <span className="font-mono text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                              {Math.round(task.weight * 100)}%
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {task.status !== 'COMPLETED' && urgency.isUrgent && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-[#C8102E] dark:text-rose-400">
                                <AlertCircle className="w-3 h-3" />
                                {urgency.label}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              aria-label={`Eliminar ${task.title}`}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-zinc-400 hover:text-[#C8102E] transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatLimaDate(task.dueDate)}
                          </span>

                          {task.score !== null ? (
                            <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {task.score.toFixed(1)}/20
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenGradeModal(task)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C8102E] dark:text-rose-400 hover:underline cursor-pointer"
                            >
                              <Award className="w-3 h-3" />
                              Calificar
                            </button>
                          )}
                        </div>

                        {/* Controles rápidos de columna */}
                        <div className="flex items-center justify-between pt-2 gap-2">
                          {col.id !== 'PENDING' ? (
                            <button
                              type="button"
                              onClick={() =>
                                moveTaskStatus(
                                  task.id,
                                  col.id === 'COMPLETED'
                                    ? 'IN_PROGRESS'
                                    : 'PENDING'
                                )
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            >
                              <ArrowLeft className="w-3 h-3" />
                              Retroceder
                            </button>
                          ) : (
                            <span />
                          )}

                          {col.id !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() =>
                                moveTaskStatus(
                                  task.id,
                                  col.id === 'PENDING'
                                    ? 'IN_PROGRESS'
                                    : 'COMPLETED'
                                )
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#C8102E] hover:bg-[#A60D25] text-white transition-colors ml-auto cursor-pointer"
                            >
                              {col.id === 'PENDING' ? 'Iniciar' : 'Completar'}
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
