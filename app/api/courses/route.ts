// app/api/courses/route.ts - API Route Handler para Gestión de Asignaturas (HU02 / RF-02 y HU05 / RF-05)
// Mitiga BUG-02 (conversión parseInt de créditos para evitar error 500 de Prisma)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCourseMetrics } from '@/lib/gradeCalculator';

// POST: Registrar una nueva asignatura universitaria (HU02 / CA-02.1 y CA-02.2)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, credits, userId } = body;
    const targetUserId = !userId || userId === 'default-user' ? 'u-paolo-01' : userId;

    if (!code || !name || credits === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios (código, nombre y créditos).' },
        { status: 400 }
      );
    }

    // Mitigación BUG-02: Conversión explícita y validación de entero positivo
    const parsedCredits = parseInt(String(credits), 10);
    if (isNaN(parsedCredits) || parsedCredits <= 0) {
      return NextResponse.json(
        { error: 'El número de créditos debe ser un entero mayor a 0.' },
        { status: 422 }
      );
    }

    const newCourse = await prisma.course.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        credits: parsedCredits,
        userId: targetUserId,
      },
    });

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Error al crear curso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al crear el curso.' },
      { status: 500 }
    );
  }
}

// GET: Listar asignaturas por estudiante con tareas y promedios calculados (HU02 / HU05 / CA-02.3)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Si viene default-user o sin ID, enlaza al usuario predeterminado de la demo (Paolo Guzman)
    const targetUserId = !userId || userId === 'default-user' ? 'u-paolo-01' : userId;

    const courses = await prisma.course.findMany({
      where: { userId: targetUserId },
      include: {
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Enriquecer cada curso con su cálculo de promedio ponderado en vivo
    const enrichedCourses = courses.map((course) => {
      const metrics = calculateCourseMetrics(
        course.tasks.map((t) => ({ weight: t.weight, score: t.score }))
      );
      return {
        ...course,
        metrics,
      };
    });

    return NextResponse.json(enrichedCourses, { status: 200 });
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return NextResponse.json(
      { error: 'Error al obtener las asignaturas.' },
      { status: 500 }
    );
  }
}
