import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Paperclip, Image as ImageIcon, Pin, Trash2, X } from "lucide-react";
import { useChatMessages, type ChatMessage } from "@/hooks/chat/useChatMessages";
import { useAuth } from "@/hooks/useAuth";
import { uploadChatAttachment, transformedUrl, fileKind } from "@/lib/mediaUpload";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  roomId: string;
  title?: string;
  onClose?: () => void;
}

export const ChatRoom = ({ roomId, title, onClose }: Props) => {
  const { user } = useAuth();
  const {
    messages, isLoading, typingUsers, onlineUsers,
    sendMessage, sendTyping, deleteMessage, togglePin, markRead,
  } = useChatMessages(roomId);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => { markRead(); }, [messages.length, markRead]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate({ content: trimmed, type: "text" });
    setText("");
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !user?.id) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} dépasse 50MB`);
          continue;
        }
        const result = await uploadChatAttachment(file, user.id, roomId, setProgress);
        sendMessage.mutate({
          type: fileKind(result.type),
          media_url: result.url,
          media_metadata: { name: result.name, size: result.size, mime: result.type, path: result.path },
        });
      } catch (e) {
        toast.error("Échec de l'envoi du fichier");
      }
    }
    setUploading(false);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const pinned = messages.filter((m) => m.is_pinned);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{title || "Conversation"}</h3>
          <p className="text-xs text-muted-foreground">
            {onlineUsers.length} en ligne
            {typingUsers.length > 0 && <span className="ml-2 italic">• écrit…</span>}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        )}
      </header>

      {pinned.length > 0 && (
        <div className="bg-accent/10 border-b px-4 py-2 text-xs flex items-center gap-2">
          <Pin className="h-3 w-3" />
          <span className="truncate">{pinned[0].content || "Message épinglé"}</span>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-2">
        <div ref={scrollRef} className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              Aucun message. Démarrez la conversation 👋
            </p>
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id} msg={m} isMine={m.user_id === user?.id}
                onDelete={() => deleteMessage.mutate(m.id)}
                onPin={() => togglePin.mutate({ id: m.id, pinned: !m.is_pinned })}
                onOpenImage={(url) => setLightbox(url)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {uploading && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-t flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Compression & envoi… {progress}%
        </div>
      )}

      <div className="border-t p-2 sm:p-3 flex items-end gap-2">
        <input
          ref={fileRef} type="file" multiple className="hidden"
          accept="image/*,video/*,audio/*,application/pdf"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          value={text}
          onChange={(e) => { setText(e.target.value); sendTyping(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Écrire un message…"
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!text.trim() || sendMessage.isPending}
          className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded shadow-2xl" />
        </div>
      )}
    </div>
  );
};

const MessageBubble = ({
  msg, isMine, onDelete, onPin, onOpenImage,
}: { msg: ChatMessage; isMine: boolean; onDelete: () => void; onPin: () => void; onOpenImage: (u: string) => void }) => {
  const time = format(new Date(msg.created_at), "HH:mm");
  const meta = (msg.media_metadata || {}) as { name?: string; size?: number };

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`group max-w-[80%] sm:max-w-[70%] rounded-lg px-3 py-2 text-sm ${isMine ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"} ${msg._pending ? "opacity-60" : ""}`}>
        {msg.type === "image" && msg.media_url && (
          <button onClick={() => onOpenImage(msg.media_url!)} className="block mb-1">
            <img
              src={transformedUrl(msg.media_url, 400, 70)}
              alt={meta.name || "image"}
              loading="lazy"
              className="rounded max-w-full max-h-60 object-cover"
            />
          </button>
        )}
        {msg.type === "video" && msg.media_url && (
          <video src={msg.media_url} controls className="rounded max-w-full max-h-60" />
        )}
        {msg.type === "audio" && msg.media_url && (
          <audio src={msg.media_url} controls className="max-w-full" />
        )}
        {msg.type === "file" && msg.media_url && (
          <a href={msg.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
            <Paperclip className="h-3 w-3" /> {meta.name || "Fichier"}
          </a>
        )}
        {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
        <div className="flex items-center justify-end gap-2 mt-1 text-[10px] opacity-70">
          {msg.is_pinned && <Pin className="h-3 w-3" />}
          <span>{time}</span>
          {!msg._pending && (
            <span className="hidden group-hover:inline-flex gap-1 ml-1">
              <button onClick={onPin} title="Épingler"><Pin className="h-3 w-3" /></button>
              {isMine && <button onClick={onDelete} title="Supprimer"><Trash2 className="h-3 w-3" /></button>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};