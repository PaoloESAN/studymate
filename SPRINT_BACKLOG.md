# SPRINT BACKLOG OFICIAL — STUDYMATE (CMMI v3.0 Nivel 2 + Scrum)

Este documento es el tablero de control de ejecución del equipo. Cada tarea registra su responsable, rama Git, fecha planificada de commit, issue en Jira y estado de cumplimiento.

---

## SPRINT 1 (Semanas 1 y 2) — Capacidad Comprometida: 19 SP / 95 Horas
**Sprint Goal**: *«Desplegar el núcleo transaccional de StudyMate en la nube que permita a los estudiantes autenticarse de manera segura, registrar sus asignaturas del ciclo académico, ingresar sus tareas validando sus ponderaciones y calcular su promedio ponderado preliminar.»*

### Historia de Usuario HU01: Registro e Inicio de Sesión de Usuario (3 SP) | Jira: [SCRUM-5]
- [ ] **SM-101**: Modelado de entidad User en Prisma, migración inicial en Supabase y hash bcrypt
  - **Responsable**: Bruno Gamarra (`brunoogq@gmail.com`)
  - **Rama**: `feature/US-01-auth`
  - **Fecha Commit**: `2026-10-02T10:30:00-05:00`
  - **Jira Subtask**: [SCRUM-13]
  - **Revisor PR**: Freddy Delgado (`24100644@ue.edu.pe`)
- [ ] **SM-102**: Construcción de vista /login y /register con validación de sesión y middleware
  - **Responsable**: Jean Piero Cuadrado (`24101123@ue.edu.pe`)
  - **Rama**: `feature/US-01-auth`
  - **Fecha Commit**: `2026-10-02T16:00:00-05:00`
  - **Jira Subtask**: [SCRUM-14]
  - **Revisor PR**: Bruno Gamarra (`brunoogq@gmail.com`)

### Historia de Usuario HU02: Gestión e Inscripción de Asignaturas por Ciclo (5 SP) | Jira: [SCRUM-6]
- [ ] **SM-103**: Implementación de Route Handler GET y POST en `/api/courses/route.ts`
  - **Responsable**: Bruno Gamarra (`brunoogq@gmail.com`)
  - **Rama**: `feature/US-02-courses`
  - **Fecha Commit**: `2026-10-04T11:00:00-05:00`
  - **Jira Subtask**: [SCRUM-15]
  - **Revisor PR**: Jean Piero Cuadrado (`24101123@ue.edu.pe`)
- [ ] **SM-104**: Dashboard de Asignaturas y modal de inscripción de cursos con créditos
  - **Responsable**: Jean Piero Cuadrado (`24101123@ue.edu.pe`)
  - **Rama**: `feature/US-02-courses`
  - **Fecha Commit**: `2026-10-04T17:30:00-05:00`
  - **Jira Subtask**: [SCRUM-16]
  - **Revisor PR**: Bruno Gamarra (`brunoogq@gmail.com`)

### Historia de Usuario HU03: Creación y Asignación de Tareas con Ponderación (8 SP) | Jira: [SCRUM-7]
- [ ] **SM-105**: Endpoint POST `/api/tasks/route.ts` con validación de regla `0 < weight <= 1.0` y suma `<= 100%`
  - **Responsable**: Freddy Delgado (`24100644@ue.edu.pe`)
  - **Rama**: `feature/US-03-tasks`
  - **Fecha Commit**: `2026-10-06T12:00:00-05:00`
  - **Jira Subtask**: [SCRUM-17]
  - **Revisor PR**: Bruno Gamarra (`brunoogq@gmail.com`)
- [ ] **SM-106**: Formulario interactivo de tareas y validación reactiva 422
  - **Responsable**: Jean Piero Cuadrado (`24101123@ue.edu.pe`)
  - **Rama**: `feature/US-03-tasks`
  - **Fecha Commit**: `2026-10-06T18:00:00-05:00`
  - **Jira Subtask**: [SCRUM-18]
  - **Revisor PR**: Freddy Delgado (`24100644@ue.edu.pe`)

### Historia de Usuario HU05: Cálculo Automático de Promedio Ponderado por Asignatura (3 SP) | Jira: [SCRUM-9]
- [ ] **SM-107**: Algoritmo de promedio ponderado, nota necesaria y pruebas unitarias (`lib/gradeCalculator.ts`)
  - **Responsable**: Freddy Delgado (`24100644@ue.edu.pe`)
  - **Rama**: `feature/US-05-grades`
  - **Fecha Commit**: `2026-10-08T15:00:00-05:00`
  - **Jira Subtask**: [SCRUM-19]
  - **Revisor PR**: Bruno Gamarra (`brunoogq@gmail.com`)

