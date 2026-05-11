import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Camera, Upload, CheckCircle2, ArrowLeft, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadIdentityFile, type IdentityDocType } from "@/lib/identity";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [docType, setDocType] = useState<IdentityDocType>("cni");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [existing, setExisting] = useState<{ status: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    void supabase
      .from("identity_documents")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data && setExisting(data));
  }, [user?.id]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const onFile = (setter: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > MAX_FILE_BYTES) {
      toast.error("Fichier trop volumineux (max 8MB)");
      return;
    }
    setter(f);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      toast.error("Caméra non accessible");
    }
  };

  const captureSelfie = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setSelfie(blob);
      setSelfiePreview(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }, "image/jpeg", 0.9);
  };

  const retakeSelfie = () => {
    setSelfie(null);
    setSelfiePreview(null);
    void startCamera();
  };

  const submit = async () => {
    if (!user?.id) return;
    if (!front || !selfie) {
      toast.error("Pièce d'identité (recto) et selfie requis");
      return;
    }
    setSubmitting(true);
    try {
      const frontPath = await uploadIdentityFile(user.id, front, "front", front.name.split(".").pop() || "jpg");
      const backPath = back ? await uploadIdentityFile(user.id, back, "back", back.name.split(".").pop() || "jpg") : null;
      const selfiePath = await uploadIdentityFile(user.id, selfie, "selfie", "jpg");

      const { error } = await supabase.from("identity_documents").insert({
        user_id: user.id,
        doc_type: docType,
        front_url: frontPath,
        back_url: backPath,
        selfie_url: selfiePath,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Vérification envoyée — réponse sous 24-48h");
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  if (done || existing?.status === "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
          <h1 className="text-2xl font-bold">
            {existing?.status === "approved" ? "Compte vérifié" : "Vérification envoyée"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {existing?.status === "approved"
              ? "Votre identité a été validée. Merci !"
              : "Notre équipe examinera vos documents sous 24-48 heures. Vous recevrez une notification."}
          </p>
          <Button onClick={() => navigate("/customer-portal")} className="w-full">Retour au portail</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-2xl w-full p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold">Vérification d'identité (KYC)</h1>
            <p className="text-sm text-muted-foreground">Étape {step} sur 3</p>
          </div>
        </div>

        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`h-2 flex-1 rounded-full ${step >= n ? "bg-accent" : "bg-muted"}`} />
          ))}
        </div>

        {existing?.status === "pending" && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 rounded-lg p-3 text-sm">
            Une vérification est déjà en cours d'examen. En soumettre une nouvelle remplacera la précédente.
          </div>
        )}
        {existing?.status === "rejected" && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 rounded-lg p-3 text-sm">
            Votre dernière vérification a été rejetée. Veuillez resoumettre des documents valides.
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de document</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as IdentityDocType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cni">Carte Nationale d'Identité (CNI)</SelectItem>
                  <SelectItem value="passport">Passeport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Préparez votre document et un endroit bien éclairé pour le selfie.
            </p>
            <Button onClick={() => setStep(2)} className="w-full">
              Continuer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Photo recto du document *</Label>
              <Input type="file" accept="image/*" onChange={onFile(setFront)} />
              {front && <p className="text-xs text-green-600">✓ {front.name}</p>}
            </div>
            {docType === "cni" && (
              <div className="space-y-2">
                <Label>Photo verso du document (optionnel)</Label>
                <Input type="file" accept="image/*" onChange={onFile(setBack)} />
                {back && <p className="text-xs text-green-600">✓ {back.name}</p>}
              </div>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Upload className="h-3 w-3" /> JPG/PNG, 8 Mo max. Vos données sont privées et chiffrées.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Button>
              <Button onClick={() => setStep(3)} disabled={!front} className="flex-[2]">
                Continuer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Selfie en direct</Label>
            {!selfiePreview ? (
              <div className="space-y-3">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                </div>
                <div className="flex gap-2">
                  {!streamRef.current ? (
                    <Button onClick={startCamera} className="flex-1" type="button">
                      <Camera className="mr-2 h-4 w-4" /> Activer la caméra
                    </Button>
                  ) : (
                    <Button onClick={captureSelfie} className="flex-1" type="button">
                      <Camera className="mr-2 h-4 w-4" /> Capturer
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <img src={selfiePreview} alt="selfie" className="w-full rounded-lg border" />
                <Button variant="outline" onClick={retakeSelfie} className="w-full" type="button">
                  <RefreshCw className="mr-2 h-4 w-4" /> Reprendre
                </Button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={submitting}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Button>
              <Button onClick={submit} disabled={submitting || !selfie || !front} className="flex-[2] bg-accent text-accent-foreground hover:bg-accent/90">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : "Soumettre la vérification"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Onboarding;