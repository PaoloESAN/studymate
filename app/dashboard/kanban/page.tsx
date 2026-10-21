// app/dashboard/kanban/page.tsx - Vista de Tablero Kanban Interactivo (HU04 / HU07)
// Genera la evidencia para FOTO 17 (Tablero con columnas Por Hacer, En Curso, Completado)
'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KanbanBoard, { KanbanTask } from '@/components/KanbanBoard';
import ScoreModal from '@/components/ScoreModal';
import { Kanban, Sparkles } from 'lucide-react';

export default function KanbanPage() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedTaskForScore, setSelectedTaskForScore] = useState<KanbanTask | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/courses?userId=default-user');
      if (res.ok) {
        const coursesData = await res.json();
        setCourses(
          coursesData.map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
          }))
        );

        // Aplanar todas las tareas vinculadas a su respectivo curso
        const flattenedTasks: KanbanTask[] = coursesData.flatMap((c: any) =>
          (c.tasks || []).map((t: any) => ({
            ...t,
            course: {
              id: c.id,
              code: c.code,
              name: c.name,
            },
          }))
        );

        setTasks(flattenedTasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Kanban className="w-4 h-4" />
              <span>Flujo de Trabajo Ágil (Scrum / CMMI Nivel 2)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Tablero Kanban de Actividades
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Monitorea el ciclo de vida de tus entregables y la urgencia de fechas límite.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-zinc-400 text-sm">
            Cargando tablero y actividades...
          </div>
        ) : (
          <KanbanBoard
            initialTasks={tasks}
            courses={courses}
            onOpenGradeModal={(task) => {
              setSelectedTaskForScore(task);
              setIsScoreModalOpen(true);
            }}
          />
        )}
      </main>

      {selectedTaskForScore && (
        <ScoreModal
          isOpen={isScoreModalOpen}
          onClose={() => {
            setIsScoreModalOpen(false);
            setSelectedTaskForScore(null);
          }}
          taskId={selectedTaskForScore.id}
          taskTitle={selectedTaskForScore.title}
          currentScore={selectedTaskForScore.score}
          onScoreUpdated={loadData}
        />
      )}
    </div>
  );
}
