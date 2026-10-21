// components/TaskModal.tsx - Modal de Creación de Tareas con Validación de Ponderación (HU03)
// Genera la evidencia para FOTO 3 (Validación 422 de ponderación)
'use client';

import React, { useState } from 'react';
import { X, Calendar, Percent, FileText, AlertTriangle } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [weight, setWeight] = useState('0.30');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericWeight = parseFloat(weight);

    // Validación preventiva en cliente y envío a la API para validación HTTP 422
    if (isNaN(numericWeight) || numericWeight <= 0 || numericWeight > 1.0) {
      setError('La ponderación (weight) debe ser mayor a 0 y menor o igual a 1.0.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          dueDate,
          weight: numericWeight,
          courseId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear la tarea académica.');
        setLoading(false);
        return;
      }

      // Éxito
      setTitle('');
      setDescription('');
      setDueDate('');
      setWeight('0.30');
      setLoading(false);
      onTaskCreated();
      onClose();
    } catch (err) {
      setError('Error de conexión con el servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Nueva Tarea o Evaluación Académica
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Asignatura: <span className="font-semibold text-red-600 dark:text-red-400">{courseName}</span>
            </p>
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
          {/* Mensaje de Error en Rojo (Evidencia FOTO 3) */}
          {error && (
            <div
              id="weight-error-alert"
              className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 flex items-start gap-3 text-red-700 dark:text-red-300 animate-in slide-in-from-top-1"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div className="text-xs">
                <p className="font-bold">Error de Validación (HTTP 422):</p>
                <p className="font-medium mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Título de la Evaluación *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Avance Integrador CMMI"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Descripción o Criterios
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Implementación de PAs de CMMI y pruebas unitarias"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Fecha Límite *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Ponderación (0.01 - 1.00) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.30"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-zinc-400">
                  {Math.round((parseFloat(weight) || 0) * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Ej: 0.30 equivale al 30% del curso.
              </p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
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
              {loading ? 'Guardando...' : 'Registrar Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
