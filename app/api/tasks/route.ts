// app/api/tasks/route.ts - API Route Handler para Creación de Tareas con Ponderación (HU03 / RF-03)
// Criterios de Aceptación: CA-03.1, CA-03.2 y CA-03.3 (Mitiga BUG-03)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateTaskWeight } from '@/lib/gradeCalculator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, dueDate, weight, courseId } = body;

    if (!title || !dueDate || weight === undefined || !courseId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (título, fecha de vencimiento, ponderación o courseId).' },
        { status: 400 }
      );
    }

    const numericWeight = parseFloat(String(weight));

    // Obtener tareas existentes del curso para validar acumulación de peso
    const existingTasks = await prisma.task.findMany({
      where: { courseId },
      select: { weight: true },
    });

    // CA-03.2 y CA-03.3: Validación estricta con utilitario auditado
    const validation = validateTaskWeight(numericWeight, existingTasks);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 422 }
      );
    }

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        dueDate: new Date(dueDate),
        weight: numericWeight,
        courseId,
        status: 'PENDING',
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error al registrar tarea:', error);
    return NextResponse.json(
      { error: 'Error interno al registrar la tarea académica.' },
      { status: 500 }
    );
  }
}
