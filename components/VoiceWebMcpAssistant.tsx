'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Loader2,
  Volume2,
  X,
  Square,
} from 'lucide-react';
import {
  createStudyMateTools,
  registerNativeWebMcpTools,
  StudyMateToolDefinition,
} from '@/lib/webmcp';
import { useToast } from '@/app/providers';

type SessionState = 'idle' | 'connecting' | 'listening' | 'speaking';

interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant' | 'action';
  text: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

function summarizeToolAction(
  name: string,
  result: Record<string, unknown>
): string {
  if (result.ok === false && typeof result.error === 'string') {
    return result.error;
  }
  switch (name) {
    case 'list_courses':
      return `Cursos consultados (${String(result.totalCourses ?? 0)} asignaturas).`;
    case 'get_academic_summary':
      return `Resumen: GPA ${String(result.semesterGPA ?? '—')} (${String(result.totalCredits ?? 0)} créditos).`;
    case 'create_course':
      return 'Asignatura registrada en el ciclo.';
    case 'create_task':
      return `Evaluación agregada en ${String(result.course ?? 'el curso')}.`;
    case 'move_task_status':
      return `"${String(result.task ?? 'Tarea')}" movida a ${String(result.newStatus ?? '')}.`;
    case 'grade_task':
      return `Nota ${String(result.score ?? '')}/20 guardada en "${String(result.task ?? '')}".`;
    case 'navigate_to':
      return `Vista abierta: ${String(result.navigatedTo ?? '')}.`;
    default:
      return `Acción ${name} completada.`;
  }
}

