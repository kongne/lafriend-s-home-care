import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  url: string;
  path: string;
  type: string;
  size: number;
  name: string;
  width?: number;
  height?: number;
}

const IMAGE_OPTS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

export async function compressIfImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const compressed = await imageCompression(file, IMAGE_OPTS);
    return new File([compressed], file.name.replace(/\.[^.]+$/, ".webp"), {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

export function transformedUrl(url: string, width = 400, quality = 70) {
  if (!url) return url;
  // Supabase render endpoint
  return url.replace("/object/public/", "/render/image/public/") +
    `?width=${width}&quality=${quality}&resize=contain`;
}

export async function uploadChatAttachment(
  file: File,
  userId: string,
  roomId: string,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const optimized = await compressIfImage(file);
  const ext = optimized.name.split(".").pop() || "bin";
  const path = `${userId}/${roomId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  // simple progress simulation (Supabase JS doesn't expose progress yet)
  onProgress?.(10);
  const { error } = await supabase.storage
    .from("chat-attachments")
    .upload(path, optimized, { contentType: optimized.type, upsert: false });
  onProgress?.(100);
  if (error) throw error;

  const { data: pub } = supabase.storage.from("chat-attachments").getPublicUrl(path);
  return {
    url: pub.publicUrl,
    path,
    type: optimized.type,
    size: optimized.size,
    name: optimized.name,
  };
}

export async function deleteChatAttachment(path: string) {
  await supabase.storage.from("chat-attachments").remove([path]);
}

export function fileKind(mime: string): "image" | "video" | "audio" | "file" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}