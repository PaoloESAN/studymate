'use client';

import React, { useEffect, useState } from 'react';
import { X, Calendar, Percent, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/app/providers';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  onTaskCreated: () => void;
}

export default function TaskModal({
  isOpen,
  onClose,
  courseId,
  courseName,
  onTaskCreated,
}: TaskModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [weight, setWeight] = useState('0.20');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericWeight = parseFloat(weight);

    if (isNaN(numericWeight) || numericWeight <= 0 || numericWeight > 1.0) {
      setError('La ponderación debe ser mayor a 0 y menor o igual a 1.0.');
      return;
    }

    setLoading(true);

    try {
      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        setError('La fecha de entrega ingresada no es válida.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          dueDate: parsedDueDate.toISOString(),
          weight: numericWeight,
          courseId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear la evaluación.');
        setLoading(false);
        return;
      }

      const createdTitle = title;
      setTitle('');
      setDescription('');
      setDueDate('');
      setWeight('0.20');
      setLoading(false);
      showToast(`Evaluación "${createdTitle}" agregada a ${courseName}`);
      onTaskCreated();
      onClose();
    } catch {
      setError('Error de conexión con el servidor.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/70 dark:bg-zinc-900/60">
          <div>
            <h2
              id="task-modal-title"
              className="text-base font-bold text-zinc-900 dark:text-zinc-50"
            >
              Nueva evaluación académica
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Asignatura:{' '}
              <span className="font-semibold text-[#C8102E] dark:text-rose-400">
                {courseName}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diálogo"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C8102E]" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Título de la evaluación
            </label>
            <input
              id="task-title"
              type="text"
              required
              autoFocus
              placeholder="Ej. Práctica Calificada 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-due-date"
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Fecha de entrega
              </label>
              <input
                id="task-due-date"
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
              />
            </div>

            <div>
              <label
                htmlFor="task-weight"
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                <Percent className="w-3.5 h-3.5 text-zinc-400" />
                Peso (0.01 a 1.00)
              </label>
              <input
                id="task-weight"
                type="number"
                step="0.01"
                min="0.01"
                max="1.00"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Notas adicionales (opcional)
            </label>
            <textarea
              id="task-description"
              rows={2}
              placeholder="Temario, modalidad o criterios de entrega..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#C8102E] hover:bg-[#A60D25] text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Crear evaluación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
