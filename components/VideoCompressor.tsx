'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import {
  Upload,
  FileVideo,
  Download,
  Loader2,
  Zap,
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Settings2,
  Clock,
  Info,
  Plus,
  Trash2,
  Cloud,
  BatteryCharging,
  ListVideo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdBanner } from '@/components/AdBanner';
import type { Locale } from '@/lib/i18n-config';
import {
  initGoogleDrive,
  requestDriveAccess,
  uploadToDrive,
  isGoogleDriveConfigured,
  hasDriveAccess,
} from '@/lib/google-drive';

type Preset = 'fast' | 'high' | 'target';
type OutputFormat = 'mp4' | 'mkv' | 'webm';
type Stage = 'idle' | 'ready' | 'loading' | 'compressing' | 'done' | 'error';
type ItemStatus = 'waiting' | 'processing' | 'done' | 'error' | 'optimized';

const formatMime: Record<OutputFormat, string> = {
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
};

const formatCodecs: Record<OutputFormat, { vcodec: string; acodec: string; extra: string[] }> = {
  mp4: { vcodec: 'libx264', acodec: 'aac', extra: ['-movflags', '+faststart'] },
  mkv: { vcodec: 'libx264', acodec: 'aac', extra: [] },
  webm: { vcodec: 'libvpx', acodec: 'libopus', extra: [] },
};

interface QueueItem {
  id: string;
  file: File;
  status: ItemStatus;
  progress: number;
  originalSize: number;
  compressedSize: number;
  outputUrl: string | null;
  outputName: string;
  driveUploaded: boolean;
  driveUploading: boolean;
  driveUploadProgress: number;
  error: string | null;
}

interface VideoCompressorProps {
  locale: Locale;
  t: Record<string, string>;
}

const presetConfig: Record<Preset, { icon: typeof Zap; gradient: string; border: string; ring: string }> = {
  fast: { icon: Zap, gradient: 'from-amber-500 to-orange-500', border: 'border-amber-300 dark:border-amber-700', ring: 'ring-amber-400' },
  high: { icon: Sparkles, gradient: 'from-sky-500 to-blue-500', border: 'border-sky-300 dark:border-sky-700', ring: 'ring-sky-400' },
  target: { icon: Target, gradient: 'from-emerald-500 to-green-500', border: 'border-emerald-300 dark:border-emerald-700', ring: 'ring-emerald-400' },
};

const statusConfig: Record<ItemStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  waiting: { label: 'queueItemWaiting', icon: Clock, color: 'text-slate-400' },
  processing: { label: 'queueItemProcessing', icon: Loader2, color: 'text-sky-500' },
  done: { label: 'queueItemDone', icon: CheckCircle2, color: 'text-emerald-500' },
  error: { label: 'queueItemError', icon: AlertCircle, color: 'text-red-500' },
  optimized: { label: 'queueItemOptimized', icon: Info, color: 'text-amber-500' },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function formatTime(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return '—';
  if (seconds < 1) return '< 1s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function savingsPct(original: number, compressed: number): number {
  if (original <= 0 || compressed <= 0) return 0;
  if (compressed >= original) return 0;
  return Math.round(((original - compressed) / original) * 100);
}

let wakeLock: WakeLockSentinel | null = null;

async function acquireWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen');
    }
  } catch {}
}

function releaseWakeLock() {
  if (wakeLock) {
    try { wakeLock.release(); } catch {}
    wakeLock = null;
  }
}

