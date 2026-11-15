export interface PrioritizableTask {
  id: string;
  title: string;
  dueDate: string | Date;
  weight: number;
  status: string;
  score: number | null;
}

export interface PrioritizableCourse {
  id: string;
  name: string;
  credits: number;
  tasks: PrioritizableTask[];
  metrics: {
    currentAverage: number;
    evaluatedPercentage: number;
    minScoreToPass: number | null;
  };
}

export interface StudyRecommendation {
  taskId: string;
  taskTitle: string;
  courseId: string;
  courseName: string;
  weightPercent: number;
  priorityScore: number;
  priorityLevel: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  recommendedMinutes: number;
  hoursRemaining: number;
  reasons: string[];
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Modelo de scoring multi-factor para priorizar qué evaluación estudiar primero.
 * Combina urgencia temporal (decaimiento exponencial), impacto ponderado (peso * créditos),
 * riesgo académico del curso (distancia al umbral 10.5) y estado de avance.
 */
export function prioritizeStudyTasks(
  courses: PrioritizableCourse[],
  now: Date = new Date()
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];

  for (const course of courses) {
    const creditFactor = Math.min(1, Math.max(0.2, course.credits / 5));

    // Riesgo académico del curso: aumenta si el promedio está bajo 12 o minScoreToPass es alto
    let courseRisk = 0.25;
    if (course.metrics.evaluatedPercentage > 0) {
      const gapFromPassing = 12.5 - course.metrics.currentAverage;
      courseRisk = sigmoid(gapFromPassing * 0.6);
    }
    if (
      course.metrics.minScoreToPass !== null &&
      course.metrics.minScoreToPass > 12
    ) {
      courseRisk = Math.max(courseRisk, Math.min(1, course.metrics.minScoreToPass / 18));
    }

    for (const task of course.tasks) {
      if (task.status === 'COMPLETED' || task.score !== null) {
        continue;
      }

      const due = new Date(task.dueDate);
      const hoursRemaining = Math.round(
        (due.getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      // Urgencia temporal: vencido o < 24h -> 1.0, decae suavemente hasta 14 días
      let urgency = 0.1;
      if (hoursRemaining <= 0) {
        urgency = 1.0;
      } else if (hoursRemaining <= 48) {
        urgency = 0.85 + 0.15 * (1 - hoursRemaining / 48);
      } else {
        urgency = Math.exp(-hoursRemaining / 140);
      }

      // Impacto en la nota final ponderada por créditos
      const impact = Math.min(1, task.weight * 2.2 * (0.6 + 0.4 * creditFactor));

      // Impulso si la tarea ya está en curso
      const momentum = task.status === 'IN_PROGRESS' ? 0.12 : 0;

      // Combinación lineal calibrada (pesos del modelo)
      const rawScore =
        0.42 * urgency +
        0.34 * impact +
        0.24 * courseRisk +
        momentum;

      const priorityScore = Math.min(99, Math.max(5, Math.round(rawScore * 100)));

      let priorityLevel: StudyRecommendation['priorityLevel'] = 'Baja';
      if (priorityScore >= 75) priorityLevel = 'Crítica';
      else if (priorityScore >= 55) priorityLevel = 'Alta';
      else if (priorityScore >= 35) priorityLevel = 'Media';

      const weightPercent = Math.round(task.weight * 100);
      const recommendedMinutes = Math.min(
        180,
        Math.max(30, Math.round((30 + weightPercent * 2.5 + urgency * 45) / 15) * 15)
      );

      const reasons: string[] = [];
      if (hoursRemaining <= 0) {
        reasons.push('Entrega vencida');
      } else if (hoursRemaining <= 48) {
        reasons.push(`Vence en ${hoursRemaining} h`);
      } else {
        const days = Math.ceil(hoursRemaining / 24);
        reasons.push(`Faltan ${days} d`);
      }

      if (weightPercent >= 25) {
        reasons.push(`Alto peso (${weightPercent}%)`);
      } else {
        reasons.push(`Peso ${weightPercent}%`);
      }

      if (courseRisk >= 0.65) {
        reasons.push('Curso en riesgo');
      }

      recommendations.push({
        taskId: task.id,
        taskTitle: task.title,
        courseId: course.id,
        courseName: course.name,
        weightPercent,
        priorityScore,
        priorityLevel,
        recommendedMinutes,
        hoursRemaining,
        reasons,
      });
    }
  }

  return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
}
