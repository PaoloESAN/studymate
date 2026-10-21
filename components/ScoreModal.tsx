// components/ScoreModal.tsx - Modal de Registro de Calificaciones Vigesimales (0 a 20) (HU06)
// Criterios de Aceptación: CA-06.1 y CA-06.2
'use client';

import React, { useState } from 'react';
import { X, Award, AlertTriangle } from 'lucide-react';

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
  const [score, setScore] = useState<string>(currentScore !== null ? String(currentScore) : '17.0');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericScore = parseFloat(score);

    // CA-06.2: Validación estricta de escala vigesimal 0 a 20
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
          status: 'COMPLETED', // Al calificar una tarea, pasa automáticamente a COMPLETED (CA-04.3)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al guardar la calificación.');
        setLoading(false);
        return;
      }

      setLoading(false);
      onScoreUpdated();
      onClose();
    } catch (err) {
      setError('Error de conexión con el servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Registrar Calificación
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Evaluación:</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{taskTitle}</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nota Obtenida (Escala 0 a 20) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                required
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="17.0"
                className="w-full px-4 py-3 text-xl font-extrabold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="absolute right-4 top-3.5 text-sm font-bold text-zinc-400">
                / 20
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Nota aprobatoria mínima en ESAN: 10.5
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Guardando...' : 'Guardar Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
