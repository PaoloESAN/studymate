import { calculateSemesterGPA } from '@/lib/gradeCalculator';

export interface WebMcpToolSchema {
  type: 'object';
  properties: Record<
    string,
    {
      type: 'string' | 'number' | 'integer' | 'boolean';
      description: string;
      enum?: string[];
    }
  >;
  required?: string[];
}

export interface StudyMateToolDefinition {
  name: string;
  description: string;
  inputSchema: WebMcpToolSchema;
  readOnlyHint?: boolean;
  execute: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

interface ApiTask {
  id: string;
  title: string;
  weight: number;
  score: number | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
}

interface ApiCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  tasks: ApiTask[];
  metrics: {
    evaluatedPercentage: number;
    accumulatedPoints: number;
    currentAverage: number;
    minScoreToPass: number | null;
  };
}

interface BrowserModelContext {
  registerTool?: (tool: {
    name: string;
    description: string;
    inputSchema: WebMcpToolSchema;
    annotations?: { readOnlyHint?: boolean };
    execute: (args: Record<string, unknown>) => Promise<unknown>;
  }) => unknown;
}

export const STUDYMATE_DATA_UPDATED_EVENT = 'studymate:data-updated';

function notifyDataUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STUDYMATE_DATA_UPDATED_EVENT));
  }
}

async function fetchCoursesList(): Promise<ApiCourse[]> {
  const res = await fetch('/api/courses?userId=default-user');
  if (!res.ok) throw new Error('No se pudieron obtener las asignaturas.');
  return (await res.json()) as ApiCourse[];
}

function findCourse(courses: ApiCourse[], query: string): ApiCourse | undefined {
  const q = query.trim().toLowerCase();
  return courses.find(
    (c) =>
      c.id === query ||
      c.code.toLowerCase() === q ||
      c.name.toLowerCase().includes(q)
  );
}

function findTask(
  courses: ApiCourse[],
  query: string
): { course: ApiCourse; task: ApiTask } | undefined {
  const q = query.trim().toLowerCase();
  for (const course of courses) {
    const exact = course.tasks.find(
      (t) => t.id === query || t.title.toLowerCase() === q
    );
    if (exact) return { course, task: exact };
  }
  for (const course of courses) {
    const partial = course.tasks.find((t) =>
      t.title.toLowerCase().includes(q)
    );
    if (partial) return { course, task: partial };
  }
  return undefined;
}

