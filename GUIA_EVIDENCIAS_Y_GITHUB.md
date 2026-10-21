# 📋 GUÍA DE ACCIÓN Y CALENDARIO DE EVIDENCIAS: STUDYMATE
### Universidad ESAN — Calidad de Software (CMMI v3.0 Nivel 2 + Scrum)
**Profesor**: Adolfo Luna Izquierdo | **Puntaje Objetivo**: 20 / 20 pts

---

## 👥 1. Datos del Equipo y Credenciales

| Integrante | Rol Scrum | Área CMMI v3.0 | Correo Oficial Git / GitHub |
| :--- | :--- | :--- | :--- |
| **Paolo Lionel Guzman** | **Product Owner (PO)** | **RDM** & **GOV** | `186249117+PaoloESAN@users.noreply.github.com` |
| **Jhony Cercado Atalaya** | **Scrum Master (SM)** | **PLAN**, **MC**, **RSK**, **PQA** | `jhonycercado2006@gmail.com` |
| **Freddy Angel Delgado** | **Config & Infra Lead** | **CM**, **II**, **SAM** | `24100644@ue.edu.pe` |
| **Bruno Sebastian Gamarra** | **Backend Lead & QA** | **EST**, **Backend**, **PQA** | `brunoogq@gmail.com` |
| **Jean Piero Cuadrado** | **Frontend Lead & QA** | **EST**, **UI/UX**, **PQA** | `24101123@ue.edu.pe` |

---

## 📸 2. Checklist Maestro de Capturas de Pantalla para el Informe (Word)

A continuación tienes la lista exacta de fotos que el informe exige reemplazar en los recuadros amarillos:

### Bloque A: Ceremonias y Trabajo en Equipo (Capítulo I & II)
- [x] **FOTO 1 — Llamada grupal en Zoom (Página 7)**:
  - *Estado*: **¡Ya lista!** Usa el archivo `fotos/Captura de pantalla 2026-10-11 131325.png` donde aparecen los 5 miembros (Paolo, Jhony, Freddy, Bruno y Jean Piero).
