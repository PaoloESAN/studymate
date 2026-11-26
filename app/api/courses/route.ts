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

    if (!userId || userId === 'default-user') {
      return NextResponse.json(
        { error: 'El identificador del usuario es obligatorio.' },
        { status: 400 }
      );
    }
    const targetUserId = String(userId);

    if (typeof name !== 'string' || !name.trim() || credits === undefined) {
      return NextResponse.json(
        { error: 'El nombre y los créditos de la asignatura son obligatorios.' },
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

    const normalizedCode =
      typeof code === 'string' && code.trim().length > 0
        ? code.trim().toUpperCase()
        : `ASIG-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'La sesión del usuario no es válida. Vuelve a iniciar sesión.' },
        { status: 401 }
      );
    }

    const newCourse = await prisma.course.create({
      data: {
        code: normalizedCode,
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

    if (!userId || userId === 'default-user') {
      return NextResponse.json(
        { error: 'El identificador del usuario es obligatorio.' },
        { status: 400 }
      );
    }
    const targetUserId = userId;

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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id) {
      return NextResponse.json(
        { error: 'El identificador de la asignatura es obligatorio.' },
        { status: 400 }
      );
    }

    const deleted = await prisma.course.deleteMany({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Asignatura no encontrada o sin permisos para eliminarla.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Asignatura eliminada correctamente.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar la asignatura.' },
      { status: 500 }
    );
  }
}
