import { supabase } from "@/integrations/supabase/client";

export type IdentityDocType = "cni" | "passport";
export type IdentityStatus = "pending" | "approved" | "rejected";

export interface IdentityDocument {
  id: string;
  user_id: string;
  doc_type: IdentityDocType;
  front_url: string | null;
  back_url: string | null;
  selfie_url: string | null;
  status: IdentityStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET = "identities";

export const uploadIdentityFile = async (
  userId: string,
  file: Blob,
  label: "front" | "back" | "selfie",
  ext = "jpg"
) => {
  const path = `${userId}/${label}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return path;
};

export const getSignedIdentityUrl = async (path: string, expiresInSec = 3600) => {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
};
