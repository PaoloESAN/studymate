// prisma/seed.ts - Script de poblamiento reproducible de la base de datos (ESAN StudyMate)
// Satisface RSK-06 (Restauración de datos de demostración en < 5 segundos)

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando poblamiento de base de datos StudyMate...');

  // Limpiar datos existentes
  await prisma.task.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // 1. Crear usuario principal (Paolo Guzman - Product Owner)
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.create({
    data: {
      email: '24100383@ue.edu.pe',
      name: 'Paolo Lionel Guzman',
      password: hashedPassword,
      role: 'STUDENT',
    },
  });

  console.log(`Usuario creado: ${user.name} (${user.email})`);

  // Fechas relativas para demostración en vivo de semáforos
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const past5Days = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  // 2. Curso 1: IS-402 Calidad de Software (4 créditos)
  const course1 = await prisma.course.create({
    data: {
      code: 'IS-402',
      name: 'Calidad de Software',
      credits: 4,
      userId: user.id,
      tasks: {
        create: [
          {
            title: 'Avance Integrador CMMI',
            description: 'Implementación de las 10 PAs de CMMI v3.0 Nivel 2 y tablero Scrum',
            weight: 0.30,
            score: 16.0,
            status: 'COMPLETED',
            dueDate: past5Days,
          },
          {
            title: 'Auditoría DoD & Métricas',
            description: 'Verificación de checklist de calidad y Pirámide de Pruebas',
            weight: 0.20,
            score: 18.0,
            status: 'COMPLETED',
            dueDate: past5Days,
          },
          {
            title: 'Sustentación Final & Release',
            description: 'Demostración fluida en tiempo real y despliegue final en producción',
            weight: 0.50,
            score: null,
            status: 'IN_PROGRESS',
            dueDate: in7Days,
          },
        ],
      },
    },
  });

  // 3. Curso 2: IS-405 Arquitectura Empresarial (4 créditos)
  const course2 = await prisma.course.create({
    data: {
      code: 'IS-405',
      name: 'Arquitectura Empresarial',
      credits: 4,
      userId: user.id,
      tasks: {
        create: [
          {
            title: 'Modelado TOGAF & Capas',
            description: 'Diagramas de capacidades de negocio y arquitectura de aplicaciones',
            weight: 0.40,
            score: 17.5,
            status: 'COMPLETED',
            dueDate: past5Days,
          },
          {
            title: 'Caso de Estudio Banco Digital',
            description: 'Transformación digital y mapa de ruta de migración cloud',
            weight: 0.30,
            score: null,
            status: 'PENDING',
            dueDate: in24Hours, // Activa el semáforo ¡Vence Pronto! (< 48h)
          },
          {
            title: 'Examen Final de Arquitectura',
            description: 'Evaluación integral de patrones e interoperabilidad',
            weight: 0.30,
            score: null,
            status: 'PENDING',
            dueDate: in7Days,
          },
        ],
      },
    },
  });

  // 4. Curso 3: IS-408 Inteligencia Artificial (3 créditos)
  const course3 = await prisma.course.create({
    data: {
      code: 'IS-408',
      name: 'Inteligencia Artificial',
      credits: 3,
      userId: user.id,
      tasks: {
        create: [
          {
            title: 'Laboratorio Agentes & LLMs',
            description: 'Construcción de pipeline RAG con embeddings y base vectorial',
            weight: 0.35,
            score: 19.0,
            status: 'COMPLETED',
            dueDate: past5Days,
          },
          {
            title: 'Proyecto Clasificación Multimodal',
            description: 'Entrenamiento y ajuste fino de modelo convolucional/transformer',
            weight: 0.35,
            score: null,
            status: 'IN_PROGRESS',
            dueDate: in3Days,
          },
          {
            title: 'Paper Review: State of the Art',
            description: 'Análisis crítico de artículo científico Q1',
            weight: 0.30,
            score: null,
            status: 'PENDING',
            dueDate: in7Days,
          },
        ],
      },
    },
  });

  console.log('Poblamiento exitoso con 3 asignaturas y 9 actividades académicas.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