export default function VoiceWebMcpAssistant() {
  const router = useRouter();
  const { showToast } = useToast();

  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);

  const toolsRef = useRef<StudyMateToolDefinition[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlayTimeRef = useRef<number>(0);
  const isMutedRef = useRef<boolean>(false);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  useEffect(() => {
    const tools = createStudyMateTools((path) => router.push(path));
    toolsRef.current = tools;
    registerNativeWebMcpTools(tools);
  }, [router]);

  const appendOrUpdateTranscript = useCallback(
    (role: 'user' | 'assistant', chunk: string) => {
      if (!chunk) return;
      setEntries((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === role) {
          return [
            ...prev.slice(0, -1),
            { ...last, text: `${last.text}${chunk}` },
          ];
        }
        return [
          ...prev.slice(-18),
          {
            id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role,
            text: chunk,
          },
        ];
      });
    },
    []
  );

  const addActionEntry = useCallback((text: string) => {
    setEntries((prev) => [
      ...prev.slice(-18),
      {
        id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'action',
        text,
      },
    ]);
  }, []);

  const stopAllPlayback = useCallback(() => {
    for (const source of activeSourcesRef.current) {
      try {
        source.stop();
      } catch {
        // Nodo ya detenido
      }
    }
    activeSourcesRef.current.clear();
    if (playbackCtxRef.current) {
      nextPlayTimeRef.current = playbackCtxRef.current.currentTime;
    } else {
      nextPlayTimeRef.current = 0;
    }
  }, []);

  const cleanupSession = useCallback(() => {
    stopAllPlayback();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (captureCtxRef.current) {
      captureCtxRef.current.close().catch(() => {});
      captureCtxRef.current = null;
    }
    if (playbackCtxRef.current) {
      playbackCtxRef.current.close().catch(() => {});
      playbackCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setIsMuted(false);
    setSessionState('idle');
  }, [stopAllPlayback]);

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  const scheduleAudioChunk = useCallback((base64Pcm: string) => {
    const ctx = playbackCtxRef.current;
    if (!ctx) return;

    const pcm16 = base64ToInt16Array(base64Pcm);
    if (pcm16.length === 0) return;

    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + audioBuffer.duration;

    activeSourcesRef.current.add(source);
    setSessionState('speaking');

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (
        activeSourcesRef.current.size === 0 &&
        wsRef.current?.readyState === WebSocket.OPEN
      ) {
        setSessionState('listening');
      }
    };
  }, []);

  const startVoiceSession = async () => {
    if (sessionState !== 'idle') return;
    setEntries([]);
    setIsPanelOpen(true);
    setSessionState('connecting');

    try {
      const tokenRes = await fetch('/api/live-token', { method: 'POST' });
      const tokenData = (await tokenRes.json()) as {
        wsUrl?: string;
        model?: string;
        error?: string;
      };

      if (!tokenRes.ok || !tokenData.wsUrl || !tokenData.model) {
        showToast(
          tokenData.error || 'No se pudo iniciar el asistente de voz',
          'error'
        );
        setSessionState('idle');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const captureCtx = new AudioContext({ sampleRate: 16000 });
      captureCtxRef.current = captureCtx;
      const playbackCtx = new AudioContext({ sampleRate: 24000 });
      playbackCtxRef.current = playbackCtx;
      nextPlayTimeRef.current = playbackCtx.currentTime;

      const ws = new WebSocket(tokenData.wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        const functionDeclarations = toolsRef.current.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        }));

        ws.send(
          JSON.stringify({
            setup: {
              model: tokenData.model,
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: 'Aoede',
                    },
                  },
                },
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction: {
                parts: [
                  {
                    text: 'Eres StudyMate, el asistente académico por voz de la Universidad ESAN. Responde siempre en español de forma breve, clara y natural. Tienes acceso directo a las herramientas WebMCP de la aplicación para listar cursos, consultar promedios en escala vigesimal (0 a 20), crear evaluaciones, mover tarjetas en el Kanban, registrar notas y navegar entre vistas. Cuando el usuario pida una acción, ejecuta la herramienta correspondiente de inmediato y confirma el resultado en pocas palabras.',
                  },
                ],
              },
              tools: [{ functionDeclarations }],
            },
          })
        );

        const source = captureCtx.createMediaStreamSource(stream);
        const processor = captureCtx.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;
          const input = event.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const clamped = Math.max(-1, Math.min(1, input[i]));
            pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
          }

          ws.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [
                  {
                    mimeType: 'audio/pcm;rate=16000',
                    data: arrayBufferToBase64(pcm16.buffer),
                  },
                ],
              },
            })
          );
        };

        source.connect(processor);
        processor.connect(captureCtx.destination);
        setSessionState('listening');
      };

      ws.onmessage = async (event) => {
        try {
          const rawText =
            typeof event.data === 'string'
              ? event.data
              : await (event.data as Blob).text();
          const msg = JSON.parse(rawText) as {
            serverContent?: {
              interrupted?: boolean;
              inputTranscription?: { text?: string };
              outputTranscription?: { text?: string };
              modelTurn?: {
                parts?: Array<{
                  inlineData?: { mimeType?: string; data?: string };
                }>;
              };
            };
            toolCall?: {
              functionCalls?: Array<{
                id: string;
                name: string;
                args?: Record<string, unknown>;
              }>;
            };
          };

          if (msg.serverContent?.interrupted) {
            stopAllPlayback();
            setSessionState('listening');
          }

          if (msg.serverContent?.inputTranscription?.text) {
            appendOrUpdateTranscript(
              'user',
              msg.serverContent.inputTranscription.text
            );
          }

          if (msg.serverContent?.outputTranscription?.text) {
            appendOrUpdateTranscript(
              'assistant',
              msg.serverContent.outputTranscription.text
            );
          }

          const parts = msg.serverContent?.modelTurn?.parts;
          if (parts) {
            for (const part of parts) {
              if (
                part.inlineData?.data &&
                part.inlineData.mimeType?.startsWith('audio/pcm')
              ) {
                scheduleAudioChunk(part.inlineData.data);
              }
            }
          }

          const calls = msg.toolCall?.functionCalls;
          if (calls && calls.length > 0) {
            const functionResponses = [];
            for (const call of calls) {
              const tool = toolsRef.current.find((t) => t.name === call.name);
              let result: Record<string, unknown>;
              if (!tool) {
                result = {
                  ok: false,
                  error: `Herramienta ${call.name} no encontrada.`,
                };
              } else {
                try {
                  result = await tool.execute(call.args || {});
                } catch (err) {
                  result = {
                    ok: false,
                    error:
                      err instanceof Error
                        ? err.message
                        : 'Error ejecutando la acción.',
                  };
                }
              }
              addActionEntry(summarizeToolAction(call.name, result));
              functionResponses.push({
                id: call.id,
                name: call.name,
                response: { result },
              });
            }

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ toolResponse: { functionResponses } }));
            }
          }
        } catch (err) {
          console.error('Error procesando mensaje Gemini Live:', err);
        }
      };

      ws.onerror = () => {
        showToast('Error de conexión con Gemini 3.8 Live', 'error');
        cleanupSession();
      };

      ws.onclose = () => {
        cleanupSession();
      };
    } catch (err) {
      console.error('Error iniciando micrófono/voz:', err);
      showToast('Permite el acceso al micrófono para usar la voz', 'error');
      cleanupSession();
    }
  };

  if (sessionState === 'idle') {
    return (
      <button
        type="button"
        onClick={startVoiceSession}
        aria-label="Activar asistente de voz WebMCP"
        title="Controlar StudyMate por voz (WebMCP + Gemini 3.8 Live)"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#C8102E] hover:bg-[#A60D25] text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
      >
        <Mic className="w-4 h-4" />
        <span>Voz WebMCP</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
      {/* Mini chat flotante de transcripción y acciones */}
      {isPanelOpen && (
        <section
          aria-label="Actividad del asistente de voz"
          className="w-80 sm:w-96 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111114]/95 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Cabecera */}
          <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2">
              {sessionState === 'connecting' ? (
                <Loader2 className="w-3.5 h-3.5 text-[#C8102E] animate-spin" />
              ) : sessionState === 'speaking' ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8102E] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8102E]" />
                </span>
              )}
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {sessionState === 'connecting'
                  ? 'Conectando...'
                  : sessionState === 'speaking'
                    ? 'Hablando...'
                    : isMuted
                      ? 'Silenciado'
                      : 'Escuchando...'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                aria-label={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isMuted
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                aria-label="Minimizar chat de voz"
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Feed de mensajes y acciones WebMCP */}
          <div className="p-3.5 space-y-2.5 max-h-64 overflow-y-auto text-xs">
            {entries.length === 0 ? (
              <p className="text-zinc-400 dark:text-zinc-500 text-center py-4">
                Habla ahora. Puedes interrumpir en cualquier momento.
              </p>
            ) : (
              entries.map((entry) => {
                if (entry.role === 'action') {
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-2 px-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{entry.text}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={entry.id}
                    className={`px-3 py-2 rounded-xl border leading-relaxed ${
                      entry.role === 'user'
                        ? 'bg-zinc-50 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 font-medium'
                    }`}
                  >
                    {entry.text}
                  </div>
                );
              })
            )}
            <div ref={feedEndRef} />
          </div>

          {/* Pie de sugerencia */}
          <div className="px-3.5 py-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 text-[11px] text-zinc-400 dark:text-zinc-500">
            Prueba: &ldquo;ponle 18 al parcial&rdquo; o &ldquo;abre el tablero&rdquo;
          </div>
        </section>
      )}

      {/* Botón rojo inferior derecha Parar / Abrir panel */}
      <div className="flex items-center gap-2">
        {!isPanelOpen && (
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="px-3 py-2 rounded-full bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-md cursor-pointer"
          >
            Ver chat
          </button>
        )}
        <button
          type="button"
          onClick={cleanupSession}
          aria-label="Detener asistente de voz"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#C8102E] hover:bg-[#A60D25] text-white text-xs font-semibold shadow-lg transition-colors cursor-pointer"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Parar</span>
        </button>
      </div>
    </div>
  );
}