export function createStudyMateTools(
  navigate: (path: string) => void
): StudyMateToolDefinition[] {
  return [
    {
      name: 'list_courses',
      description:
        'Lista todas las asignaturas matriculadas con su código, créditos, promedio actual, avance evaluado y lista de tareas/evaluaciones.',
      readOnlyHint: true,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      execute: async () => {
        const courses = await fetchCoursesList();
        return {
          totalCourses: courses.length,
          courses: courses.map((c) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            credits: c.credits,
            currentAverage: c.metrics.currentAverage,
            evaluatedPercentage: c.metrics.evaluatedPercentage,
            minScoreToPass: c.metrics.minScoreToPass,
            tasks: c.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              weightPercent: Math.round(t.weight * 100),
              score: t.score,
              status: t.status,
              dueDate: t.dueDate,
            })),
          })),
        };
      },
    },
    {
      name: 'get_academic_summary',
      description:
        'Obtiene el resumen general del ciclo: promedio ponderado semestral (GPA), total de créditos y porcentaje de entregas completadas.',
      readOnlyHint: true,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      execute: async () => {
        const courses = await fetchCoursesList();
        const gpa = calculateSemesterGPA(
          courses.map((c) => ({
            credits: c.credits,
            currentAverage: c.metrics.currentAverage,
            evaluatedPercentage: c.metrics.evaluatedPercentage,
          }))
        );
        const allTasks = courses.flatMap((c) => c.tasks);
        const completed = allTasks.filter((t) => t.status === 'COMPLETED').length;
        return {
          semesterGPA: gpa.semesterGPA,
          totalCredits: gpa.totalCredits,
          totalCourses: courses.length,
          completedTasks: completed,
          totalTasks: allTasks.length,
        };
      },
    },
    {
      name: 'create_course',
      description:
        'Registra una nueva asignatura universitaria en el ciclo actual.',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Código del curso, por ejemplo IS-410',
          },
          name: {
            type: 'string',
            description: 'Nombre completo de la asignatura',
          },
          credits: {
            type: 'integer',
            description: 'Número de créditos académicos (entre 1 y 10)',
          },
        },
        required: ['code', 'name', 'credits'],
      },
      execute: async (args) => {
        const res = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: String(args.code || '').trim().toUpperCase(),
            name: String(args.name || '').trim(),
            credits: Number(args.credits || 4),
            userId: 'default-user',
          }),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) return { ok: false, error: data.error };
        notifyDataUpdated();
        return { ok: true, course: data };
      },
    },
    {
      name: 'create_task',
      description:
        'Crea una nueva evaluación o tarea dentro de una asignatura existente.',
      inputSchema: {
        type: 'object',
        properties: {
          courseQuery: {
            type: 'string',
            description:
              'Código o nombre de la asignatura (ej. IS-402 o Calidad de Software)',
          },
          title: {
            type: 'string',
            description: 'Título de la evaluación (ej. Práctica Calificada 3)',
          },
          weight: {
            type: 'number',
            description:
              'Ponderación decimal entre 0.01 y 1.00 (ej. 0.20 para 20%)',
          },
          dueDate: {
            type: 'string',
            description:
              'Fecha de entrega en formato ISO (ej. 2026-11-25T23:59:00)',
          },
          description: {
            type: 'string',
            description: 'Descripción opcional de la evaluación',
          },
        },
        required: ['courseQuery', 'title', 'weight'],
      },
      execute: async (args) => {
        const courses = await fetchCoursesList();
        const course = findCourse(courses, String(args.courseQuery || ''));
        if (!course) {
          return { ok: false, error: 'No se encontró esa asignatura.' };
        }
        const defaultDue = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: course.id,
            title: String(args.title || '').trim(),
            weight: Number(args.weight),
            dueDate: args.dueDate ? String(args.dueDate) : defaultDue,
            description: args.description ? String(args.description) : '',
          }),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) return { ok: false, error: data.error };
        notifyDataUpdated();
        return { ok: true, course: course.name, task: data };
      },
    },
    {
      name: 'move_task_status',
      description:
        'Mueve una evaluación o tarea entre columnas del tablero Kanban (PENDING, IN_PROGRESS, COMPLETED).',
      inputSchema: {
        type: 'object',
        properties: {
          taskQuery: {
            type: 'string',
            description: 'Nombre o ID de la tarea a mover',
          },
          status: {
            type: 'string',
            description: 'Nuevo estado en el tablero',
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
          },
        },
        required: ['taskQuery', 'status'],
      },
      execute: async (args) => {
        const courses = await fetchCoursesList();
        const match = findTask(courses, String(args.taskQuery || ''));
        if (!match) {
          return { ok: false, error: 'No se encontró esa evaluación.' };
        }
        const status = String(args.status);
        const res = await fetch(`/api/tasks/${match.task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) return { ok: false, error: data.error };
        notifyDataUpdated();
        return {
          ok: true,
          task: match.task.title,
          course: match.course.name,
          newStatus: status,
        };
      },
    },
    {
      name: 'grade_task',
      description:
        'Registra o modifica la calificación vigesimal (0 a 20) de una evaluación.',
      inputSchema: {
        type: 'object',
        properties: {
          taskQuery: {
            type: 'string',
            description: 'Nombre o ID de la evaluación a calificar',
          },
          score: {
            type: 'number',
            description: 'Nota vigesimal entre 0 y 20',
          },
        },
        required: ['taskQuery', 'score'],
      },
      execute: async (args) => {
        const courses = await fetchCoursesList();
        const match = findTask(courses, String(args.taskQuery || ''));
        if (!match) {
          return { ok: false, error: 'No se encontró esa evaluación.' };
        }
        const score = Number(args.score);
        const res = await fetch(`/api/tasks/${match.task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score, status: 'COMPLETED' }),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) return { ok: false, error: data.error };
        notifyDataUpdated();
        return {
          ok: true,
          task: match.task.title,
          course: match.course.name,
          score,
        };
      },
    },
    {
      name: 'navigate_to',
      description:
        'Navega a una sección de StudyMate: resumen (/dashboard), tablero Kanban (/dashboard/kanban), notas (/dashboard/grades) o analítica (/dashboard/analytics).',
      readOnlyHint: true,
      inputSchema: {
        type: 'object',
        properties: {
          route: {
            type: 'string',
            description: 'Ruta destino dentro de StudyMate',
            enum: [
              '/dashboard',
              '/dashboard/kanban',
              '/dashboard/grades',
              '/dashboard/analytics',
            ],
          },
        },
        required: ['route'],
      },
      execute: async (args) => {
        const route = String(args.route || '/dashboard');
        navigate(route);
        return { ok: true, navigatedTo: route };
      },
    },
  ];
}

export function registerNativeWebMcpTools(tools: StudyMateToolDefinition[]) {
  if (typeof window === 'undefined') return;
  const win = window as Window & { __studymateWebMcpRegistered?: boolean };
  if (win.__studymateWebMcpRegistered) return;

  const nav = navigator as Navigator & { modelContext?: BrowserModelContext };
  const doc = document as Document & { modelContext?: BrowserModelContext };
  const context = nav.modelContext || doc.modelContext;
  if (!context?.registerTool) return;

  win.__studymateWebMcpRegistered = true;

  for (const tool of tools) {
    try {
      const result = context.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: { readOnlyHint: Boolean(tool.readOnlyHint) },
        execute: tool.execute,
      });
      Promise.resolve(result).catch(() => {
        // Ignorar si ya fue registrada en la misma pestaña
      });
    } catch {
      // Ignorar errores síncronos de registro duplicado
    }
  }
}
