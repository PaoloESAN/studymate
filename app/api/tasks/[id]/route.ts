// app/api/tasks/[id]/route.ts - API Route Handler para Kanban, Calificación Vigesimal y Eliminación
// HU04 (Kanban / CA-04.2) y HU06 (Calificaciones / CA-06.1, CA-06.2, CA-06.3)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, score, title, description, dueDate } = body;

    // CA-06.1 y CA-06.2: Validación estricta de escala vigesimal 0 a 20
    if (score !== undefined && score !== null) {
      const numericScore = parseFloat(String(score));
      if (isNaN(numericScore) || numericScore < 0 || numericScore > 20) {
        return NextResponse.json(
          { error: 'La calificación debe estar en la escala vigesimal de 0 a 20.' },
          { status: 422 }
        );
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status: status as TaskStatus }),
        ...(score !== undefined && { score: score === null ? null : parseFloat(String(score)) }),
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al actualizar la tarea.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Tarea eliminada exitosamente respetando integridad referencial.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la tarea.' },
      { status: 500 }
    );
  }
}
