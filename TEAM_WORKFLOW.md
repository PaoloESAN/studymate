# TEAM WORKFLOW & ROLES — STUDYMATE (CMMI v3.0 Nivel 2 + Scrum)

Este documento define la estructura oficial de trabajo colaborativo, identidades de Git, responsabilidades por integrante y el protocolo de ejecución continua.

---

## 1. Identidades Oficiales del Equipo (Git & Jira)

| Integrante | Rol Scrum | Área CMMI v3.0 | Correo Oficial Git | Jira Account ID |
| :--- | :--- | :--- | :--- | :--- |
| **Paolo Lionel Guzman** | **Product Owner (PO)** | **RDM** (Requisitos)<br>**GOV** (Gobernanza) | `186249117+PaoloESAN@users.noreply.github.com` | `712020:5a33501e-9002-4988-9f3f-61051050109a` |
| **Jhony Cercado Atalaya** | **Scrum Master (SM)** | **PLAN** (Planificación)<br>**MC** (Monitoreo y Control)<br>**RSK** (Riesgos)<br>**PQA** (Calidad) | `jhonycercado2006@gmail.com` | `712020:52fb0125-dda6-4b2f-957a-8c1803871092` |
| **Freddy Angel Delgado** | **Config & Infra Lead / Dev** | **CM** (Configuración)<br>**II** (Infraestructura)<br>**SAM** (Proveedores) | `24100644@ue.edu.pe` | `712020:d2fa7df2-2492-453f-903f-970b30c586e8` |
| **Bruno Sebastian Gamarra** | **Backend Developer & QA** | **EST** (Estimación)<br>**Backend Lead**<br>**PQA** (Pruebas API) | `brunoogq@gmail.com` | `712020:b914eea8-4aef-4427-a77b-981ced20eab4` |
| **Jean Piero Cuadrado** | **Frontend Developer & QA** | **EST** (Estimación)<br>**UI/UX Lead**<br>**PQA** (Pruebas UI) | `24101123@ue.edu.pe` | `712020:a3b89603-a08e-42f5-9682-65cb17e9051b` |

---

## 2. Protocolo de Ejecución: "Persona Runner"

Cualquier miembro del equipo puede solicitar al asistente agentic ejecutar sus tareas asignadas:

```markdown
"Soy [Nombre del Integrante], lee TEAM_WORKFLOW.md y SPRINT_BACKLOG.md y ejecuta mi tarea [ID de Tarea]."
```

### Acciones que ejecuta el Agente al asumir un rol:
1. **Configuración de Autoría Git**:
   ```bash
   git config user.name "[Nombre del Integrante]"
   git config user.email "[Correo Oficial Git]"
   ```
2. **Conmutación a la Rama de la Tarea**:
   ```bash
   git checkout -b feature/[Nombre-Rama]
   ```
3. **Desarrollo y Pruebas**: Escribe el código, ejecuta el linter y las pruebas unitarias asociadas.
4. **Commit con Fecha y Mensaje Convencional**:
   ```bash
   git commit --date="YYYY-MM-DDTHH:MM:SS" -m "feat([scope]): [descripción concisa]"
   ```
5. **Aprobación de Pull Request (Code Review DoD)**: El revisor asignado verifica y aprueba formalmente hacia `develop`.
6. **Actualización de Estado**: Marca la tarea como `[x] DONE` en `SPRINT_BACKLOG.md` y actualiza la issue correspondiente en Jira.

---

## 3. Política de Branches (GitFlow)
- `main`: Rama de producción estable. Solo recibe merges aprobados de `develop` al cierre de cada Sprint con su tag de release (`v1.0.0-Sprint1`, `v2.0.0-Release`).
- `develop`: Rama central de integración. Ningún commit directo; solo Pull Requests aprobados por pares.
- `feature/*`: Ramas de corta duración creadas a partir de `develop` para cada Historia de Usuario.
- `hotfix/*`: Correcciones inmediatas de auditoría.
