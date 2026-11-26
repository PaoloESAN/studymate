'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Loader2,
  Volume2,
  X,
  Square,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  createStudyMateTools,
  registerNativeWebMcpTools,
  STUDYMATE_AGENT_STATE_EVENT,
  StudyMateToolDefinition,
} from '@/lib/webmcp';
import { useToast } from '@/app/providers';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking';

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant' | 'action';
  text: string;
  source?: 'text' | 'voice';
}

function trimHistorySafely(history: GeminiContent[], maxItems = 16): GeminiContent[] {
  if (history.length <= maxItems) return history;
  const start = history.length - maxItems;
  for (let i = start; i < history.length; i++) {
    const turn = history[i];
    if (
      turn.role === 'user' &&
      turn.parts.every((p) => !p.functionResponse)
    ) {
      return history.slice(i);
    }
  }
  return [];
}

interface GeminiContentPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: { result: unknown } };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

function subscribeAgentState(callback: () => void) {
  window.addEventListener(STUDYMATE_AGENT_STATE_EVENT, callback);
  return () =>
    window.removeEventListener(STUDYMATE_AGENT_STATE_EVENT, callback);
}

function getAgentUnlocked(): boolean {
  try {
    return localStorage.getItem('studymate_agent_unlocked') === 'true';
  } catch {
    return false;
  }
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

function downsampleTo16k(
  input: Float32Array,
  inputRate: number
): Int16Array {
  if (inputRate === 16000) {
    const pcm = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const clamped = Math.max(-1, Math.min(1, input[i]));
      pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
    return pcm;
  }

  const ratio = inputRate / 16000;
  const outputLength = Math.floor(input.length / ratio);
  const pcm = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const idx = Math.floor(i * ratio);
    const clamped = Math.max(-1, Math.min(1, input[idx]));
    pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return pcm;
}

const WORKLET_CODE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel && channel.length > 0) {
      this.port.postMessage(new Float32Array(channel));
    }
    return true;
  }
}
registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
`;

function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} className="font-bold text-zinc-950 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={idx} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

function renderFormattedMessage(raw: string): React.ReactNode {
  // Normaliza listas inline como ": * **Curso:**" a líneas separadas
  const normalized = raw
    .replace(/:\s+\*\s+/g, ':\n* ')
    .replace(/\s+\*\s+(?=\*\*)/g, '\n* ');

  const lines = normalized.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (keyPrefix: number) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${keyPrefix}`} className="list-disc pl-4 space-y-1">
        {listItems.map((item, i) => (
          <li key={i}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
    } else {
      flushList(idx);
      if (trimmed.length > 0) {
        blocks.push(<p key={`p-${idx}`}>{renderInlineMarkdown(trimmed)}</p>);
      }
    }
  });
  flushList(lines.length);

  return <div className="space-y-1.5">{blocks}</div>;
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
    case 'delete_course':
      return `Asignatura "${String(result.deletedCourse ?? '')}" eliminada.`;
    case 'create_task':
      return `Evaluación agregada en ${String(result.course ?? 'el curso')}.`;
    case 'edit_task':
      return `Evaluación "${String(result.task ?? '')}" actualizada.`;
    case 'delete_task':
      return `Evaluación "${String(result.deletedTask ?? '')}" eliminada.`;
    case 'move_task_status':
      return `"${String(result.task ?? 'Tarea')}" movida a ${String(result.newStatus ?? '')}.`;
    case 'grade_task':
      return `Nota ${String(result.score ?? '')}/20 guardada en "${String(result.task ?? '')}".`;
    case 'set_target_grade':
      return `Simulador ajustado a nota objetivo ${String(result.targetGrade ?? '')}/20.`;
    case 'filter_kanban':
      return 'Filtro aplicado en el tablero Kanban.';
    case 'set_theme':
      return `Tema cambiado a modo ${result.theme === 'light' ? 'claro' : 'oscuro'}.`;
    case 'navigate_to':
      return `Vista abierta: ${String(result.navigatedTo ?? '')}.`;
    case 'logout':
      return 'Cerrando sesión...';
    default:
      return `Acción ${name} completada.`;
  }
}

