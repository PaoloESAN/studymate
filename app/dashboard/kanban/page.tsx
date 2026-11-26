'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import KanbanBoard, { KanbanTask } from '@/components/KanbanBoard';
import ScoreModal from '@/components/ScoreModal';
import { STUDYMATE_DATA_UPDATED_EVENT } from '@/lib/webmcp';
import { getStoredUserId } from '@/lib/authClient';

interface RawCourse {
  id: string;
  code: string;
  name: string;
  tasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    dueDate: string;
    weight: number;
    score: number | null;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  }>;
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [courses, setCourses] = useState<
    Array<{ id: string; code: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskForScore, setActiveTaskForScore] =
    useState<KanbanTask | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const fetchBoardData = useCallback(async () => {
    const userId = getStoredUserId();
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/courses?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data: RawCourse[] = await res.json();
        setCourses(
          data.map((c) => ({ id: c.id, code: c.code, name: c.name }))
        );

        const flatTasks: KanbanTask[] = data.flatMap((course) =>
          course.tasks.map((t) => ({
            ...t,
            course: { id: course.id, code: course.code, name: course.name },
          }))
        );
        setTasks(flatTasks);
      }
    } catch (err) {
      console.error('Error cargando Kanban:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userId = getStoredUserId();
    if (!userId) return;
    fetch(`/api/courses?userId=${encodeURIComponent(userId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RawCourse[]) => {
        setCourses(
          data.map((c) => ({ id: c.id, code: c.code, name: c.name }))
        );
        const flatTasks: KanbanTask[] = data.flatMap((course) =>
          course.tasks.map((t) => ({
            ...t,
            course: { id: course.id, code: course.code, name: course.name },
          }))
        );
        setTasks(flatTasks);
      })
      .catch((err) => console.error('Error cargando Kanban:', err))
      .finally(() => setLoading(false));

    const handleRefresh = () => {
      fetchBoardData();
    };
    window.addEventListener(STUDYMATE_DATA_UPDATED_EVENT, handleRefresh);
    return () =>
      window.removeEventListener(STUDYMATE_DATA_UPDATED_EVENT, handleRefresh);
  }, [fetchBoardData]);

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#09090B]">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Tablero de evaluaciones
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Organiza tus entregas arrastrando las tarjetas entre columnas o filtrando por asignatura.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <KanbanBoard
              initialTasks={tasks}
              courses={courses}
              onOpenGradeModal={(task) => {
                setActiveTaskForScore(task);
                setIsScoreModalOpen(true);
              }}
              onTasksChanged={fetchBoardData}
            />
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
            onScoreUpdated={fetchBoardData}
          />
        )}
      </div>
    </AuthGuard>
  );
}
