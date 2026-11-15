import { NextResponse } from 'next/server';

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_LIVE_MODEL || 'models/gemini-3.8-live';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY no está configurada en el servidor.' },
      { status: 500 }
    );
  }

  try {
    const expireTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uses: 1,
          expireTime,
        }),
      }
    );

    if (!response.ok) {
      const details = await response.text();
      console.error('Error generando token efímero Gemini Live:', details);
      return NextResponse.json(
        { error: 'No se pudo generar el token de sesión en vivo.' },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { name?: string };
    if (!data.name) {
      return NextResponse.json(
        { error: 'Respuesta inválida del servicio de autenticación.' },
        { status: 502 }
      );
    }

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(data.name)}`;

    return NextResponse.json({
      wsUrl,
      model,
      expiresAt: expireTime,
    });
  } catch (error) {
    console.error('Error en /api/live-token:', error);
    return NextResponse.json(
      { error: 'Error interno al inicializar la sesión de voz.' },
      { status: 500 }
    );
  }
}
