// app/dashboard/page.tsx - Dashboard de Asignaturas y KPIs Semestrales (HU02 / HU08)
// Genera la evidencia para FOTO 15 (Dashboard con cursos reales de ESAN y métricas)
'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CourseCard from '@/components/CourseCard';
import TaskModal from '@/components/TaskModal';
import ScoreModal from '@/components/ScoreModal';
import { 
  Plus, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  GraduationCap, 
  TrendingUp, 
  X, 
  Sparkles,
  AlertCircle 
} from 'lucide-react';
import { calculateSemesterGPA } from '@/lib/gradeCalculator';

export default function DashboardPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de modales
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeCourseForTask, setActiveCourseForTask] = useState<{ id: string; name: string } | null>(null);

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [activeTaskForScore, setActiveTaskForScore] = useState<any | null>(null);

  // Formulario nuevo curso
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState('4');
  const [courseError, setCourseError] = useState<string | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);

  // Cargar cursos
  const fetchCourses = async () => {
    try {
      // Usar userId por defecto o simulación
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
    fetchCourses();
  }, []);

  // Creación de Nuevo Curso (HU02 / CA-02.1 y CA-02.2)
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseError(null);

    const creditsInt = parseInt(newCredits, 10);
    if (isNaN(creditsInt) || creditsInt <= 0) {
      setCourseError('El número de créditos debe ser un entero mayor a 0.');
      return;
    }

    setCourseLoading(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          name: newName,
          credits: creditsInt,
          userId: 'default-user',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCourseError(data.error || 'Error al crear la asignatura.');
        setCourseLoading(false);
        return;
      }

      setNewCode('');
      setNewName('');
      setNewCredits('4');
      setIsCourseModalOpen(false);
      setCourseLoading(false);
      fetchCourses();
    } catch (err) {
      setCourseError('Error de red al crear curso.');
      setCourseLoading(false);
    }
  };

  // Cálculos globales para los 4 KPIs (HU08 / CA-08.2)
  const allTasks = courses.flatMap((c) => c.tasks || []);
  const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED');
  const completionRate = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

  const gpaData = calculateSemesterGPA(
    courses.map((c) => ({
      credits: c.credits,
      currentAverage: c.metrics?.currentAverage || 0,
      evaluatedPercentage: c.metrics?.evaluatedPercentage || 0,
    }))
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera y Bienvenida */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Panel Académico Universitario
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Ciclo 2026-II • Facultad de Ingeniería • Carrera de Tecnologías de Información
            </p>
          </div>

          <button
            onClick={() => setIsCourseModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Asignatura</span>
          </button>
        </div>

        {/* 4 Tarjetas KPI Superiores (HU08 / CA-08.2) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Cursos</span>
              <BookOpen className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
              {courses.length}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Inscritos este ciclo</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Créditos</span>
              <GraduationCap className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
              {gpaData.totalCredits}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Carga académica total</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Avance de Tareas</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
              {completionRate}%
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {completedTasks.length} de {allTasks.length} completadas
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 shadow-xs bg-gradient-to-br from-white to-red-50/30 dark:from-zinc-900 dark:to-red-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">Promedio Semestral</span>
              <Award className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-black text-red-600 dark:text-red-500 mt-2">
              {gpaData.semesterGPA > 0 ? gpaData.semesterGPA.toFixed(2) : '-'} <span className="text-sm font-normal text-zinc-400">/20</span>
            </p>
            <p className="text-xs text-zinc-400 mt-1">Ponderado por créditos (GPA)</p>
          </div>
        </div>

        {/* Grid de Asignaturas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Asignaturas Matriculadas
            </h2>
            <span className="text-xs text-zinc-500">Mostrando {courses.length} materias</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-zinc-400 text-sm">Cargando cursos académicos...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-3">
              <BookOpen className="w-12 h-12 text-zinc-300 mx-auto" />
              <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">No hay cursos registrados</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Registra tus materias del ciclo para comenzar a controlar tus tareas y notas ponderadas.
              </p>
              <button
                onClick={() => setIsCourseModalOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white"
              >
                + Registrar Primer Curso
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
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal para Crear Asignatura */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Registrar Asignatura</h2>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              {courseError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{courseError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">Código del Curso *</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Ej: IS-402"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">Nombre del Curso *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Calidad de Software"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">Número de Créditos *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={newCredits}
                  onChange={(e) => setNewCredits(e.target.value)}
                  placeholder="4"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={courseLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {courseLoading ? 'Guardando...' : 'Guardar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Agregar Tarea */}
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

      {/* Modal para Calificar Tarea */}
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
          onScoreUpdated={fetchCourses}
        />
      )}
    </div>
  );
}
