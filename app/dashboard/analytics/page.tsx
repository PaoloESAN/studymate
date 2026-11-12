// app/dashboard/analytics/page.tsx - Dashboard Analítico de Rendimiento Semestral (HU08)
// Criterios de Aceptación: CA-08.1 y CA-08.2
'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { BarChart3, Award, GraduationCap, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { calculateSemesterGPA } from '@/lib/gradeCalculator';

export default function AnalyticsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courses?userId=default-user')
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const gpaData = calculateSemesterGPA(
    courses.map((c) => ({
      credits: c.credits,
      currentAverage: c.metrics?.currentAverage || 0,
      evaluatedPercentage: c.metrics?.evaluatedPercentage || 0,
    }))
  );

  const allTasks = courses.flatMap((c) => c.tasks || []);
  const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED');
  const completionRate = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Métricas Globales (HU08 / CMMI Nivel 2)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Dashboard Analítico de Rendimiento
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Visualización estadística de promedio semestral ponderado por créditos y distribución de actividades.
          </p>
        </div>

        {/* 4 Tarjetas KPI Superiores (CA-08.2) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cursos Registrados</span>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-2">{courses.length}</p>
            <p className="text-xs text-zinc-400 mt-1">100% activos</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Créditos Totales</span>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-2">{gpaData.totalCredits}</p>
            <p className="text-xs text-zinc-400 mt-1">Carga semestral</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Avance de Actividades</span>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{completionRate}%</p>
            <p className="text-xs text-zinc-400 mt-1">{completedTasks.length} de {allTasks.length} listas</p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-xl shadow-red-600/20">
            <span className="text-xs font-bold uppercase tracking-wider text-red-100">Promedio Ponderado Semestral</span>
            <p className="text-4xl font-black mt-2">
              {gpaData.semesterGPA > 0 ? gpaData.semesterGPA.toFixed(2) : '-'}
            </p>
            <p className="text-xs text-red-100 mt-1">Ponderado por créditos (CA-08.1)</p>
          </div>
        </div>

        {/* Desglose por Asignatura */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xs space-y-6">
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
            Desglose Ponderado por Asignatura (Créditos × Promedio)
          </h2>

          <div className="space-y-6">
            {courses.map((course) => {
              const avg = course.metrics?.currentAverage || 0;
              const percent = Math.min(100, Math.round((avg / 20) * 100));

              return (
                <div key={course.id} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                        {course.code}
                      </span>
                      <span className="text-zinc-800 dark:text-zinc-200">{course.name}</span>
                      <span className="text-xs font-normal text-zinc-500">({course.credits} créditos)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-red-600 dark:text-red-400 font-black">
                        {avg > 0 ? avg.toFixed(2) : 'Sin notas'}
                      </span>
                      <span className="text-xs text-zinc-400"> / 20</span>
                    </div>
                  </div>

                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        avg >= 16 ? 'bg-emerald-500' : avg >= 10.5 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
