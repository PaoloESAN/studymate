'use client';

import React, { useEffect, useState } from 'react';
import { X, Award, AlertTriangle } from 'lucide-react';
import { useToast } from '@/app/providers';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  currentScore: number | null;
  onScoreUpdated: () => void;
}

export default function ScoreModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  currentScore,
  onScoreUpdated,
}: ScoreModalProps) {
  const { showToast } = useToast();
  const [score, setScore] = useState<string>(
    currentScore !== null ? String(currentScore) : '16.0'
  );
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

    const numericScore = parseFloat(score);

    if (isNaN(numericScore) || numericScore < 0 || numericScore > 20) {
      setError('La calificación debe estar en la escala vigesimal de 0 a 20.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: numericScore,
          status: 'COMPLETED',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al guardar la calificación.');
        setLoading(false);
        return;
      }

      setLoading(false);
      showToast(`Calificación ${numericScore.toFixed(1)} guardada en ${taskTitle}`);
      onScoreUpdated();
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
        aria-labelledby="score-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/70 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-[#C8102E] dark:text-rose-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h2
              id="score-modal-title"
              className="text-base font-bold text-zinc-900 dark:text-zinc-50"
            >
              Registrar calificación
            </h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Evaluación
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
              {taskTitle}
            </p>
          </div>

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
              htmlFor="score-input"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Nota obtenida (escala 0.0 – 20.0)
            </label>
            <input
              id="score-input"
              type="number"
              step="0.1"
              min="0"
              max="20"
              required
              autoFocus
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full px-4 py-3 text-center text-2xl font-mono font-bold tabular-nums rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
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
              {loading ? 'Guardando...' : 'Guardar nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
