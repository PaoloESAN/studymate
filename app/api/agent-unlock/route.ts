import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const expectedCode = process.env.AGENT_ACCESS_CODE;

    if (!expectedCode) {
      return NextResponse.json(
        { error: 'Código de activación no configurado en el servidor.' },
        { status: 500 }
      );
    }

    const submitted = typeof body.code === 'string' ? body.code.trim() : '';
    if (!submitted || submitted !== expectedCode) {
      return NextResponse.json(
        { error: 'Código de activación incorrecto.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ unlocked: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Solicitud inválida.' },
      { status: 400 }
    );
  }
}
