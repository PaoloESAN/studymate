// lib/gradeCalculator.ts - Algoritmo de cálculo de notas ponderadas y proyección de rendimiento
// Mitiga BUG-03 (precisión de punto flotante) y BUG-05 (división entre cero cuando no hay evaluaciones)

export interface TaskGrade {
  weight: number; // 0.01 a 1.00
  score: number | null; // Escala vigesimal 0 a 20
}

export interface CourseMetrics {
  evaluatedPercentage: number;  // Porcentaje del curso ya calificado (0 a 100)
  accumulatedPoints: number;    // Puntos acumulados ganados sobre 20 (ej: 8.40)
  currentAverage: number;       // Promedio relativo actual sobre lo evaluado (ej: 16.80)
  minScoreToPass: number;       // Nota mínima requerida en el % restante para aprobar con 10.5
}

/**
 * Calcula las métricas ponderadas de una asignatura universitaria (HU05 / CA-05.1 y CA-05.2)
 */
export function calculateCourseMetrics(tasks: TaskGrade[]): CourseMetrics {
  let evaluatedWeight = 0;
  let weightedSum = 0;

  for (const t of tasks) {
    if (t.score !== null && t.score !== undefined) {
      evaluatedWeight += t.weight;
      weightedSum += t.weight * t.score;
    }
  }

  // Mitigación BUG-03: Redondeo seguro para evitar imprecisiones de coma flotante IEEE 754
  evaluatedWeight = Math.round(evaluatedWeight * 10000) / 10000;
  weightedSum = Math.round(weightedSum * 10000) / 10000;

  // Mitigación BUG-05: Si el peso evaluado es 0, no dividir entre 0; retornar 0.00
  const currentAverage = evaluatedWeight > 0 ? weightedSum / evaluatedWeight : 0;
  const remainingWeight = Math.max(0, Math.round((1 - evaluatedWeight) * 10000) / 10000);

  // Nota mínima en el resto del curso para alcanzar el 10.5 aprobatorio
  let minScoreToPass = 0;
  if (remainingWeight > 0) {
    const requiredTotal = 10.5 - weightedSum;
    minScoreToPass = requiredTotal > 0 ? requiredTotal / remainingWeight : 0;
  }

  return {
    evaluatedPercentage: Math.round(evaluatedWeight * 100),
    accumulatedPoints: Number(weightedSum.toFixed(2)),
    currentAverage: Number(currentAverage.toFixed(2)),
    minScoreToPass: Number(minScoreToPass.toFixed(2)),
  };
}

/**
 * Valida la coherencia del peso de una nueva tarea en el curso (HU03 / CA-03.2 y CA-03.3)
 */
export function validateTaskWeight(
  newWeight: number,
  existingTasks: Array<{ weight: number }>
): { valid: boolean; error?: string; projectedWeight?: number } {
  if (isNaN(newWeight) || newWeight <= 0 || newWeight > 1.0) {
    return {
      valid: false,
      error: 'La ponderación (weight) debe ser mayor a 0 y menor o igual a 1.0.',
    };
  }

  const currentTotal = existingTasks.reduce((acc, t) => acc + t.weight, 0);
  const projected = Math.round((currentTotal + newWeight) * 10000) / 10000;

  if (projected > 1.0) {
    const currentPercent = Math.round(currentTotal * 100);
    return {
      valid: false,
      error: `La ponderación total del curso superaría el 100% (actual acumulado: ${currentPercent}%).`,
      projectedWeight: projected,
    };
  }

  return { valid: true, projectedWeight: projected };
}

/**
 * Calcula el promedio semestral ponderado global por créditos académicos (HU08 / CA-08.1)
 */
export function calculateSemesterGPA(
  courses: Array<{ credits: number; currentAverage: number; evaluatedPercentage: number }>
): { totalCredits: number; semesterGPA: number } {
  const eligibleCourses = courses.filter((c) => c.evaluatedPercentage > 0);
  if (eligibleCourses.length === 0) {
    const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
    return { totalCredits, semesterGPA: 0.0 };
  }

  let totalCreditPoints = 0;
  let evaluatedCredits = 0;

  for (const c of eligibleCourses) {
    totalCreditPoints += c.credits * c.currentAverage;
    evaluatedCredits += c.credits;
  }

  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  const semesterGPA = evaluatedCredits > 0 ? totalCreditPoints / evaluatedCredits : 0;

  return {
    totalCredits,
    semesterGPA: Number(semesterGPA.toFixed(2)),
  };
}
