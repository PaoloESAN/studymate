// lib/dateAlerts.ts - Motor de semáforo de urgencia y formato horario para StudyMate (HU07)
// Mitiga BUG-06 (normalización a zona horaria 'America/Lima' GMT-5 para evitar desfase de fechas)

export interface UrgencyBadge {
  label: string;
  severity: 'CRITICAL' | 'WARNING' | 'NORMAL' | 'COMPLETED';
  color: string;
  isUrgent: boolean;
  hoursRemaining: number;
}

/**
 * Determina el nivel de urgencia de una tarea según su fecha de vencimiento (HU07 / CA-07.1)
 */
export function getUrgencyBadge(dueDate: Date | string, status: string): UrgencyBadge {
  if (status === 'COMPLETED') {
    return {
      label: 'Completado',
      severity: 'COMPLETED',
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300',
      isUrgent: false,
      hoursRemaining: 0,
    };
  }

  const targetDate = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));

  if (hoursRemaining < 0) {
    return {
      label: '¡Vencido!',
      severity: 'CRITICAL',
      color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-400 font-bold',
      isUrgent: true,
      hoursRemaining,
    };
  }

  if (hoursRemaining <= 48) {
    return {
      label: '¡Vence Pronto! (< 48h)',
      severity: 'CRITICAL',
      color: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-500 font-bold animate-pulse',
      isUrgent: true,
      hoursRemaining,
    };
  }

  if (hoursRemaining <= 120) {
    // Menor o igual a 5 días
    return {
      label: `En ${Math.ceil(hoursRemaining / 24)} días`,
      severity: 'WARNING',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300',
      isUrgent: false,
      hoursRemaining,
    };
  }

  return {
    label: 'A tiempo',
    severity: 'NORMAL',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200',
    isUrgent: false,
    hoursRemaining,
  };
}

/**
 * Formatea fechas garantizando la hora de Lima (BUG-06)
 */
export function formatLimaDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}
