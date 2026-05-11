import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onSend: (blob: Blob, durationSec: number) => Promise<void> | void;
  maxSec?: number;
}

export const VoiceRecorder = ({ onSend, maxSec = 300 }: Props) => {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [sending, setSending] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  useEffect(() => () => cleanup(), []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime });
        setBlob(b);
        cleanup();
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((s) => {
          const next = s + 1;
          if (next >= maxSec) {
            toast.error(`Limite atteinte : ${Math.floor(maxSec / 60)} min maximum par note vocale`);
            stop();
          }
          return next;
        });
      }, 1000);
    } catch {
      toast.error("Autorisation microphone refusée");
    }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  const discard = () => { setBlob(null); setElapsed(0); };

  const send = async () => {
    if (!blob) return;
    setSending(true);
    try { await onSend(blob, elapsed); discard(); }
    finally { setSending(false); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (blob) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md flex-1">
        <audio src={URL.createObjectURL(blob)} controls className="h-8 flex-1 max-w-[200px]" />
        <span className="text-xs text-muted-foreground">{fmt(elapsed)}</span>
        <Button size="icon" variant="ghost" onClick={discard} disabled={sending}><Trash2 className="h-4 w-4" /></Button>
        <Button size="icon" onClick={send} disabled={sending} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-red-50 dark:bg-red-950/20 rounded-md flex-1">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-mono">{fmt(elapsed)} / {fmt(maxSec)}</span>
        <div className="flex-1" />
        <Button size="icon" variant="ghost" onClick={stop}><Square className="h-4 w-4 text-red-500" /></Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={start} title="Note vocale"><Mic className="h-4 w-4" /></Button>
  );
};