### Cierre de Sprint 1 y Línea Base v1.0.0
- [ ] **PR #05**: Merge de `develop` hacia `main` y creación de tag `v1.0.0-Sprint1`
  - **Responsable**: Freddy Delgado (`24100644@ue.edu.pe`)
  - **Aprobado por**: Jhony Cercado (Scrum Master) & Paolo Guzman (Product Owner)
  - **Fecha Commit**: `2026-10-10T19:00:00-05:00`

---

## SPRINT 2 (Semanas 3 y 4) — Capacidad Comprometida: 21 SP / 105 Horas
**Sprint Goal**: *«Consolidar la experiencia interactiva y analítica de StudyMate incorporando el tablero Kanban dinámico para la gestión visual de estados, el registro y edición de calificaciones vigesimales (0 a 20), el sistema de alertas de vencimiento próximo y el Dashboard Analítico semestral.»*

### Historia de Usuario HU04: Visualización y Movimiento en Tablero Kanban (5 SP) | Jira: [SCRUM-8]
- [ ] **SM-201**: Endpoint PATCH `/api/tasks/[id]` para transiciones PENDING / IN_PROGRESS / COMPLETED
  - **Responsable**: Bruno Gamarra (`brunoogq@gmail.com`)
  - **Rama**: `feature/US-04-kanban`
  - **Fecha Commit**: `2026-10-13T11:00:00-05:00`
  - **Jira Subtask**: [SCRUM-20]
  - **Revisor PR**: Jean Piero Cuadrado (`24101123@ue.edu.pe`)
- [ ] **SM-202**: Componente visual `KanbanBoard` de 3 columnas con Optimistic UI
  - **Responsable**: Jean Piero Cuadrado (`24101123@ue.edu.pe`)
  - **Rama**: `feature/US-04-kanban`
  - **Fecha Commit**: `2026-10-14T17:00:00-05:00`
  - **Jira Subtask**: [SCRUM-21]
  - **Revisor PR**: Freddy Delgado (`24100644@ue.edu.pe`)

### Historia de Usuario HU06: Registro de Calificaciones y Edición CRUD de Tareas (5 SP) | Jira: [SCRUM-10]
- [ ] **SM-203**: Extensión de PATCH y DELETE `/api/tasks/[id]` con validación vigesimal 0-20
  - **Responsable**: Bruno Gamarra (`brunoogq@gmail.com`)
  - **Rama**: `feature/US-06-score-crud`
  - **Fecha Commit**: `2026-10-16T12:00:00-05:00`
  - **Jira Subtask**: [SCRUM-22]
  - **Revisor PR**: Jean Piero Cuadrado (`24101123@ue.edu.pe`)
- [ ] **SM-204**: Modal de calificación rápida y edición CRUD de tareas
  - **Responsable**: Freddy Delgado (`24100644@ue.edu.pe`)
  - **Rama**: `feature/US-06-score-crud`
  - **Fecha Commit**: `2026-10-17T16:30:00-05:00`
  - **Jira Subtask**: [SCRUM-23]
  - **Revisor PR**: Bruno Gamarra (`brunoogq@gmail.com`)

### Historia de Usuario HU07: Alertas de Vencimiento Próximo y Filtros (5 SP) | Jira: [SCRUM-11]
- [ ] **SM-205**: Motor de alertas `lib/dateAlerts.ts` (<48h badge rojo) y filtros por asignatura
  - **Responsable**: Jean Piero Cuadrado (`24101123@ue.edu.pe`)
  - **Rama**: `feature/US-07-alerts`
  - **Fecha Commit**: `2026-10-19T14:00:00-05:00`
  - **Jira Subtask**: [SCRUM-24]
  - **Revisor PR**: Bruno Gamarra (`brunoogq@gmail.com`)

### Historia de Usuario HU08: Dashboard Analítico de Rendimiento Académico Global (6 SP) | Jira: [SCRUM-12]
- [ ] **SM-206**: Dashboard Analítico Global con KPIs y promedio ponderado por créditos
  - **Responsable**: Freddy Delgado (`24100644@ue.edu.pe`) / Jean Piero Cuadrado
  - **Rama**: `feature/US-08-analytics`
  - **Fecha Commit**: `2026-10-21T16:00:00-05:00`
  - **Jira Subtask**: [SCRUM-25]
  - **Revisor PR**: Jhony Cercado (`jhonycercado2006@gmail.com`)

### Cierre de Sprint 2, Release Final y Despliegue en Producción
- [ ] **PR #09**: Merge de `develop` hacia `main` y creación de tag `v2.0.0-Release`
  - **Responsable**: Freddy Delgado (`24100644@ue.edu.pe`)
  - **Aprobado por**: Jhony Cercado (Scrum Master) & Paolo Guzman (Product Owner)
  - **Fecha Commit**: `2026-10-24T18:00:00-05:00`
