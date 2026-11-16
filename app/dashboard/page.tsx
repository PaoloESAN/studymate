'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import CourseCard from '@/components/CourseCard';
import TaskModal from '@/components/TaskModal';
import ScoreModal from '@/components/ScoreModal';
import { calculateSemesterGPA } from '@/lib/gradeCalculator';
import { prioritizeStudyTasks } from '@/lib/studyPrioritizer';
import { STUDYMATE_DATA_UPDATED_EVENT } from '@/lib/webmcp';
import { useToast } from '@/app/providers';
import {
  Plus,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Award,
  X,
  AlertCircle,
  BrainCircuit,
  Clock,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  weight: number;
  score: number | null;
  status: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  tasks: Task[];
  metrics: {
    evaluatedPercentage: number;
    accumulatedPoints: number;
    currentAverage: number;
    minScoreToPass: number | null;
  };
}

export default function DashboardPage() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  // Modales
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeCourseForTask, setActiveCourseForTask] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [activeTaskForScore, setActiveTaskForScore] = useState<Task | null>(null);

  // Formulario nuevo curso
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState('4');
  const [courseError, setCourseError] = useState<string | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/courses?userId=default-user');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
        setNow(new Date());
      }
    } catch (err) {
      console.error('Error cargando cursos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/courses?userId=default-user')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setCourses(data);
        setNow(new Date());
      })
      .catch((err) => console.error('Error cargando cursos:', err))
      .finally(() => setLoading(false));

    const handleRefresh = () => {
      fetchCourses();
    };
    window.addEventListener(STUDYMATE_DATA_UPDATED_EVENT, handleRefresh);
    return () =>
      window.removeEventListener(STUDYMATE_DATA_UPDATED_EVENT, handleRefresh);
  }, [fetchCourses]);

  useEffect(() => {
    if (!isCourseModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCourseModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCourseModalOpen]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseError(null);
    setCourseLoading(true);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          credits: parseInt(newCredits, 10),
          userId: 'default-user',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCourseError(data.error || 'Error al registrar la asignatura.');
        setCourseLoading(false);
        return;
      }

      const createdName = newName.trim();
      setNewName('');
      setNewCredits('4');
      setIsCourseModalOpen(false);
      setCourseLoading(false);
      showToast(`Asignatura "${createdName}" registrada`);
      fetchCourses();
    } catch {
      setCourseError('Error de conexión con el servidor.');
      setCourseLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('No se pudo eliminar la evaluación', 'error');
        return;
      }
      showToast(`Evaluación "${taskTitle}" eliminada`);
      fetchCourses();
    } catch {
      showToast('Error de conexión al eliminar', 'error');
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    try {
      const res = await fetch(`/api/courses?id=${encodeURIComponent(courseId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        showToast('No se pudo eliminar la asignatura', 'error');
        return;
      }
      showToast(`Asignatura "${courseName}" eliminada`);
      fetchCourses();
    } catch {
      showToast('Error de conexión al eliminar', 'error');
    }
  };

  const gpaData = calculateSemesterGPA(
    courses.map((c) => ({
      credits: c.credits,
      currentAverage: c.metrics.currentAverage,
      evaluatedPercentage: c.metrics.evaluatedPercentage,
    }))
  );

  const allTasks = courses.flatMap((c) => c.tasks);
  const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED');
  const completionRate =
    allTasks.length > 0
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;
  const studyPriorities = now
    ? prioritizeStudyTasks(courses, now).slice(0, 3)
    : [];

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#09090B]">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Panel académico
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Ciclo 2026-II, Facultad de Ingeniería — Tecnologías de Información
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCourseModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#C8102E] hover:bg-[#A60D25] text-white shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva asignatura</span>
            </button>
          </div>

          {/* Tira KPI */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Asignaturas</span>
                  <BookOpen className="w-4 h-4 text-[#C8102E]" />
                </div>
                <p className="text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 mt-2">
                  {courses.length}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Matriculadas este ciclo
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Créditos</span>
                  <GraduationCap className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 mt-2">
                  {gpaData.totalCredits}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Carga académica total
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Avance de entregas</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 mt-2">
                  {completionRate}%
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  {completedTasks.length} de {allTasks.length} completadas
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#111114] border border-rose-200/80 dark:border-rose-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#C8102E] dark:text-rose-400">
                    Promedio ponderado
                  </span>
                  <Award className="w-4 h-4 text-[#C8102E]" />
                </div>
                <p className="text-3xl font-bold font-mono tabular-nums text-[#C8102E] dark:text-rose-400 mt-2">
                  {gpaData.semesterGPA > 0 ? gpaData.semesterGPA.toFixed(2) : '—'}
                  <span className="text-sm font-normal text-zinc-400 ml-1">/20</span>
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Ponderado por créditos
                </p>
              </div>
            </div>
          )}

          {/* Priorizador Inteligente de Estudio (Modelo ML) */}
          {!loading && studyPriorities.length > 0 && (
            <section className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-[#C8102E] dark:text-rose-400 flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      Qué estudiar hoy
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Ranking por urgencia, peso en la nota y riesgo del curso
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {studyPriorities.map((item, idx) => (
                  <div
                    key={item.taskId}
                    className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-zinc-400">
                          #{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.priorityLevel === 'Crítica'
                              ? 'bg-rose-100 text-[#C8102E] dark:bg-rose-950/60 dark:text-rose-300'
                              : item.priorityLevel === 'Alta'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {item.priorityLevel} · {item.priorityScore}/100
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {item.taskTitle}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {item.courseName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/70 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="truncate">{item.reasons.join(' · ')}</span>
                      <span className="inline-flex items-center gap-1 font-mono font-medium shrink-0 text-zinc-700 dark:text-zinc-300">
                        <Clock className="w-3 h-3" />
                        {item.recommendedMinutes}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Grid de Asignaturas */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Asignaturas matriculadas
              </h2>
              {!loading && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {courses.length} {courses.length === 1 ? 'materia' : 'materias'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-80 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse"
                  />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#111114] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-3">
                <BookOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                  Aún no hay asignaturas registradas
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Registra tus materias del ciclo para organizar evaluaciones y seguir tu promedio ponderado.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#C8102E] hover:bg-[#A60D25] text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar primera asignatura
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onAddTask={(id, name) => {
                      setActiveCourseForTask({ id, name });
                      setIsTaskModalOpen(true);
                    }}
                    onGradeTask={(task) => {
                      setActiveTaskForScore(task);
                      setIsScoreModalOpen(true);
                    }}
                    onDeleteTask={handleDeleteTask}
                    onDeleteCourse={handleDeleteCourse}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        {/* Modal para Crear Asignatura */}
        {isCourseModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={() => setIsCourseModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="course-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/70 dark:bg-zinc-900/60">
                <h2
                  id="course-modal-title"
                  className="text-base font-bold text-zinc-900 dark:text-zinc-50"
                >
                  Registrar asignatura
                </h2>
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  aria-label="Cerrar diálogo"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
                {courseError && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#C8102E]" />
                    <span>{courseError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="course-name"
                    className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Nombre de la asignatura
                  </label>
                  <input
                    id="course-name"
                    type="text"
                    required
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej. Calidad de Software"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="course-credits"
                    className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Créditos académicos
                  </label>
                  <input
                    id="course-credits"
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newCredits}
                    onChange={(e) => setNewCredits(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
                  />
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCourseModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={courseLoading}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#C8102E] hover:bg-[#A60D25] text-white disabled:opacity-50 cursor-pointer"
                  >
                    {courseLoading ? 'Guardando...' : 'Guardar asignatura'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para Agregar Evaluación */}
        {activeCourseForTask && (
          <TaskModal
            isOpen={isTaskModalOpen}
            onClose={() => {
              setIsTaskModalOpen(false);
              setActiveCourseForTask(null);
            }}
            courseId={activeCourseForTask.id}
            courseName={activeCourseForTask.name}
            onTaskCreated={fetchCourses}
          />
        )}

        {/* Modal para Calificar Evaluación */}
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
            onScoreUpdated={fetchCourses}
          />
        )}
      </div>
    </AuthGuard>
  );
}
