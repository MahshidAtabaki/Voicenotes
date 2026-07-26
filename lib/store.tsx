"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { organize } from "./api";
import {
  apiCreateCapture,
  apiDeleteCapture,
  apiListCaptures,
  apiSetItemShared,
  apiUpdateCapture,
  apiUpdateItem,
  getAudioUrl,
  hasSession,
  signInDemo,
  signOutSupabase,
  supabaseEnabled,
  transcribeAudio,
  uploadAudio,
  removeAudio,
} from "./data";
import { topicsToReviewItems } from "./organize";
import { speak, stopSpeaking } from "./tts";
import { demoTranscriptWords, seedReviewItems } from "./seed";
import { seedCaptures } from "./seed";
import { readPreviewCaptures, writePreviewCaptures } from "./local-preview";
import type {
  AppStatus,
  CaptureKind,
  CaptureSession,
  CreateCaptureInput,
  InputMode,
  LibraryFilter,
  LibrarySort,
  ReviewItem,
  Screen,
} from "./types";

const REVEAL = 190;

interface MorphState {
  left: number;
  top: number;
  d: number;
  sc: number;
}
interface MicError {
  title: string;
  body: string;
}

interface BrowserSpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface BrowserSpeechRecognitionEvent {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface State {
  authed: boolean;
  screen: Screen;
  status: AppStatus;
  inputMode: InputMode;
  captureKind: CaptureKind;
  elapsed: number;
  paused: boolean;
  micError: MicError | null;
  liveTranscript: string;
  textDraft: string;
  transcriptVisible: boolean;
  revealDelta: number;
  dragging: boolean;
  autoScroll: boolean;
  confirm: "cancel" | "type" | null;
  procStep: number;
  items: ReviewItem[];
  reviewShare: boolean;
  search: string;
  filter: LibraryFilter;
  sort: LibrarySort;
  captures: CaptureSession[];
  detailId: string | null;
  toast: string | null;
  muted: boolean;
  expanding: boolean;
  morph: MorphState | null;
  /** Storage path of the uploaded audio for the current capture (voice). */
  pendingAudioPath: string | null;
  isSamplePreview: boolean;
}

const initialState: State = {
  authed: false,
  screen: "signin",
  status: "idle",
  inputMode: "voice",
  captureKind: "voice",
  elapsed: 0,
  paused: false,
  micError: null,
  liveTranscript: "",
  textDraft: "",
  transcriptVisible: false,
  revealDelta: 0,
  dragging: false,
  autoScroll: true,
  confirm: null,
  procStep: -1,
  items: [],
  reviewShare: false,
  search: "",
  filter: "all",
  sort: "recent",
  captures: [],
  detailId: null,
  toast: null,
  muted: false,
  expanding: false,
  morph: null,
  pendingAudioPath: null,
  isSamplePreview: false,
};

export interface VCStore extends State {
  fmtTime: (s: number) => string;
  // auth / nav
  signIn: () => void;
  signOut: () => void;
  goHome: () => void;
  goLibrary: () => void;
  goSettings: () => void;
  navClick: (screen: Screen) => void;
  goCapture: (e?: { currentTarget: HTMLElement }) => void;
  // capture
  allowMic: () => void;
  startDemo: () => void;
  cancelCapture: () => void;
  togglePause: () => void;
  doneRecording: () => void;
  requestBack: () => void;
  discardBack: () => void;
  keepRecording: () => void;
  // text
  exitToText: () => void;
  startVoiceFromText: () => void;
  setTextDraft: (v: string) => void;
  sendText: () => void;
  // transcript reveal
  onWaveDown: (e: React.PointerEvent) => void;
  onWaveMove: (e: React.PointerEvent) => void;
  onWaveUp: (e: React.PointerEvent) => void;
  toggleTranscript: () => void;
  onTransScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  // refs
  setWaveEl: (el: HTMLCanvasElement | null) => void;
  setTaEl: (el: HTMLTextAreaElement | null) => void;
  setTransEl: (el: HTMLDivElement | null) => void;
  // review
  editField: (id: string, field: "title" | "summary", val: string) => void;
  toggleEmotion: (id: string, tag: string) => void;
  removeTopic: (id: string, tag: string) => void;
  addTopic: (id: string, tag: string) => void;
  removeItem: (id: string) => void;
  toggleReviewShare: () => void;
  saveAll: () => void;
  cancelReview: () => void;
  openTranscript: () => void;
  playAudio: () => void;
  retryProcessing: () => void;
  // saved
  captureAnother: () => void;
  viewSaved: () => void;
  // library
  setSearch: (v: string) => void;
  setFilter: (f: LibraryFilter) => void;
  setSort: (s: LibrarySort) => void;
  openDetail: (id: string) => void;
  // detail
  backFromDetail: () => void;
  deleteCapture: () => void;
  archiveCapture: () => void;
  toggleItemShare: (id: string) => void;
  updateSavedField: (field: "title" | "summary", value: string) => void;
  updateSavedItemField: (id: string, field: "title" | "summary", value: string) => void;
  // settings
  toggleMute: () => void;
  goTherapist: () => void;
  backFromTherapist: () => void;
}

const Ctx = createContext<VCStore | null>(null);

export function useVC(): VCStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("useVC must be used within <VCProvider>");
  return v;
}

function reduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function VCProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initialState);

  // functional patch (mirrors setState semantics of the source prototype)
  const stateRef = useRef<State>(initialState);
  stateRef.current = s;
  const patch = useCallbackSafe(
    (p: Partial<State> | ((prev: State) => Partial<State>)) => {
      setS((prev) => ({
        ...prev,
        ...(typeof p === "function" ? p(prev) : p),
      }));
    },
  );

  // --- imperative refs (non-render state) ---
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptT = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const procTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const buf = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const raf = useRef<number | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const speechRecognition = useRef<BrowserSpeechRecognition | null>(null);
  const speechFinal = useRef("");
  const chunks = useRef<Blob[]>([]);
  const audioBlob = useRef<Blob | null>(null);
  const fakeAudio = useRef<boolean>(false);
  const previewStorageInitialized = useRef(false);
  const bars = useRef<number[]>(new Array(48).fill(2));

  const drawLoopRef = useRef<() => void>(() => {});
  const playbackEl = useRef<HTMLAudioElement | null>(null);
  const waveEl = useRef<HTMLCanvasElement | null>(null);
  const taEl = useRef<HTMLTextAreaElement | null>(null);
  const transEl = useRef<HTMLDivElement | null>(null);
  const tIdx = useRef<number>(0);

  // wave-drag state
  const wd = useRef(false);
  const wmoved = useRef(false);
  const wsy = useRef(0);
  const wbase = useRef(0);
  const wly = useRef(0);
  const wt = useRef(0);
  const wvel = useRef(0);

  // ---------- timers / teardown ----------
  const clearTimers = useCallbackSafe(() => {
    if (tick.current) clearInterval(tick.current);
    if (transcriptT.current) clearInterval(transcriptT.current);
    if (promptT.current) clearTimeout(promptT.current);
    procTimers.current.forEach(clearTimeout);
    procTimers.current = [];
  });

  const teardownMic = useCallbackSafe(() => {
    if (speechRecognition.current) {
      try {
        speechRecognition.current.stop();
      } catch {
        /* noop */
      }
      speechRecognition.current = null;
    }
    if (raf.current) cancelAnimationFrame(raf.current);
    if (recorder.current && recorder.current.state !== "inactive") {
      try {
        recorder.current.stop();
      } catch {
        /* noop */
      }
    }
    recorder.current = null;
    if (stream.current) {
      stream.current.getTracks().forEach((t) => t.stop());
      stream.current = null;
    }
    if (audioCtx.current && audioCtx.current.state !== "closed") {
      audioCtx.current.close();
      audioCtx.current = null;
    }
    fakeAudio.current = false;
    analyser.current = null;
    if (tick.current) clearInterval(tick.current);
    if (transcriptT.current) clearInterval(transcriptT.current);
  });

  useEffect(() => {
    return () => {
      teardownMic();
      clearTimers();
      stopSpeaking();
      if (playbackEl.current) playbackEl.current.pause();
      if (toastT.current) clearTimeout(toastT.current);
      if (expandT.current) clearTimeout(expandT.current);
    };
  }, [teardownMic, clearTimers]);

  useEffect(() => {
    if (supabaseEnabled) return;
    if (!previewStorageInitialized.current) {
      previewStorageInitialized.current = true;
      const saved = readPreviewCaptures(localStorage);
      patch({ captures: saved ?? seedCaptures() });
      return;
    }
    writePreviewCaptures(localStorage, s.captures);
  }, [s.captures, patch]);

  // Restore an existing Supabase session on load so a signed-in user lands home.
  useEffect(() => {
    if (!supabaseEnabled) return;
    let active = true;
    (async () => {
      if (!(await hasSession())) return;
      let captures: CaptureSession[] = [];
      try {
        captures = await apiListCaptures();
      } catch {
        /* ignore */
      }
      if (active) patch({ authed: true, screen: "home", captures });
    })();
    return () => {
      active = false;
    };
    // patch is stable; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- waveform ----------
  const drawLoop = useCallbackSafe(() => {
    const el = waveEl.current;
    if (!el || (!analyser.current && !fakeAudio.current)) {
      raf.current = requestAnimationFrame(() => drawLoopRef.current());
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    const w = el.clientWidth,
      h = el.clientHeight;
    if (el.width !== w * dpr) {
      el.width = w * dpr;
      el.height = h * dpr;
    }
    const ctx = el.getContext("2d");
    if (!ctx) {
      raf.current = requestAnimationFrame(() => drawLoopRef.current());
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const st = stateRef.current;
    let amp = 0;
    if (!st.paused && st.inputMode !== "text") {
      if (analyser.current && buf.current) {
        analyser.current.getByteTimeDomainData(buf.current);
        let sum = 0;
        for (let i = 0; i < buf.current.length; i++) {
          const v = (buf.current[i] - 128) / 128;
          sum += v * v;
        }
        amp = Math.sqrt(sum / buf.current.length);
      } else if (fakeAudio.current) {
        const t = Date.now() / 1000;
        amp =
          0.12 +
          0.09 * Math.abs(Math.sin(t * 2.3)) +
          0.06 * Math.abs(Math.sin(t * 5.7)) +
          Math.random() * 0.03;
      }
    }
    const target = st.paused ? 0 : Math.min(1, amp * 3.2);
    const arr = bars.current;
    const n = arr.length,
      gap = w / n;
    for (let i = 0; i < n; i++) {
      const dist = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
      const shape = Math.pow(1 - dist, 1.4);
      const noise = 0.55 + 0.45 * Math.sin(i * 1.7 + Date.now() / 180);
      const goal = 2 + target * h * 0.9 * shape * (0.55 + 0.45 * noise);
      arr[i] += (goal - arr[i]) * 0.35;
      const bh = Math.max(2, arr[i]);
      const x = i * gap + gap * 0.25,
        bw = gap * 0.5;
      ctx.fillStyle = st.paused
        ? "rgba(255,255,255,.22)"
        : `rgba(130,195,255,${0.6 + 0.4 * shape})`;
      const y = h / 2 - bh / 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, bw / 2);
      else ctx.rect(x, y, bw, bh);
      ctx.fill();
    }
    raf.current = requestAnimationFrame(() => drawLoopRef.current());
  });

  useEffect(() => {
    drawLoopRef.current = drawLoop;
  }, [drawLoop]);

  // Sample-preview transcript. Never called for microphone recordings.
  const startTranscript = useCallbackSafe(() => {
    const words = demoTranscriptWords();
    tIdx.current = 0;
    if (transcriptT.current) clearInterval(transcriptT.current);
    transcriptT.current = setInterval(() => {
      const st = stateRef.current;
      if (st.paused || st.inputMode === "text") return;
      if (tIdx.current >= words.length) return;
      const w = words[tIdx.current];
      tIdx.current++;
      patch((prev) => ({
        liveTranscript: (prev.liveTranscript ? prev.liveTranscript + " " : "") + w,
      }));
    }, 620);
  });

  // ---------- recording ----------
  const beginTick = useCallbackSafe(() => {
    if (tick.current) clearInterval(tick.current);
    tick.current = setInterval(() => {
      const st = stateRef.current;
      if (!st.paused && st.inputMode !== "text") {
        patch((prev) => ({ elapsed: prev.elapsed + 1 }));
      }
    }, 1000);
  });

  const startLiveSpeechRecognition = useCallbackSafe(() => {
    const speechWindow = window as unknown as {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };
    const SpeechRecognitionCtor =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    try {
      const recognition = new SpeechRecognitionCtor();
      speechFinal.current = "";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-GB";
      recognition.onresult = (event) => {
        let finalText = "";
        let interimText = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result?.[0]?.transcript?.trim();
          if (!text) continue;
          if (result.isFinal) finalText += `${text} `;
          else interimText += `${text} `;
        }
        speechFinal.current = finalText.trim();
        const visible = `${speechFinal.current} ${interimText}`.trim();
        if (visible) patch({ liveTranscript: visible });
      };
      recognition.onerror = () => {
        // Live text is an enhancement. The recorded audio remains the source
        // for the final ElevenLabs transcript.
      };
      recognition.onend = () => {
        speechRecognition.current = null;
      };
      recognition.start();
      speechRecognition.current = recognition;
    } catch {
      speechRecognition.current = null;
    }
  });

  const startMic = useCallbackSafe(async () => {
    patch({ micError: null });
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtx.current = new Ctor();
      const src = audioCtx.current.createMediaStreamSource(media);
      const an = audioCtx.current.createAnalyser();
      an.fftSize = 1024;
      an.smoothingTimeConstant = 0.8;
      src.connect(an);
      analyser.current = an;
      buf.current = new Uint8Array(an.fftSize);
      // MediaRecorder — preserve audio until upload succeeds
      chunks.current = [];
      audioBlob.current = null;
      try {
        const mr = new MediaRecorder(media);
        mr.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunks.current.push(ev.data);
        };
        mr.onstop = () => {
          audioBlob.current = new Blob(chunks.current, {
            type: mr.mimeType || "audio/webm",
          });
        };
        mr.start(250);
        recorder.current = mr;
      } catch {
        /* MediaRecorder unsupported — waveform still works */
      }
      patch({
        status: "recording",
        paused: false,
        elapsed: 0,
        inputMode: "voice",
      });
      startLiveSpeechRecognition();
      beginTick();
      drawLoop();
    } catch (err) {
      let title = "Microphone blocked";
      let body =
        "To record, allow microphone access for this site in your browser settings, then try again.";
      const name = (err as { name?: string })?.name;
      if (name === "NotFoundError") {
        title = "No microphone found";
        body =
          "We couldn't find a microphone on this device. Connect one and try again.";
      } else if (name === "NotAllowedError") {
        title = "Microphone access";
        body = "Please allow microphone access so we can hear your voice.";
      }
      patch({ status: "failed", micError: { title, body } });
    }
  });

  const startDemo = useCallbackSafe(() => {
    teardownMic();
    clearTimers();
    fakeAudio.current = true;
    patch({
      items: seedReviewItems(),
      reviewShare: false,
      screen: "capture",
      status: "recording",
      paused: false,
      elapsed: 0,
      inputMode: "voice",
      liveTranscript: "",
      textDraft: "",
      micError: null,
      captureKind: "voice",
      transcriptVisible: false,
      revealDelta: 0,
      confirm: null,
      autoScroll: true,
      isSamplePreview: true,
    });
    beginTick();
    drawLoop();
    startTranscript();
  });

  const allowMic = useCallbackSafe(async () => {
    await startMic();
  });

  const enterCapture = useCallbackSafe(() => {
    patch({
      screen: "capture",
      status: "requesting_microphone",
      elapsed: 0,
      inputMode: "voice",
      liveTranscript: "",
      textDraft: "",
      captureKind: "voice",
      transcriptVisible: false,
      revealDelta: 0,
      confirm: null,
      autoScroll: true,
      isSamplePreview: false,
      pendingAudioPath: null,
    });
    if (expandT.current) clearTimeout(expandT.current);
    setTimeout(() => patch({ expanding: false, morph: null }), 90);
    // Short spoken prompt (cached, silent when muted or unavailable).
    void speak("capture", stateRef.current.muted);
  });

  const goCapture = useCallbackSafe((e?: { currentTarget: HTMLElement }) => {
    const el = e?.currentTarget;
    if (!el || reduceMotion()) {
      enterCapture();
      return;
    }
    const r = el.getBoundingClientRect();
    const host = el.closest("[data-screen-host]");
    const hr = host
      ? host.getBoundingClientRect()
      : ({ left: 0, top: 0, width: r.width, height: r.height } as DOMRect);
    const cx = r.left + r.width / 2 - hr.left;
    const cy = r.top + r.height / 2 - hr.top;
    const d = Math.max(r.width, r.height);
    const diag =
      Math.hypot(Math.max(cx, hr.width - cx), Math.max(cy, hr.height - cy)) * 2;
    const sc = diag / d + 0.6;
    patch({ expanding: true, morph: { left: cx - d / 2, top: cy - d / 2, d, sc } });
    if (expandT.current) clearTimeout(expandT.current);
    expandT.current = setTimeout(() => enterCapture(), 500);
  });

  const cancelCapture = useCallbackSafe(() => {
    const path = stateRef.current.pendingAudioPath;
    if (path) void removeAudio(path).catch(() => patch({ toast: "Could not remove uploaded audio; please retry" }));
    stopSpeaking();
    teardownMic();
    clearTimers();
    audioBlob.current = null;
    patch({
      screen: "home",
      status: "idle",
      elapsed: 0,
      paused: false,
      micError: null,
      pendingAudioPath: null,
    });
  });

  const togglePause = useCallbackSafe(() => {
    patch((prev) => ({
      paused: !prev.paused,
      status: !prev.paused ? "paused" : "recording",
    }));
    const st = stateRef.current;
    if (recorder.current && recorder.current.state !== "inactive") {
      try {
        if (!st.paused) recorder.current.pause();
        else recorder.current.resume();
      } catch {
        /* pause/resume unsupported */
      }
    }
  });

  // ---------- processing pipeline (organise → review) ----------
  // startStep: text begins at 0; voice begins at 2 (upload/transcribe already
  // happened in doneRecording and advanced the first two checklist steps).
  const runPipeline = useCallbackSafe(
    async (kind: CaptureKind, input: string, startStep: number) => {
      const TOTAL = 4;
      const started = Date.now();
      procTimers.current.forEach(clearTimeout);
      procTimers.current = [];
      patch({ status: "organising", procStep: startStep });

      // advance the remaining checklist steps visually while we await the model
      let acc = 0;
      for (let step = startStep + 1; step < TOTAL; step++) {
        acc += 900;
        const target = step;
        procTimers.current.push(setTimeout(() => patch({ procStep: target }), acc));
      }
      const stepsDoneMs = acc;

      try {
        const result = await organize(input, kind);
        const items = topicsToReviewItems(result, kind);
        if (items.length === 0) throw new Error("empty");
        const wait = Math.max(0, stepsDoneMs - (Date.now() - started));
        setTimeout(() => {
          procTimers.current.forEach(clearTimeout);
          patch({
            items,
            screen: "review",
            status: "reviewing",
            procStep: TOTAL,
          });
        }, wait);
      } catch {
        procTimers.current.forEach(clearTimeout);
        patch({ status: "failed", micError: null, procStep: -1 });
      }
    },
  );

  // Stop the recorder and resolve with the fully-assembled audio blob.
  const finalizeAudio = useCallbackSafe((): Promise<Blob | null> => {
    const mr = recorder.current;
    if (!mr || mr.state === "inactive") return Promise.resolve(audioBlob.current);
    return new Promise<Blob | null>((resolve) => {
      mr.addEventListener("stop", () => resolve(audioBlob.current), { once: true });
      try {
        mr.stop();
      } catch {
        resolve(audioBlob.current);
      }
    });
  });

  const doneRecording = useCallbackSafe(async () => {
    stopSpeaking();
    if (fakeAudio.current) {
      teardownMic(); clearTimers();
      patch({ items: seedReviewItems(), screen: "review", status: "reviewing", captureKind: "voice" });
      return;
    }
    // Preserve audio until upload/transcription — assemble the blob first.
    const blob = await finalizeAudio();
    teardownMic();
    clearTimers();
    if (!blob?.size) {
      patch({ status: "failed", micError: { title: "Recording failed", body: "No audio was captured. Your recording has not been replaced with sample content. Please try again." } });
      return;
    }
    patch({ captureKind: "voice", status: "transcribing", procStep: 1 });

    // Real transcription (ElevenLabs Scribe). Preserve the transcript unchanged.
    let transcript: string;
    try {
      transcript = await transcribeAudio(blob) as string;
    } catch {
      // If ElevenLabs is unavailable, continue with the real words captured by
      // the browser during recording. Never replace them with sample content.
      transcript = stateRef.current.liveTranscript.trim();
      if (!transcript) {
        patch({ status: "failed", micError: null, procStep: -1 });
        return;
      }
    }
    patch({ liveTranscript: transcript });

    runPipeline("voice", transcript, 2);
  });

  const retryProcessing = useCallbackSafe(() => {
    const st = stateRef.current;
    const input =
      st.captureKind === "text" ? st.textDraft.trim() : st.liveTranscript.trim();
    if (st.captureKind === "voice" && !input && audioBlob.current) {
      patch({ status: "transcribing", procStep: 1 });
      void transcribeAudio(audioBlob.current)
        .then((text) => {
          const transcript = text?.trim() || stateRef.current.liveTranscript.trim();
          if (!transcript) throw new Error("transcription_empty");
          patch({ liveTranscript: transcript });
          runPipeline("voice", transcript, 2);
        })
        .catch(() => {
          const transcript = stateRef.current.liveTranscript.trim();
          if (transcript) runPipeline("voice", transcript, 2);
          else patch({ status: "failed", micError: null });
        });
    } else runPipeline(st.captureKind, input, st.captureKind === "voice" ? 2 : 0);
  });

  // ---------- text ----------
  const exitToText = useCallbackSafe(() => {
    teardownMic();
    if (tick.current) clearInterval(tick.current);
    patch({
      inputMode: "text",
      status: "recording",
      paused: false,
      transcriptVisible: false,
      revealDelta: 0,
      confirm: null,
    });
    requestAnimationFrame(() => taEl.current?.focus());
  });

  const startVoiceFromText = useCallbackSafe(() => {
    patch({ inputMode: "voice", transcriptVisible: false, revealDelta: 0 });
    allowMic();
  });

  const setTextDraft = useCallbackSafe((v: string) => {
    patch({ textDraft: v });
  });

  const sendText = useCallbackSafe(() => {
    const t = stateRef.current.textDraft.trim();
    if (!t) return;
    teardownMic();
    clearTimers();
    patch({
      reviewShare: false,
      captureKind: "text",
      screen: "capture",
      status: "organising",
      procStep: 0,
    });
    runPipeline("text", t, 0);
  });

  // ---------- cancel confirmation ----------
  const hasRecording = () =>
    stateRef.current.elapsed > 1 || stateRef.current.liveTranscript.length > 0;
  const requestBack = useCallbackSafe(() => {
    if (hasRecording()) patch({ confirm: "cancel" });
    else cancelCapture();
  });
  const discardBack = useCallbackSafe(() => {
    patch({ confirm: null });
    cancelCapture();
  });
  const keepRecording = useCallbackSafe(() => patch({ confirm: null }));

  // ---------- transcript reveal (drag waveform down) ----------
  const onWaveDown = useCallbackSafe((e: React.PointerEvent) => {
    if (reduceMotion()) return;
    wd.current = true;
    wmoved.current = false;
    wsy.current = e.clientY;
    wbase.current = stateRef.current.transcriptVisible ? REVEAL : 0;
    wly.current = e.clientY;
    wt.current = Date.now();
    wvel.current = 0;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    patch({ dragging: true });
  });
  const onWaveMove = useCallbackSafe((e: React.PointerEvent) => {
    if (!wd.current) return;
    const raw = wbase.current + (e.clientY - wsy.current);
    if (Math.abs(e.clientY - wsy.current) > 4) wmoved.current = true;
    const now = Date.now();
    wvel.current = (e.clientY - wly.current) / Math.max(1, now - wt.current);
    wly.current = e.clientY;
    wt.current = now;
    const dy = Math.max(0, Math.min(REVEAL, raw));
    patch({ revealDelta: dy });
  });
  const onWaveUp = useCallbackSafe(() => {
    if (!wd.current) return;
    wd.current = false;
    if (!wmoved.current) {
      patch({ dragging: false });
      return;
    }
    let open: boolean;
    if (wvel.current > 0.45) open = true;
    else if (wvel.current < -0.45) open = false;
    else open = stateRef.current.revealDelta > REVEAL * 0.42;
    patch({
      transcriptVisible: open,
      revealDelta: open ? REVEAL : 0,
      dragging: false,
    });
  });
  const toggleTranscript = useCallbackSafe(() => {
    patch((prev) => ({
      transcriptVisible: !prev.transcriptVisible,
      revealDelta: prev.transcriptVisible ? 0 : REVEAL,
    }));
  });
  const onTransScroll = useCallbackSafe((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (atBottom !== stateRef.current.autoScroll) patch({ autoScroll: atBottom });
  });

  // keep transcript scrolled to bottom while auto-scroll is on
  useEffect(() => {
    if (
      transEl.current &&
      s.autoScroll &&
      s.transcriptVisible &&
      s.status === "recording"
    ) {
      transEl.current.scrollTop = transEl.current.scrollHeight;
    }
  }, [s.liveTranscript, s.autoScroll, s.transcriptVisible, s.status]);

  // ---------- review editing ----------
  const editField = useCallbackSafe(
    (id: string, field: "title" | "summary", val: string) => {
      patch((prev) => ({
        items: prev.items.map((it) =>
          it.id === id ? { ...it, [field]: val } : it,
        ),
      }));
    },
  );
  const toggleEmotion = useCallbackSafe((id: string, tag: string) => {
    patch((prev) => ({
      items: prev.items.map((it) =>
        it.id === id
          ? {
              ...it,
              emotions: it.emotions.map((em) =>
                em.label === tag ? { ...em, confirmed: !em.confirmed } : em,
              ),
            }
          : it,
      ),
    }));
  });
  const removeTopic = useCallbackSafe((id: string, tag: string) => {
    patch((prev) => ({
      items: prev.items.map((it) =>
        it.id === id ? { ...it, topics: it.topics.filter((t) => t !== tag) } : it,
      ),
    }));
  });
  const addTopic = useCallbackSafe((id: string, tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    patch((prev) => ({
      items: prev.items.map((it) =>
        it.id === id && !it.topics.includes(clean)
          ? { ...it, topics: [...it.topics, clean] }
          : it,
      ),
    }));
  });
  const removeItem = useCallbackSafe((id: string) => {
    patch((prev) => ({ items: prev.items.filter((it) => it.id !== id) }));
  });
  const toggleReviewShare = useCallbackSafe(() =>
    patch((prev) => ({ reviewShare: !prev.reviewShare })),
  );

  const showToast = useCallbackSafe((msg: string) => {
    patch({ toast: msg });
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => patch({ toast: null }), 2200);
  });

  const saveAll = useCallbackSafe(async () => {
    const st = stateRef.current;
    if (st.isSamplePreview) {
      showToast("Sample preview cannot be saved or shared");
      return;
    }
    const items = st.items;
    const n = items.length;
    if (n === 0) return;
    const localId = `c_${Date.now()}`;
    const title = n > 1 ? "A lot on my mind" : items[0].title;
    const summary = items[0]?.summary ?? "";
    const originalText = st.captureKind === "text" ? st.textDraft.trim() : null;
    const transcript = st.captureKind === "voice" ? st.liveTranscript.trim() : null;
    const durationSeconds = st.captureKind === "voice" ? st.elapsed : null;

    patch({ status: "saving" });
    let audioPath = st.pendingAudioPath;
    if (supabaseEnabled && st.captureKind === "voice" && !audioPath) {
      try { if (!audioBlob.current) throw new Error("missing_audio"); audioPath = await uploadAudio(audioBlob.current); }
      catch { patch({ status: "reviewing" }); showToast("Audio upload failed — try saving again"); return; }
    }
    const localSession: CaptureSession = {
      id: localId,
      kind: st.captureKind,
      title,
      summary,
      originalText,
      transcript,
      audioPath,
      durationSeconds,
      shared: st.reviewShare,
      archived: false,
      createdAt: "Just now",
      items: items.map((it) => ({
        id: it.id,
        sessionId: localId,
        order: it.order,
        type: it.type,
        sourceText: it.sourceText,
        startCharacter: it.startCharacter,
        endCharacter: it.endCharacter,
        title: it.title,
        summary: it.summary,
        emotions: it.emotions,
        topics: it.topics,
        shared: st.reviewShare,
      })),
    };
    if (supabaseEnabled) {
      const input: CreateCaptureInput = {
        kind: st.captureKind,
        title,
        summary,
        originalText,
        transcript,
        audioPath,
        durationSeconds,
        shared: st.reviewShare,
        items: items.map((it) => ({
          order: it.order,
          type: it.type,
          sourceText: it.sourceText,
          startCharacter: it.startCharacter,
          endCharacter: it.endCharacter,
          title: it.title,
          summary: it.summary,
          shared: st.reviewShare,
          emotions: it.emotions,
          topics: it.topics,
        })),
      };
      try {
        const created = await apiCreateCapture(input);
        if (created) {
          patch((prev) => ({ captures: [created, ...prev.captures], detailId: created.id, pendingAudioPath: null, screen: "saved", status: "saved" }));
        }
      } catch {
        patch({ status: "reviewing", pendingAudioPath: audioPath }); showToast("Save failed — your recording is ready to retry"); return;
      }
    } else patch((prev) => ({ screen: "saved", status: "saved", captures: [localSession, ...prev.captures], detailId: localId }));
  });

  const cancelReview = useCallbackSafe(async () => {
    const path = stateRef.current.pendingAudioPath;
    let cleanupFailed = false;
    if (path) {
      try { await removeAudio(path); }
      catch { cleanupFailed = true; }
    }
    audioBlob.current = null;
    showToast(cleanupFailed ? "Capture discarded; uploaded audio cleanup failed" : "Recording discarded");
    chunks.current = [];
    patch({
      screen: "home", status: "idle", pendingAudioPath: null,
      items: [], liveTranscript: "", textDraft: "", elapsed: 0,
      reviewShare: false, isSamplePreview: false, procStep: -1,
    });
  });
  const openTranscript = useCallbackSafe(() =>
    showToast("Full transcript preserved unchanged"),
  );

  const playUrl = useCallbackSafe((url: string) => {
    try {
      if (playbackEl.current) playbackEl.current.pause();
      const el = new Audio(url);
      playbackEl.current = el;
      void el.play().catch(() => {});
    } catch {
      /* ignore */
    }
  });

  const playAudio = useCallbackSafe(async () => {
    // Just-recorded review: play the in-memory recording directly.
    if (stateRef.current.screen === "review" && audioBlob.current) {
      playUrl(URL.createObjectURL(audioBlob.current));
      showToast("▶ Playing your recording…");
      return;
    }
    // Saved capture: fetch a signed URL for the stored audio.
    const id = stateRef.current.detailId;
    if (supabaseEnabled && id) {
      const url = await getAudioUrl(id);
      if (url) {
        playUrl(url);
        showToast("▶ Playing your recording…");
        return;
      }
    }
    showToast("▶ Playing your recording…");
  });

  // ---------- saved ----------
  const captureAnother = useCallbackSafe(() => {
    patch({ items: [], reviewShare: false });
    goCapture();
  });
  const viewSaved = useCallbackSafe(() => {
    const id = stateRef.current.detailId;
    patch({ screen: "detail", detailId: id ?? null });
  });

  // ---------- nav ----------
  const goHome = useCallbackSafe(() => patch({ screen: "home", status: "idle" }));
  const goLibrary = useCallbackSafe(() => patch({ screen: "library" }));
  const goSettings = useCallbackSafe(() => patch({ screen: "settings" }));
  const navClick = useCallbackSafe((screen: Screen) => {
    if (screen === "capture") goCapture();
    else patch({ screen });
  });
  const signIn = useCallbackSafe(async () => {
    if (supabaseEnabled) {
      try {
        const ok = await signInDemo();
        if (ok) {
          let captures: CaptureSession[] = [];
          try {
            captures = await apiListCaptures();
          } catch {
            /* empty library is fine for a fresh account */
          }
          patch({ authed: true, screen: "home", captures });
          return;
        }
      } catch { /* remain signed out */ }
    }
    if (!supabaseEnabled) {
      const captures = readPreviewCaptures(localStorage) ?? seedCaptures();
      patch({ authed: true, screen: "home", captures });
      return;
    }
    showToast("Private sign-in failed. Please try again.");
  });
  const signOut = useCallbackSafe(() => {
    if (supabaseEnabled) void signOutSupabase();
    patch({ ...initialState, captures: [] });
  });

  // ---------- library / detail ----------
  const setSearch = useCallbackSafe((v: string) => patch({ search: v }));
  const setFilter = useCallbackSafe((f: LibraryFilter) => patch({ filter: f }));
  const setSort = useCallbackSafe((sort: LibrarySort) => patch({ sort }));
  const openDetail = useCallbackSafe((id: string) =>
    patch({ screen: "detail", detailId: id }),
  );
  const backFromDetail = useCallbackSafe(() => patch({ screen: "library" }));
  const deleteCapture = useCallbackSafe(async () => {
    const id = stateRef.current.detailId;
    if (!id) return;
    try { if (supabaseEnabled) await apiDeleteCapture(id); patch((prev) => ({ screen: "library", captures: prev.captures.filter((c) => c.id !== id) })); showToast("Capture deleted"); }
    catch { showToast("Delete failed — nothing was removed"); }
  });
  const archiveCapture = useCallbackSafe(async () => {
    const id = stateRef.current.detailId;
    if (!id) return;
    try { if (supabaseEnabled) await apiUpdateCapture(id, { archived: true }); patch((prev) => ({
      screen: "library",
      captures: prev.captures.map((c) =>
        c.id === id ? { ...c, archived: true } : c,
      ),
    })); showToast("Capture archived"); } catch { showToast("Archive failed — nothing changed"); }
  });
  const toggleItemShare = useCallbackSafe(async (id: string) => {
    let nextShared = false;
    const capture = stateRef.current.captures.find(c => c.id === stateRef.current.detailId);
    nextShared = !(capture?.items.find(it => it.id === id)?.shared ?? false);
    try { if (supabaseEnabled) await apiSetItemShared(id, nextShared); patch((prev) => ({
      captures: prev.captures.map((c) =>
        c.id === stateRef.current.detailId
          ? {
              ...c,
              items: c.items.map((it) => {
                if (it.id !== id) return it;
                return { ...it, shared: nextShared };
              }),
            }
          : c,
      ),
    })); showToast("Sharing updated"); } catch { showToast("Sharing update failed — nothing changed"); }
  });
  const updateSavedField = useCallbackSafe(async (field: "title" | "summary", value: string) => {
    const id = stateRef.current.detailId;
    const clean = value.trim();
    if (!id || !clean) return;
    const current = stateRef.current.captures.find((c) => c.id === id);
    if (!current || current[field] === clean) return;
    try {
      if (supabaseEnabled) await apiUpdateCapture(id, { [field]: clean });
      patch((prev) => ({ captures: prev.captures.map((c) => c.id === id ? { ...c, [field]: clean } : c) }));
      showToast("Changes saved");
    } catch { showToast("Update failed — nothing changed"); }
  });
  const updateSavedItemField = useCallbackSafe(async (id: string, field: "title" | "summary", value: string) => {
    const clean = value.trim();
    if (!clean) return;
    const captureId = stateRef.current.detailId;
    const item = stateRef.current.captures.find((c) => c.id === captureId)?.items.find((it) => it.id === id);
    if (!captureId || !item || item[field] === clean) return;
    try {
      if (supabaseEnabled) await apiUpdateItem(id, { [field]: clean });
      patch((prev) => ({ captures: prev.captures.map((c) => c.id === captureId ? { ...c, items: c.items.map((it) => it.id === id ? { ...it, [field]: clean } : it) } : c) }));
      showToast("Changes saved");
    } catch { showToast("Item update failed — nothing changed"); }
  });

  // ---------- settings ----------
  const toggleMute = useCallbackSafe(() =>
    patch((prev) => ({ muted: !prev.muted })),
  );
  const goTherapist = useCallbackSafe(() => patch({ screen: "therapist" }));
  const backFromTherapist = useCallbackSafe(() => patch({ screen: "settings" }));

  const fmtTime = (secs: number) => {
    const m = Math.floor(secs / 60),
      ss = secs % 60;
    return `${m}:${ss < 10 ? "0" : ""}${ss}`;
  };

  const store: VCStore = {
    ...s,
    fmtTime,
    signIn,
    signOut,
    goHome,
    goLibrary,
    goSettings,
    navClick,
    goCapture,
    allowMic,
    startDemo,
    cancelCapture,
    togglePause,
    doneRecording,
    requestBack,
    discardBack,
    keepRecording,
    exitToText,
    startVoiceFromText,
    setTextDraft,
    sendText,
    onWaveDown,
    onWaveMove,
    onWaveUp,
    toggleTranscript,
    onTransScroll,
    setWaveEl: (el) => {
      waveEl.current = el;
    },
    setTaEl: (el) => {
      taEl.current = el;
    },
    setTransEl: (el) => {
      transEl.current = el;
    },
    editField,
    toggleEmotion,
    removeTopic,
    addTopic,
    removeItem,
    toggleReviewShare,
    saveAll,
    cancelReview,
    openTranscript,
    playAudio,
    retryProcessing,
    captureAnother,
    viewSaved,
    setSearch,
    setFilter,
    setSort,
    openDetail,
    backFromDetail,
    deleteCapture,
    archiveCapture,
    toggleItemShare,
    updateSavedField,
    updateSavedItemField,
    toggleMute,
    goTherapist,
    backFromTherapist,
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

/* Stable event-callback helper: keeps a single stable identity while always
   invoking the latest closure. Live state is read through stateRef, so a
   one-render lag on the stored closure is harmless. */
function useCallbackSafe<A extends unknown[], R>(fn: (...args: A) => R) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A): R => ref.current(...args), []);
}
