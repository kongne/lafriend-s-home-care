import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { transformedUrl } from "@/lib/mediaUpload";
import { error as logError } from "@/lib/logger";
import {
  Image as ImageIcon, Upload, Trash2, Search, X, Copy, Check, RefreshCw, FolderOpen,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface MediaItem {
  name: string;
  url: string;
  updated_at: string;
  size: number;
  metadata?: { width: number; height: number };
}

const BUCKETS = ["projects", "chat-attachments", "service-images"];

export const MediaLibrary = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBucket, setActiveBucket] = useState<string>("projects");
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(activeBucket).list("", {
        limit: 100,
        sortBy: { column: "updated_at", order: "desc" },
      });
      if (error) throw error;
      const mapped: MediaItem[] = (data || []).map((f) => ({
        name: f.name,
        url: supabase.storage.from(activeBucket).getPublicUrl(f.name).data.publicUrl,
        updated_at: f.updated_at,
        size: f.metadata?.size || 0,
        metadata: f.metadata ? { width: (f.metadata as any).width, height: (f.metadata as any).height } : undefined,
      }));
      setItems(mapped);
    } catch (err) {
      logError("Error fetching media:", err);
      toast({ title: "Erreur", description: "Impossible de charger les médias.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeBucket, toast]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(activeBucket).upload(path, file, {
        upsert: false,
      });
      if (error) throw error;
      toast({ title: "Fichier uploadé", description: `${file.name} a été ajouté.` });
      fetchMedia();
    } catch (err) {
      logError("Upload error:", err);
      toast({ title: "Erreur", description: "Échec de l'upload.", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const { error } = await supabase.storage.from(activeBucket).remove([name]);
      if (error) throw error;
      toast({ title: "Fichier supprimé" });
      setItems((prev) => prev.filter((i) => i.name !== name));
      setPreviewItem(null);
    } catch (err) {
      logError("Delete error:", err);
      toast({ title: "Erreur", description: "Échec de la suppression.", variant: "destructive" });
    }
  };

  const copyUrl = (url: string, name: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(name);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filtered = searchQuery.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-bold">Médiathèque</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMedia} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <label className="cursor-pointer">
            <Button variant="default" size="sm" disabled={uploading} asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" />
                {uploading ? "Upload..." : "Upload"}
              </span>
            </Button>
            <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {BUCKETS.map((bucket) => (
          <Button
            key={bucket}
            size="sm"
            variant={activeBucket === bucket ? "default" : "outline"}
            onClick={() => setActiveBucket(bucket)}
          >
            <FolderOpen className="h-4 w-4 mr-1" />
            {bucket === "chat-attachments" ? "Chat" : bucket === "service-images" ? "Services" : "Projets"}
          </Button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un fichier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="h-8 w-8 opacity-50" />
          </div>
          <p className="font-semibold text-foreground">Aucun fichier trouvé</p>
          <p className="text-sm mt-1">{searchQuery ? "Essayez un autre terme." : "Uploader des images pour commencer."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((item) => (
            <Card key={item.name} className="card-hover overflow-hidden cursor-pointer" onClick={() => setPreviewItem(item)}>
              <div className="aspect-square relative bg-muted">
                <img
                  src={transformedUrl(item.url, 300)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-2 space-y-1">
                <p className="text-xs truncate font-medium">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(item.size)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!previewItem} onOpenChange={(o) => { if (!o) setPreviewItem(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base truncate">{previewItem?.name}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={transformedUrl(previewItem.url, 800)}
                  alt={previewItem.name}
                  className="w-full h-auto max-h-[50vh] object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Taille</p>
                  <p className="font-medium">{formatSize(previewItem.size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Bucket</p>
                  <p className="font-medium">{activeBucket}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">URL</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs truncate bg-muted px-2 py-1 rounded flex-1">{previewItem.url}</code>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => copyUrl(previewItem.url, previewItem.name)}>
                      {copiedId === previewItem.name ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(previewItem.name)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaLibrary;
