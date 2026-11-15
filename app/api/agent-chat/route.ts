import { NextResponse } from 'next/server';

interface ChatContentPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: { result: unknown } };
}

interface ChatContent {
  role: 'user' | 'model';
  parts: ChatContentPart[];
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY no configurada en el servidor.' },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as {
      contents?: ChatContent[];
      functionDeclarations?: unknown[];
    };

    if (!Array.isArray(body.contents) || body.contents.length === 0) {
      return NextResponse.json(
        { error: 'El historial de conversación es obligatorio.' },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: 'Eres StudyMate, el agente académico inteligente de la Universidad ESAN. Responde siempre en español de forma breve, clara y útil. Tienes acceso a todas las herramientas WebMCP de la aplicación para consultar cursos y promedios (escala 0 a 20), crear o eliminar asignaturas, crear/editar/eliminar evaluaciones, mover tarjetas en el Kanban, filtrar el tablero, registrar notas, ajustar el simulador de nota objetivo, cambiar el tema claro/oscuro, navegar entre vistas y cerrar sesión. Ejecuta las herramientas necesarias de inmediato antes de responder.',
              },
            ],
          },
          contents: body.contents,
          tools: body.functionDeclarations?.length
            ? [{ functionDeclarations: body.functionDeclarations }]
            : undefined,
        }),
      }
    );

    if (!res.ok) {
      const details = await res.text();
      console.error('Error en Gemini Flash Lite:', details);
      return NextResponse.json(
        { error: 'Error al consultar el modelo de texto.' },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: ChatContentPart[] };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts
      .filter((p) => typeof p.text === 'string')
      .map((p) => p.text)
      .join('\n')
      .trim();
    const functionCalls = parts
      .filter((p) => p.functionCall)
      .map((p) => p.functionCall!);

    return NextResponse.json({
      text,
      functionCalls,
      modelParts: parts,
    });
  } catch (error) {
    console.error('Error en /api/agent-chat:', error);
    return NextResponse.json(
      { error: 'Error interno en el chat del agente.' },
      { status: 500 }
    );
  }
}