export function VideoCompressor({ locale, t }: VideoCompressorProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [preset, setPreset] = useState<Preset>('high');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp4');
  const [customFilename, setCustomFilename] = useState('');
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [engineProgress, setEngineProgress] = useState(0);
  const [engineLoaded, setEngineLoaded] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueProcessing, setQueueProcessing] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveConfigured] = useState(() => isGoogleDriveConfigured());

  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(0);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueCancelledRef = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queueListRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!driveConfigured) return;
    initGoogleDrive().catch((error: unknown) => {
      console.error('Google Drive initialization failed:', error);
    });
  }, [driveConfigured]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queue.forEach((item) => {
        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      });
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      releaseWakeLock();
    };
  }, []);

  // Auto-scroll to processing area when compression starts
  useEffect(() => {
    if (stage === 'loading' || stage === 'compressing') {
      setTimeout(() => {
        scrollAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [stage]);

  // Auto-scroll to results when all done
  useEffect(() => {
    if (stage === 'done') {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [stage]);

  const startElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    startTimeRef.current = Date.now();
    setElapsed(0);
    elapsedTimerRef.current = setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 500);
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current?.loaded) {
      setEngineLoaded(true);
      setEngineProgress(100);
      return ffmpegRef.current;
    }
    setStage('loading');
    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const onDownloadProgress = (e: { received: number; total: number; done: boolean }) => {
      if (e.total > 0) setEngineProgress(Math.min(99, Math.round((e.received / e.total) * 100)));
    };
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript', true, onDownloadProgress),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm', true, onDownloadProgress),
    });
    ffmpegRef.current = ffmpeg;
    setEngineProgress(100);
    setEngineLoaded(true);
    return ffmpeg;
  }, []);

  const handleFilesSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const videoFiles = Array.from(files).filter((f) => f.type.startsWith('video/'));
    if (videoFiles.length === 0) return;

    const newItems: QueueItem[] = videoFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      status: 'waiting',
      progress: 0,
      originalSize: file.size,
      compressedSize: 0,
      outputUrl: null,
      outputName: '',
      driveUploaded: false,
      driveUploading: false,
      driveUploadProgress: 0,
      error: null,
    }));

    setQueue((prev) => [...prev, ...newItems]);
    setStage('ready');
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.outputUrl) URL.revokeObjectURL(item.outputUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearQueue = useCallback(() => {
    queue.forEach((item) => {
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
    });
    setQueue([]);
    setStage('idle');
    setProgress(0);
    setEta(null);
    setElapsed(0);
  }, [queue]);

  const onProgress = useCallback(({ progress: r }: { progress: number }) => {
    if (queueCancelledRef.current) return;
    const pct = Math.min(99, Math.round(r * 100));
    setProgress(pct);

    const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
    if (r > 0.02 && elapsedSec > 1) {
      setEta(Math.max(0, elapsedSec / r - elapsedSec));
    }
  }, []);

  const buildCommand = useCallback((inputName: string, outputName: string, presetKey: Preset, fmt: OutputFormat): string[] => {
    const codecs = formatCodecs[fmt];
    const base: string[] = ['-i', inputName];
    const vf: string[] = ['-vf'];
    const codecArgs: string[] = ['-c:v', codecs.vcodec, '-c:a', codecs.acodec];

    if (fmt === 'webm') {
      codecArgs.push('-b:a', '128k');
    } else {
      codecArgs.push('-b:a', '128k');
    }

    if (presetKey === 'fast') {
      vf.push('scale=-2:min(720\\,ih)');
      if (fmt !== 'webm') {
        codecArgs.push('-preset', 'ultrafast', '-crf', '30');
      } else {
        codecArgs.push('-deadline', 'realtime', '-crf', '35', '-b:v', '1M');
      }
    } else if (presetKey === 'high') {
      vf.push('scale=-2:min(1080\\,ih)');
      if (fmt !== 'webm') {
        codecArgs.push('-preset', 'fast', '-crf', '28');
      } else {
        codecArgs.push('-deadline', 'good', '-crf', '30', '-b:v', '2M');
      }
    } else {
      vf.push('scale=-2:min(720\\,ih)');
      const targetBits = 100 * 1024 * 1024 * 8;
      const videoBitrate = Math.min(4000000, Math.floor(targetBits / 60 / 2) * 2);
      if (fmt !== 'webm') {
        codecArgs.push('-preset', 'fast', '-b:v', `${videoBitrate}`, '-maxrate', `${Math.floor(videoBitrate * 1.5)}`, '-bufsize', `${videoBitrate * 2}`);
      } else {
        codecArgs.push('-deadline', 'good', '-b:v', `${videoBitrate}`);
      }
    }

    return [...base, ...vf, ...codecArgs, ...codecs.extra, outputName];
  }, []);

  const compressQueue = useCallback(async () => {
    if (queue.length === 0) return;
    queueCancelledRef.current = false;
    setQueueProcessing(true);
    setStage('loading');
    acquireWakeLock();

    // Snapshot the queue at the start — the loop reads from this, not stale state
    const queueSnapshot = queue;

    try {
      const ffmpeg = await loadFFmpeg();
      if (queueCancelledRef.current) {
        releaseWakeLock();
        setQueueProcessing(false);
        setStage('ready');
        return;
      }
      ffmpeg.on('progress', onProgress);

      for (let i = 0; i < queueSnapshot.length; i++) {
        if (queueCancelledRef.current) break;
        const item = queueSnapshot[i];
        setCurrentQueueIndex(i);
        setProgress(0);
        setEta(null);
        startElapsedTimer();
        setStage('compressing');

        setQueue((prev) => prev.map((it, idx) => idx === i ? { ...it, status: 'processing', progress: 0 } : it));

        const inputName = `input_${i}.${item.file.name.split('.').pop() || 'mp4'}`;
        const outputExt = outputFormat;
        const outputName = `output_${i}.${outputExt}`;

        try {
          await ffmpeg.writeFile(inputName, await fetchFile(item.file));
          const cmd = buildCommand(inputName, outputName, preset, outputFormat);
          await ffmpeg.exec(cmd);

          if (queueCancelledRef.current) {
            try { await ffmpeg.deleteFile(inputName); } catch {}
            try { await ffmpeg.deleteFile(outputName); } catch {}
            break;
          }

          stopElapsedTimer();
          const data = await ffmpeg.readFile(outputName);
          const blob = new Blob([data as Uint8Array], { type: formatMime[outputFormat] });
          const url = URL.createObjectURL(blob);
          const baseName = customFilename.trim() || item.file.name.replace(/\.[^/.]+$/, '') + '_compressed';
          const outName = `${baseName}.${outputExt}`;
          const isOptimized = blob.size >= item.file.size;

          setQueue((prev) => prev.map((it, idx) => idx === i ? {
            ...it,
            status: isOptimized ? 'optimized' : 'done',
            progress: 100,
            compressedSize: blob.size,
            outputUrl: url,
            outputName: outName,
          } : it));

          // Critical: delete FFmpeg virtual files immediately to free WASM memory
          try { await ffmpeg.deleteFile(inputName); } catch {}
          try { await ffmpeg.deleteFile(outputName); } catch {}

          // Allow the browser to GC the Uint8Array from readFile before next iteration
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch {
          stopElapsedTimer();
          if (queueCancelledRef.current) break;
          setQueue((prev) => prev.map((it, idx) => idx === i ? {
            ...it,
            status: 'error',
            error: t.errorCompress,
          } : it));
          // Clean up any partial files on error too
          try { await ffmpeg.deleteFile(inputName); } catch {}
          try { await ffmpeg.deleteFile(outputName); } catch {}
        }
      }

      if (!queueCancelledRef.current) {
        setProgress(100);
        setStage('done');
      } else {
        setStage('ready');
      }
    } catch {
      setStage('error');
    } finally {
      stopElapsedTimer();
      releaseWakeLock();
      setQueueProcessing(false);
      setCurrentQueueIndex(-1);
      setEta(null);
    }
  }, [queue, preset, outputFormat, customFilename, loadFFmpeg, onProgress, startElapsedTimer, stopElapsedTimer, buildCommand, t.errorCompress]);

  const cancelQueue = useCallback(() => {
    queueCancelledRef.current = true;
    stopElapsedTimer();
    releaseWakeLock();
    setQueueProcessing(false);
    setCurrentQueueIndex(-1);
    setStage('ready');
    setProgress(0);
    setEta(null);
  }, [stopElapsedTimer]);

  const reset = useCallback(() => {
    queue.forEach((item) => {
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
    });
    stopElapsedTimer();
    releaseWakeLock();
    setQueue([]);
    setStage('idle');
    setProgress(0);
    setEta(null);
    setElapsed(0);
    setQueueProcessing(false);
    setCurrentQueueIndex(-1);
  }, [queue, stopElapsedTimer]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelect(e.dataTransfer.files);
  }, [handleFilesSelect]);

  // Google Drive handlers
  const connectDrive = useCallback(async (): Promise<boolean> => {
    if (driveConnected || hasDriveAccess()) {
      setDriveConnected(true);
      return true;
    }
    setDriveConnecting(true);
    try {
      await initGoogleDrive();
      await requestDriveAccess();
      setDriveConnected(true);
      return true;
    } catch (err) {
      console.error('Google Drive connection failed:', err);
      const msg = err instanceof Error ? err.message : t.driveConnectError;
      setDriveError(msg);
      setTimeout(() => setDriveError(null), 6000);
      return false;
    } finally {
      setDriveConnecting(false);
    }
  }, [driveConnected, t.driveConnectError]);

  const uploadItemToDrive = useCallback(async (id: string) => {
    const item = queue.find((i) => i.id === id);
    if (!item || !item.outputUrl) return;

    setQueue((prev) => prev.map((it) => it.id === id ? { ...it, driveUploading: true, driveUploadProgress: 0 } : it));

    try {
      if (!driveConnected) {
        const ok = await connectDrive();
        if (!ok) return;
      }

      const response = await fetch(item.outputUrl);
      const blob = await response.blob();

      await uploadToDrive(blob, item.outputName, (p) => {
        setQueue((prev) => prev.map((it) => it.id === id ? { ...it, driveUploadProgress: p } : it));
      });

      setQueue((prev) => prev.map((it) => it.id === id ? {
        ...it,
        driveUploading: false,
        driveUploaded: true,
        driveUploadProgress: 1,
      } : it));

      URL.revokeObjectURL(item.outputUrl);
      setQueue((prev) => prev.map((it) => it.id === id ? { ...it, outputUrl: null } : it));
    } catch (err) {
      console.error('Google Drive upload failed:', err);
      const msg = err instanceof Error ? err.message : t.driveUploadError;
      setDriveError(msg);
      setTimeout(() => setDriveError(null), 6000);
      setQueue((prev) => prev.map((it) => it.id === id ? { ...it, driveUploading: false } : it));
    }
  }, [queue, driveConnected, connectDrive, t.driveUploadError]);

  const downloadItem = useCallback((item: QueueItem) => {
    if (!item.outputUrl) return;
    const a = document.createElement('a');
    a.href = item.outputUrl;
    a.download = item.outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const downloadAll = useCallback(() => {
    queue.filter((i) => (i.status === 'done' || i.status === 'optimized') && i.outputUrl).forEach((item, idx) => {
      const url = item.outputUrl!;
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = item.outputName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, idx * 300);
    });
  }, [queue]);

  const uploadAllToDrive = useCallback(async () => {
    if (!driveConnected) {
      const ok = await connectDrive();
      if (!ok) return;
    }
    const items = queue.filter((i) => (i.status === 'done' || i.status === 'optimized') && !i.driveUploaded && i.outputUrl);
    for (const item of items) {
      await uploadItemToDrive(item.id);
    }
  }, [queue, driveConnected, connectDrive, uploadItemToDrive]);

  // Re-acquire wake lock on visibility change during processing
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && queueProcessing) {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [queueProcessing]);

  const completedCount = queue.filter((i) => i.status === 'done' || i.status === 'optimized').length;
  const totalSavings = queue.reduce((acc, item) => {
    if (item.originalSize > 0 && item.compressedSize > 0 && item.compressedSize < item.originalSize) {
      return acc + (item.originalSize - item.compressedSize);
    }
    return acc;
  }, 0);
  const isWorking = stage === 'loading' || stage === 'compressing' || queueProcessing;
  const showQueue = queue.length > 0;
  const showDropZone = stage === 'idle' || stage === 'ready';
  const showResults = stage === 'done' && !queueProcessing;

  return (
    <div className="w-full">
      {/* Charging warning banner */}
      {showQueue && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <BatteryCharging className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            {t.chargingBanner}
          </p>
        </div>
      )}

      {/* Drop zone — visible when idle or ready (not during processing or results) */}
      {showDropZone && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300',
            isDragging ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/30 scale-[1.01]' : 'border-slate-300 hover:border-sky-400 dark:border-slate-700 dark:hover:border-sky-600',
            'bg-slate-50/50 dark:bg-slate-900/30',
            'p-8 md:p-12',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => { handleFilesSelect(e.target.files); e.target.value = ''; }}
          />
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-sky-500/30 transition-transform hover:scale-105">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white md:text-lg">{t.dropHere}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.dropHint}</p>
            </div>
            {showQueue && (
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                {t.addMore}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Queue list (before compression) */}
      {showQueue && !queueProcessing && stage !== 'compressing' && stage !== 'done' && stage !== 'loading' && (
        <div ref={queueListRef} className="mt-5 animate-fade-in">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListVideo className="h-5 w-5 text-slate-400" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.queueTitle} ({queue.length})
              </p>
            </div>
            <button
              onClick={clearQueue}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.clearAll}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
            {queue.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 dark:bg-slate-900">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <FileVideo className="h-5 w-5 text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{item.file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(item.originalSize)}</p>
                </div>
                <button
                  onClick={() => removeFromQueue(item.id)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset selection */}
      {showQueue && !queueProcessing && stage !== 'compressing' && stage !== 'done' && stage !== 'loading' && (
        <div className="mt-5 animate-fade-in">
          <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{t.preset}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(presetConfig) as Preset[]).map((key) => {
              const cfg = presetConfig[key];
              const Icon = cfg.icon;
              const isSelected = preset === key;
              const labels: Record<Preset, { title: string; desc: string }> = {
                fast: { title: t.presetFast, desc: t.presetFastDesc },
                high: { title: t.presetHigh, desc: t.presetHighDesc },
                target: { title: t.presetTarget, desc: t.presetTargetDesc },
              };
              return (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  disabled={isWorking}
                  className={cn(
                    'group relative rounded-xl border-2 p-4 text-left transition-all duration-200',
                    isSelected ? `${cfg.border} bg-white dark:bg-slate-900 ring-2 ${cfg.ring} ring-offset-2 ring-offset-white dark:ring-offset-slate-950` : 'border-slate-200 bg-white/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700',
                    isWorking && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <div className={cn('mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', cfg.gradient)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{labels[key].title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{labels[key].desc}</p>
                  {isSelected && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-sky-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom output settings — filename + format */}
      {showQueue && !queueProcessing && stage !== 'compressing' && stage !== 'done' && stage !== 'loading' && (
        <div className="mt-5 animate-fade-in">
          <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{t.outputSettings}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Custom filename */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{t.customFilename}</label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus-within:ring-2 focus-within:ring-sky-400">
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder={queue[0]?.file.name.replace(/\.[^/.]+$/, '') + '_compressed' || 'filename'}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                />
                <span className="shrink-0 px-3 text-sm font-medium text-slate-400 dark:text-slate-500">.{outputFormat}</span>
              </div>
            </div>
            {/* Output format */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{t.outputFormat}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['mp4', 'mkv', 'webm'] as OutputFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setOutputFormat(fmt)}
                    disabled={isWorking}
                    className={cn(
                      'rounded-xl border-2 px-3 py-2.5 text-sm font-semibold uppercase transition-all duration-200',
                      outputFormat === fmt
                        ? 'border-sky-400 bg-sky-50 text-sky-700 ring-2 ring-sky-300 dark:border-sky-600 dark:bg-sky-950/30 dark:text-sky-400'
                        : 'border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:border-slate-700',
                      isWorking && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start button */}
      {showQueue && !queueProcessing && stage !== 'compressing' && stage !== 'done' && stage !== 'loading' && (
        <button
          onClick={compressQueue}
          disabled={isWorking}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-xl hover:shadow-sky-500/40 active:scale-[0.98] disabled:opacity-50"
        >
          <Zap className="h-5 w-5" />
          {t.start}
          {queue.length > 1 && <span className="ml-1 rounded-md bg-white/20 px-2 py-0.5 text-sm">{queue.length}</span>}
        </button>
      )}

      {/* Processing / loading panel — always visible during loading/compressing */}
      {(stage === 'loading' || stage === 'compressing') && queueProcessing && (
        <div ref={scrollAreaRef} className="mt-5 animate-fade-in">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:p-6">
            {/* Overall queue progress */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.queueProgress.replace('{current}', String(currentQueueIndex + 1)).replace('{total}', String(queue.length))}
                </p>
                <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                  {Math.round(((currentQueueIndex + progress / 100) / queue.length) * 100)}%
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${((currentQueueIndex + progress / 100) / queue.length) * 100}%` }}
                >
                  <div className="h-full w-full bg-white/20 animate-pulse-slow" />
                </div>
              </div>
            </div>

            {/* Phase 1: Engine loading */}
            {stage === 'loading' && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/50">
                    <Settings2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.phaseEngine}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.phaseEngineHint}</p>
                  </div>
                </div>
                {engineLoaded ? (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">100% — Ready</span>
                  </div>
                ) : (
                  <div>
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300" style={{ width: `${engineProgress}%` }}>
                        <div className="h-full w-full bg-white/20 animate-pulse-slow" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500 dark:text-slate-400">{engineProgress > 0 ? `${engineProgress}%` : t.preparing}</span>
                      {engineProgress > 0 && <span className="text-slate-400 dark:text-slate-500">{formatBytes(Math.round(engineProgress * 0.3 * 1024 * 1024))} / ~30 MB</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phase 2: Current file compression */}
            {stage === 'compressing' && currentQueueIndex >= 0 && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/50">
                    <FileVideo className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.phaseCompressing}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{queue[currentQueueIndex]?.file.name}</p>
                  </div>
                  <button onClick={cancelQueue} className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30">
                    <X className="h-3.5 w-3.5" />
                    {t.cancel}
                  </button>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }}>
                    <div className="h-full w-full bg-white/20 animate-pulse-slow" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">{progress}</span>
                    <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">%</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-right">
                    {eta !== null ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">{t.eta}: <span className="font-semibold text-slate-900 dark:text-white">{formatTime(eta)}</span></span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">{t.etaCalculating}</span>
                    )}
                    {elapsed > 0 && <span className="text-xs text-slate-400 dark:text-slate-500">{t.elapsed}: {formatTime(elapsed)}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live queue status during processing */}
          <div className="mt-3 space-y-1.5">
            {queue.map((item, idx) => {
              const StatusIcon = statusConfig[item.status].icon;
              return (
                <div key={item.id} className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  idx === currentQueueIndex ? 'bg-sky-50 dark:bg-sky-950/30' : 'bg-slate-50 dark:bg-slate-900/50',
                )}>
                  <StatusIcon className={cn('h-4 w-4 shrink-0', statusConfig[item.status].color, item.status === 'processing' && 'animate-spin')} />
                  <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">{item.file.name}</span>
                  <span className={cn('shrink-0 text-xs font-medium', statusConfig[item.status].color)}>
                    {t[statusConfig[item.status].label]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <AdBanner slot="encoding" />
          </div>
        </div>
      )}

      {/* Completion screen — results stay visible until user clicks reset */}
      {showResults && (
        <div ref={resultsRef} className="mt-5 animate-slide-up">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:p-6">
            {/* Summary header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.queueComplete.replace('{total}', String(completedCount))}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.queueCompleteHint}</p>
              </div>
            </div>

            {/* Summary stats */}
            {totalSavings > 0 && (
              <div className="mb-4 flex items-center justify-center gap-6 rounded-xl bg-emerald-50/50 py-3 dark:bg-emerald-950/20">
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t.saved}</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatBytes(totalSavings)}</p>
                </div>
              </div>
            )}

            {/* Results list — each card has video preview, file info, download + drive buttons */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {queue.map((item) => {
                const pct = savingsPct(item.originalSize, item.compressedSize);
                return (
                  <div key={item.id} className={cn(
                    'rounded-xl border p-4 transition-colors',
                    item.status === 'optimized' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20' : item.status === 'error' ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50',
                  )}>
                    {/* Video preview player */}
                    {item.outputUrl && (item.status === 'done' || item.status === 'optimized') && (
                      <div className="mb-3 overflow-hidden rounded-lg bg-black">
                        <video
                          src={item.outputUrl}
                          controls
                          playsInline
                          className="h-auto max-h-48 w-full object-contain"
                          preload="metadata"
                        />
                      </div>
                    )}
                    {item.driveUploaded && !item.outputUrl && (
                      <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 py-4 dark:bg-emerald-950/20">
                        <Cloud className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t.driveUploadSuccess}</span>
                      </div>
                    )}

                    {/* File info row */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        {item.status === 'optimized' ? (
                          <Info className="h-5 w-5 text-amber-500" />
                        ) : item.status === 'error' ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <FileVideo className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.file.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">{formatBytes(item.originalSize)}</span>
                          <span className="text-slate-400">→</span>
                          <span className={item.status === 'optimized' ? 'font-medium text-amber-600 dark:text-amber-400' : 'font-medium text-sky-600 dark:text-sky-400'}>
                            {item.compressedSize > 0 ? formatBytes(item.compressedSize) : '—'}
                          </span>
                          {pct > 0 && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              -{pct}%
                            </span>
                          )}
                          {item.status === 'optimized' && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                              {t.queueItemOptimized}
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
                              {t.queueItemError}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Per-item action buttons */}
                      {item.status !== 'error' && item.outputUrl && (
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => downloadItem(item)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-sky-950/30"
                          >
                            <Download className="h-4 w-4" />
                            {t.download}
                          </button>
                          {driveConfigured && (
                            <button
                              onClick={() => uploadItemToDrive(item.id)}
                              disabled={item.driveUploading || item.driveUploaded}
                              className={cn(
                                'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                                item.driveUploaded
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                                  : 'border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-sky-950/30',
                                item.driveUploading && 'opacity-60',
                              )}
                            >
                              {item.driveUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : item.driveUploaded ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Cloud className="h-4 w-4" />
                              )}
                              {item.driveUploading ? `${Math.round(item.driveUploadProgress * 100)}%` : item.driveUploaded ? t.driveUploadSuccess : t.saveToDrive}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Drive upload progress bar */}
                    {item.driveUploading && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${item.driveUploadProgress * 100}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bulk actions */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button onClick={downloadAll} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-xl active:scale-[0.98]">
                <Download className="h-4 w-4" />
                {t.downloadAll}
              </button>
              {driveConfigured && (
                <button
                  onClick={uploadAllToDrive}
                  disabled={driveConnecting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                >
                  {driveConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                  {driveConnecting ? t.connectingDrive : t.saveAllToDrive}
                </button>
              )}
              <button onClick={reset} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <RotateCcw className="h-4 w-4" />
                {t.compressAnother}
              </button>
            </div>

            {/* Drive login prompt */}
            {driveConfigured && !driveConnected && (
              <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
                {t.driveLoginPrompt}
              </p>
            )}

            {/* Drive error message */}
            {driveError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 p-3 dark:border-red-900 dark:bg-red-950/20">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{driveError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {stage === 'error' && !queueProcessing && (
        <div className="mt-5 animate-fade-in">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900 dark:bg-red-950/20">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 dark:text-red-300">{t.errorTitle}</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400/80">{t.errorLoad}</p>
            </div>
            <button onClick={reset} className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:hover:bg-red-950/40">
              {t.compressAnother}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
