// app/api/auth/route.ts - API Route Handler para Registro e Inicio de Sesión (HU01 / RF-01)
// Criterios de Aceptación: CA-01.1, CA-01.2 y CA-01.3

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'El correo y la contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // ACCIÓN: REGISTRO DE NUEVO ESTUDIANTE
    if (action === 'register') {
      // CA-01.3: Prevención de correos duplicados
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'El correo electrónico ya se encuentra registrado. Solicite iniciar sesión.' },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          name: name ? name.trim() : cleanEmail.split('@')[0],
          role: 'STUDENT',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json(
        { message: 'Usuario registrado exitosamente.', user: newUser },
        { status: 201 }
      );
    }

    // ACCIÓN: INICIO DE SESIÓN (LOGIN)
    // CA-01.1 y CA-01.2
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas, verifique su correo y contraseña.' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas, verifique su correo y contraseña.' },
        { status: 401 }
      );
    }

    // Sesión exitosa
    return NextResponse.json(
      {
        message: 'Autenticación exitosa.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/auth:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor en la autenticación.' },
      { status: 500 }
    );
  }
}