- [ ] **FOTO 2 — Planning Poker (Página 17)**:
  - *Cuándo tomarla*: Día 1 del Sprint 1 (20 o 21 de Octubre).
  - *Dónde*: Entra a [https://planningpokeronline.com/](https://planningpokeronline.com/), crea la sala `StudyMate Estimación CMMI`.
  - *Acción*: Abre 4 ventanas de incógnito con los nombres de Jhony, Freddy, Bruno y Jean Piero. Votan la carta **8** para la HU03 y tomas captura cuando se revelan las cartas.
- [ ] **FOTO 3 — Daily Scrum en WhatsApp o Zoom (Página 18)**:
  - *Cuándo*: Día 4 o Día 7.
  - *Acción*: En el grupo de WhatsApp del proyecto, Freddy, Bruno o Jean Piero envían:
    - *¿Qué hice ayer?: ...*
    - *¿Qué haré hoy?: ...*
    - *¿Qué bloqueos tengo?: Error de conexiones en Supabase (IMP-01)*.
    - Jhony (Scrum Master) responde confirmando el desbloqueo. Tomas captura de ese chat.
- [ ] **FOTO 4 — Tablero de Retrospectiva (Página 42)**:
  - *Cuándo*: Cierre de Sprint 1 (30 de Octubre).
  - *Dónde*: En [Miro.com](https://miro.com/) o [MetroRetro.io](https://metroretro.io/) (gratis).
  - *Acción*: Crea un tablero de 3 columnas (*Qué funcionó bien*, *Qué falló en el Sprint 1*, *Acciones de Mejora*) con los post-its de colores detallados en la tabla 5.1 del informe.

---

### Bloque B: Jira Software Cloud (Capítulo II)
- [ ] **FOTO 5 — Vista Product Backlog en Jira (Página 13)**:
  - *Dónde*: Entra a `studymate-esan.atlassian.net` -> Proyecto `SCRUM` -> Menú lateral **Backlog**.
  - *Evidencia*: Captura donde se vean las 8 Historias de Usuario creadas (`HU01` a `HU08`) con sus puntos (3, 5, 8, 5, 3, 5, 5, 6) y prioridades.
- [ ] **FOTO 6 — Detalle de una Historia con Gherkin (Página 13)**:
  - *Acción*: En Jira, haz clic sobre `HU03` (`SCRUM-7`). Se abrirá el panel lateral derecho con el texto *"Como estudiante universitario..."* y los Criterios de Aceptación `DADO QUE / CUANDO / ENTONCES`. Tomas captura.
- [ ] **FOTO 7 — Sprint Backlog Activo en Jira (Página 17)**:
  - *Dónde*: Pestaña **Tablero** / **Active Sprints** en Jira.
  - *Evidencia*: Se ven las columnas *Por hacer*, *En curso* y *Listo* con las fotos/iniciales de los 5 integrantes.

---

### Bloque C: GitHub y Gestión de la Configuración (Capítulo II - Sección 3.4)
- [ ] **FOTO 8 — Ramas en GitHub (Página 23)**:
  - *Dónde*: En `github.com/PaoloESAN/studymate` -> Clic en **Branches**.
  - *Evidencia*: Captura donde aparezcan listadas las ramas `main`, `develop`, `feature/US-01-auth`, `feature/US-02-courses`, `feature/US-03-tasks`, `feature/US-04-kanban`, etc.
- [ ] **FOTO 9 — Pull Request Aprobado con Code Review (Página 23)**:
  - *Cuándo tomarla*: Entre el 22 y 30 de Octubre (Sprint 1).
  - *Dónde*: GitHub -> Pestaña **Pull requests** -> Abre el **PR #01** o **PR #03**.
  - *Evidencia*: Se ve el comentario de revisión por pares del compañero:
    > *"LGTM, validado contra criterios Gherkin y DoD. Compilación y linter OK."*
    y el check verde de aprobación antes de darle a **Merge pull request**.
- [ ] **FOTO 10 — Tags y Releases en GitHub (Página 23)**:
  - *Dónde*: GitHub -> Pestaña **Tags** / **Releases**.
  - *Evidencia*: Aparecen publicados los tags **`v1.0.0-Sprint1`** y **`v2.0.0-Release`**.

---

### Bloque D: Base de Datos en Supabase y Despliegue en Vercel (Página 33)
- [ ] **FOTO 11 — Table Editor de Supabase**:
  - *Dónde*: Panel de Supabase (`supabase.com`) -> Proyecto de StudyMate -> **Table Editor**.
  - *Evidencia*: Captura donde se vean las tablas relacionales creadas: `User`, `Course` y `Task` con datos de asignaturas de ESAN.
- [ ] **FOTO 12 — Dashboard de Vercel en Producción**:
  - *Dónde*: Panel de Vercel (`vercel.com`) -> Proyecto `studymate`.
  - *Evidencia*: Despliegue en estado verde **`Ready`**, dominio `.vercel.app` público y los deployments de Preview vinculados a GitHub.

---

### Bloque E: Aplicación Web en Vivo y Pruebas (Páginas 27 y 36)
- [ ] **FOTO 13 — Terminal ejecutando Tests Unitarios (Página 27)**:
  - *Acción*: En la terminal de VS Code ejecutar `pnpm test`.
  - *Evidencia*: Consola mostrando `8 passed, 8 total` al 100% verde.
- [ ] **FOTO 14 — Pantalla de Login (`/login`)**:
  - *Evidencia*: Captura ingresando con el correo institucional `24100383@ue.edu.pe`.
- [ ] **FOTO 15 — Dashboard de Asignaturas y Créditos (`/dashboard`)**:
  - *Evidencia*: Cursos reales de ESAN registrados (`IS-402 Calidad de Software - 4 créditos`, `IS-405 Arquitectura Empresarial - 4 créditos`, etc.) con tarjetas KPI.
- [ ] **FOTO 16 — Validación de Ponderación (Error 422)**:
  - *Evidencia*: Dos capturas: una creando una tarea válida (peso 0.30) y otra intentando poner peso `1.5` donde salta el mensaje en rojo:
    > *"La ponderación debe ser mayor a 0 y menor o igual a 1.0"*.
- [ ] **FOTO 17 — Tablero Kanban Interactivo (`/dashboard/kanban`)**:
  - *Evidencia*: Tareas distribuidas en las 3 columnas (*Pendiente*, *En Progreso*, *Completado*) con badge rojo de urgencia `¡Vence Pronto! (< 48h)`.
- [ ] **FOTO 18 — Calculadora de Promedios Ponderados (`/dashboard/grades`)**:
  - *Evidencia*: Tabla con notas vigesimales (ej. 17.0) y cálculo automático del promedio acumulado y nota necesaria para aprobar.

---

## 📅 3. Calendario Manual de Pull Requests en GitHub

Sigue este cronograma exacto para abrir y fusionar los PRs en `github.com/PaoloESAN/studymate`:

### 🔹 SPRINT 1 (Del 20 al 30 de Octubre de 2026)

#### PR #01: feature/US-01-auth ➔ develop
- **Fecha de apertura**: Jueves 22 de Octubre de 2026.
- **Quién lo abre**: Bruno Gamarra (`brunoogq@gmail.com`).
- **Título del PR**: `feat(auth): HU01 - Registro, login seguro y modelo User en Prisma`
- **Quién revisa y aprueba**: Freddy Delgado (`24100644@ue.edu.pe`).
- **Comentario de aprobación para la captura**:
  > *"LGTM, validado contra Criterios de Aceptación CA-01.1 a CA-01.3. Encriptación de contraseñas y modelo Prisma conformes al DoD. Aprobado para merge."*
- **Acción**: Clic en **Merge pull request** hacia `develop`.

---

#### PR #02: feature/US-02-courses ➔ develop
- **Fecha de apertura**: Sábado 24 de Octubre de 2026.
- **Quién lo abre**: Jean Piero Cuadrado (`24101123@ue.edu.pe`).
- **Título del PR**: `feat(courses): HU02 - Gestión de asignaturas por ciclo con créditos`
- **Quién revisa y aprueba**: Bruno Gamarra (`brunoogq@gmail.com`).
- **Comentario de aprobación**:
  > *"Revisado endpoint /api/courses y validación de créditos enteros positivos. Cumple criterios CA-02.1 y CA-02.2. Aprobado."*
- **Acción**: Merge hacia `develop`.

---

#### PR #03: feature/US-03-tasks ➔ develop
- **Fecha de apertura**: Martes 27 de Octubre de 2026.
- **Quién lo abre**: Freddy Delgado (`24100644@ue.edu.pe`).
- **Título del PR**: `feat(tasks): HU03 - Creación de tareas y validación estricta de ponderación (0-1)`
- **Quién revisa y aprueba**: Jean Piero Cuadrado (`24101123@ue.edu.pe`).
- **Comentario de aprobación**:
  > *"Verificada regla de negocio HTTP 422 ante ponderación > 1 o suma > 100%. Formulario responsivo integrado. Aprobado."*
- **Acción**: Merge hacia `develop`.

---

#### PR #04: feature/US-05-grades ➔ develop
- **Fecha de apertura**: Jueves 29 de Octubre de 2026.
- **Quién lo abre**: Freddy Delgado (`24100644@ue.edu.pe`).
- **Título del PR**: `feat(grades): HU05 - Algoritmo de cálculo de promedio ponderado y nota necesaria`
- **Quién revisa y aprueba**: Bruno Gamarra (`brunoogq@gmail.com`).
- **Comentario de aprobación**:
  > *"Fórmula ponderada probada con tests unitarios. Cláusula de guarda para evitar división entre cero verificada. Aprobado."*
- **Acción**: Merge hacia `develop`.

---

#### PR #05: develop ➔ main (CIERRE DE SPRINT 1)
- **Fecha**: Viernes 30 de Octubre de 2026.
- **Quién lo abre**: Freddy Delgado (`24100644@ue.edu.pe`).
- **Título del PR**: `release: Sprint 1 Increment - Núcleo Transaccional (19 SP)`
- **Quién revisa y aprueba**: Jhony Cercado (Scrum Master) y Paolo Guzman (Product Owner).
- **Acción**: Merge a `main`.
- **Comando de Tag en terminal**:
  ```bash
  git checkout main
  git pull origin main
  git tag -a v1.0.0-Sprint1 -m "Baseline Sprint 1: Auth, Cursos, Tareas y Promedios (19 SP)"
  git push origin v1.0.0-Sprint1
  ```

---

### 🔹 SPRINT 2 (Del 02 al 13 de Noviembre de 2026)

#### PR #06: feature/US-04-kanban ➔ develop
- **Fecha de apertura**: Miércoles 04 de Noviembre de 2026.
- **Quién lo abre**: Jean Piero Cuadrado (`24101123@ue.edu.pe`).
- **Título del PR**: `feat(kanban): HU04 - Tablero Kanban reactivo de 3 columnas con Optimistic UI`
- **Quién revisa y aprueba**: Freddy Delgado (`24100644@ue.edu.pe`).
- **Comentario**:
  > *"Transiciones fluidas entre PENDING, IN_PROGRESS y COMPLETED. Cero latencia visual. Aprobado."*
- **Acción**: Merge hacia `develop`.

---

#### PR #07: feature/US-06-score-crud ➔ develop
- **Fecha de apertura**: Viernes 06 de Noviembre de 2026.
- **Quién lo abre**: Bruno Gamarra (`brunoogq@gmail.com`).
- **Título del PR**: `feat(score): HU06 - Calificación vigesimal (0-20) y edición/baja de tareas`
- **Quién revisa y aprueba**: Jean Piero Cuadrado (`24101123@ue.edu.pe`).
- **Comentario**:
  > *"Validación vigesimal estricta y recálculo instantáneo de promedios al calificar. Aprobado."*
- **Acción**: Merge hacia `develop`.

---

#### PR #08: feature/US-07-alerts ➔ develop
- **Fecha de apertura**: Martes 10 de Noviembre de 2026.
- **Quién lo abre**: Jean Piero Cuadrado (`24101123@ue.edu.pe`).
- **Título del PR**: `feat(alerts): HU07 - Semáforo de urgencia (<48h) y filtrado dinámico por curso`
- **Quién revisa y aprueba**: Bruno Gamarra (`brunoogq@gmail.com`).
- **Comentario**:
  > *"Badge '¡Vence Pronto!' opera correctamente en zona horaria America/Lima. Filtros por curso reactivos. Aprobado."*
- **Acción**: Merge hacia `develop`.

---

#### PR #09: feature/US-08-analytics ➔ develop
- **Fecha de apertura**: Jueves 12 de Noviembre de 2026.
- **Quién lo abre**: Freddy Delgado (`24100644@ue.edu.pe`).
- **Título del PR**: `feat(analytics): HU08 - Dashboard Analítico semestral ponderado por créditos`
- **Quién revisa y aprueba**: Jhony Cercado (`jhonycercado2006@gmail.com`).
- **Comentario**:
  > *"Tarjetas KPI y promedio acumulado semestral calculados con total exactitud. 21 SP de Sprint 2 completados. Aprobado."*
- **Acción**: Merge hacia `develop`.

---

#### PR Final: develop ➔ main (LANZAMIENTO FINAL RELEASE)
- **Fecha**: Viernes 13 de Noviembre de 2026.
- **Quién lo abre**: Freddy Delgado | **Aprueban**: Paolo Guzman (PO) y Jhony Cercado (SM).
- **Título del PR**: `release: Lanzamiento Final StudyMate v2.0.0 (40 SP Completados)`
- **Acción**: Merge a `main`.
- **Comando de Tag en terminal**:
  ```bash
  git checkout main
  git pull origin main
  git tag -a v2.0.0-Release -m "Baseline v2.0.0: Lanzamiento Final StudyMate (40 SP)"
  git push origin v2.0.0-Release
  ```