export default function VoiceWebMcpAssistant() {
  const router = useRouter();
  const { showToast } = useToast();

  const agentUnlocked = useSyncExternalStore(
    subscribeAgentState,
    getAgentUnlocked,
    () => false
  );

  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isSendingText, setIsSendingText] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);

  const toolsRef = useRef<StudyMateToolDefinition[]>([]);
  const textHistoryRef = useRef<GeminiContent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlayTimeRef = useRef<number>(0);
  const isMutedRef = useRef<boolean>(false);
  const setupCompleteRef = useRef<boolean>(false);
  const sessionIdRef = useRef<number>(0);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, isOpen]);

  useEffect(() => {
    if (!agentUnlocked) return;
    const tools = createStudyMateTools((path) => router.push(path));
    toolsRef.current = tools;
    registerNativeWebMcpTools(tools);
  }, [router, agentUnlocked]);

  const appendOrUpdateTranscript = useCallback(
    (role: 'user' | 'assistant', chunk: string) => {
      if (!chunk) return;
      setEntries((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === role && last.source === 'voice') {
          return [
            ...prev.slice(0, -1),
            { ...last, text: `${last.text}${chunk}` },
          ];
        }
        return [
          ...prev.slice(-24),
          {
            id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role,
            text: chunk,
            source: 'voice',
          },
        ];
      });
    },
    []
  );

  const addEntry = useCallback(
    (
      role: 'user' | 'assistant' | 'action',
      text: string,
      source: 'text' | 'voice' = 'text'
    ) => {
      setEntries((prev) => [
        ...prev.slice(-24),
        {
          id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role,
          text,
          source,
        },
      ]);
    },
    []
  );

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

  const stopVoiceSession = useCallback(() => {
    sessionIdRef.current += 1;
    stopAllPlayback();

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
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
    setupCompleteRef.current = false;
    setVoiceState('idle');
  }, [stopAllPlayback]);

  useEffect(() => {
    const handleAgentStateChange = () => {
      if (!getAgentUnlocked()) {
        stopVoiceSession();
      }
    };
    window.addEventListener(STUDYMATE_AGENT_STATE_EVENT, handleAgentStateChange);
    return () =>
      window.removeEventListener(
        STUDYMATE_AGENT_STATE_EVENT,
        handleAgentStateChange
      );
  }, [stopVoiceSession]);

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, [stopVoiceSession]);

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
    setVoiceState('speaking');

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (
        activeSourcesRef.current.size === 0 &&
        wsRef.current?.readyState === WebSocket.OPEN
      ) {
        setVoiceState('listening');
      }
    };
  }, []);

  const executeToolByName = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      const tool = toolsRef.current.find((t) => t.name === name);
      if (!tool) {
        return { ok: false, error: `Herramienta ${name} no encontrada.` };
      }
      try {
        return await tool.execute(args);
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Error ejecutando la acción.',
        };
      }
    },
    []
  );

  const startVoiceSession = async () => {
    if (voiceState !== 'idle') return;
    const currentSessionId = ++sessionIdRef.current;
    setIsOpen(true);
    setVoiceState('connecting');

    try {
      const tokenRes = await fetch('/api/live-token', { method: 'POST' });
      const tokenData = (await tokenRes.json()) as {
        wsUrl?: string;
        model?: string;
        error?: string;
      };

      if (sessionIdRef.current !== currentSessionId) return;

      if (!tokenRes.ok || !tokenData.wsUrl || !tokenData.model) {
        showToast(
          tokenData.error || 'No se pudo iniciar la voz del agente',
          'error'
        );
        setVoiceState('idle');
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
      if (sessionIdRef.current !== currentSessionId) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      micStreamRef.current = stream;

      const captureCtx = new AudioContext({ sampleRate: 16000 });
      await captureCtx.resume();
      if (sessionIdRef.current !== currentSessionId) {
        captureCtx.close().catch(() => {});
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      captureCtxRef.current = captureCtx;
      const playbackCtx = new AudioContext({ sampleRate: 24000 });
      await playbackCtx.resume();
      if (sessionIdRef.current !== currentSessionId) {
        playbackCtx.close().catch(() => {});
        captureCtx.close().catch(() => {});
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      playbackCtxRef.current = playbackCtx;
      nextPlayTimeRef.current = playbackCtx.currentTime;

      const ws = new WebSocket(tokenData.wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
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
                    text: 'Eres StudyMate, el agente académico por voz de la Universidad ESAN. Responde siempre en español de forma breve, clara y natural. Tienes acceso directo a las herramientas WebMCP de toda la aplicación: listar cursos, consultar promedios en escala vigesimal (0 a 20), crear o eliminar asignaturas, crear, editar o eliminar evaluaciones, mover tarjetas en el Kanban, filtrar el tablero, registrar notas, ajustar el simulador de nota objetivo, cambiar entre modo claro y oscuro, navegar entre vistas y cerrar sesión. Cuando el usuario pida una acción, ejecuta la herramienta correspondiente de inmediato y confirma el resultado en pocas palabras.',
                  },
                ],
              },
              tools: [{ functionDeclarations }],
            },
          })
        );

        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        try {
          await captureCtx.audioWorklet.addModule(workletUrl);
        } finally {
          URL.revokeObjectURL(workletUrl);
        }

        const source = captureCtx.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(
          captureCtx,
          'pcm-capture-processor'
        );
        workletNodeRef.current = workletNode;

        let pendingSamples: number[] = [];
        const TARGET_CHUNK_SAMPLES = 1600;

        workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
          if (
            isMutedRef.current ||
            !setupCompleteRef.current ||
            ws.readyState !== WebSocket.OPEN
          ) {
            return;
          }

          const pcm16 = downsampleTo16k(event.data, captureCtx.sampleRate);
          for (let i = 0; i < pcm16.length; i++) {
            pendingSamples.push(pcm16[i]);
          }

          if (pendingSamples.length >= TARGET_CHUNK_SAMPLES) {
            const chunk = new Int16Array(pendingSamples);
            pendingSamples = [];

            ws.send(
              JSON.stringify({
                realtimeInput: {
                  audio: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: arrayBufferToBase64(chunk.buffer),
                  },
                },
              })
            );
          }
        };

        source.connect(workletNode);
        workletNode.connect(captureCtx.destination);
      };

      ws.onmessage = async (event) => {
        try {
          const rawText =
            typeof event.data === 'string'
              ? event.data
              : await (event.data as Blob).text();
          const msg = JSON.parse(rawText) as {
            setupComplete?: Record<string, unknown>;
            error?: { message?: string };
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

          if (msg.setupComplete) {
            setupCompleteRef.current = true;
            setVoiceState('listening');
            addEntry('action', 'Voz conectada. Ya puedes hablar.');
          } else if (msg.error) {
            addEntry(
              'action',
              `Error servidor: ${msg.error.message || 'desconocido'}`
            );
          }

          if (msg.serverContent?.interrupted) {
            stopAllPlayback();
            setVoiceState('listening');
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
              const result = await executeToolByName(
                call.name,
                call.args || {}
              );
              addEntry('action', summarizeToolAction(call.name, result));
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
        showToast('Error de conexión con voz en vivo', 'error');
        stopVoiceSession();
      };

      ws.onclose = () => {
        stopVoiceSession();
      };
    } catch (err) {
      console.error('Error iniciando micrófono/voz:', err);
      showToast('Permite el acceso al micrófono para usar la voz', 'error');
      stopVoiceSession();
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = textInput.trim();
    if (!message || isSendingText || voiceState === 'connecting') return;

    setTextInput('');
    addEntry('user', message, 'text');

    // Si hay una sesión de voz en vivo activa, enviar el texto al mismo WebSocket
    // para mantener un solo contexto y evitar colisiones entre dos modelos a la vez.
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      setupCompleteRef.current
    ) {
      stopAllPlayback();
      wsRef.current.send(
        JSON.stringify({
          clientContent: {
            turns: [{ role: 'user', parts: [{ text: message }] }],
            turnComplete: true,
          },
        })
      );
      return;
    }

    setIsSendingText(true);

    const functionDeclarations = toolsRef.current.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    }));

    const nextHistory: GeminiContent[] = [
      ...textHistoryRef.current,
      { role: 'user', parts: [{ text: message }] },
    ];

    try {
      let currentHistory = nextHistory;
      let loops = 0;

      while (loops < 4) {
        loops += 1;
        const res = await fetch('/api/agent-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: currentHistory,
            functionDeclarations,
          }),
        });

        const data = (await res.json()) as {
          text?: string;
          functionCalls?: Array<{ name: string; args?: Record<string, unknown> }>;
          modelParts?: GeminiContentPart[];
          error?: string;
        };

        if (!res.ok) {
          addEntry('action', data.error || 'Error al procesar el mensaje.');
          break;
        }

        if (data.modelParts && data.modelParts.length > 0) {
          currentHistory = [
            ...currentHistory,
            { role: 'model', parts: data.modelParts },
          ];
        }

        if (data.functionCalls && data.functionCalls.length > 0) {
          const responseParts: GeminiContentPart[] = [];
          for (const call of data.functionCalls) {
            const result = await executeToolByName(call.name, call.args || {});
            addEntry('action', summarizeToolAction(call.name, result));
            responseParts.push({
              functionResponse: {
                name: call.name,
                response: { result },
              },
            });
          }
          currentHistory = [
            ...currentHistory,
            { role: 'user', parts: responseParts },
          ];
          continue;
        }

        if (data.text) {
          addEntry('assistant', data.text);
        }
        break;
      }

      textHistoryRef.current = trimHistorySafely(currentHistory, 16);
    } catch {
      addEntry('action', 'Error de conexión con el agente de texto.');
    } finally {
      setIsSendingText(false);
    }
  };

  if (!agentUnlocked) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        {voiceState !== 'idle' && (
          <button
            type="button"
            onClick={stopVoiceSession}
            aria-label="Detener voz"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold shadow-lg transition-all cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Parar</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir Agente"
          title="Abrir Agente (Voz y Chat IA)"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#C8102E] hover:bg-[#A60D25] text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
        >
          {voiceState !== 'idle' ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{voiceState !== 'idle' ? 'Voz activa' : 'Agente'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
      <section
        aria-label="Chat del Agente"
        className="w-80 sm:w-96 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111114]/95 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Cabecera */}
        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2">
            {voiceState === 'connecting' || isSendingText ? (
              <Loader2 className="w-3.5 h-3.5 text-[#C8102E] animate-spin" />
            ) : voiceState === 'speaking' ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            ) : voiceState === 'listening' ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8102E] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8102E]" />
              </span>
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#C8102E]" />
            )}
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {voiceState === 'connecting'
                ? 'Conectando voz...'
                : voiceState === 'speaking'
                  ? 'Hablando...'
                  : voiceState === 'listening'
                    ? isMuted
                      ? 'Voz silenciada'
                      : 'Escuchando...'
                    : isSendingText
                      ? 'Pensando...'
                      : 'Agente'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {voiceState !== 'idle' ? (
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                aria-label={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
                title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isMuted
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceSession}
                aria-label="Activar modo voz"
                title="Hablar por voz en tiempo real"
                className="p-1.5 rounded-lg text-zinc-600 hover:text-[#C8102E] dark:text-zinc-300 dark:hover:text-rose-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Minimizar agente"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feed de mensajes y acciones */}
        <div className="p-3.5 space-y-2.5 max-h-64 min-h-[140px] overflow-y-auto text-xs">
          {entries.length === 0 ? (
            <p className="text-zinc-400 dark:text-zinc-500 text-center py-6">
              Escribe una orden abajo o pulsa el micrófono para hablar en vivo.
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
                      : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  {entry.role === 'assistant'
                    ? renderFormattedMessage(entry.text)
                    : entry.text}
                </div>
              );
            })
          )}
          <div ref={feedEndRef} />
        </div>

        {/* Input de texto (Gemini 3.5 Flash Lite) */}
        <form
          onSubmit={handleSendText}
          className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 flex items-center gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={voiceState === 'connecting'}
            placeholder={
              voiceState === 'connecting'
                ? 'Conectando voz...'
                : voiceState !== 'idle'
                  ? 'Escribe al agente en vivo...'
                  : 'Escribe una orden (ej. simula 18)...'
            }
            aria-label="Mensaje para el agente"
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/40 focus:border-[#C8102E]"
          />
          <button
            type="submit"
            disabled={isSendingText || voiceState === 'connecting' || !textInput.trim()}
            aria-label="Enviar mensaje"
            className="p-2 rounded-xl bg-[#C8102E] hover:bg-[#A60D25] text-white disabled:opacity-40 transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>

      {/* Botón rojo inferior derecha cuando la voz está activa */}
      {voiceState !== 'idle' && (
        <button
          type="button"
          onClick={stopVoiceSession}
          aria-label="Detener voz"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#C8102E] hover:bg-[#A60D25] text-white text-xs font-semibold shadow-lg transition-colors cursor-pointer"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Parar</span>
        </button>
      )}
    </div>
  );
}
