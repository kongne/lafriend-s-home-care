import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, CheckCircle2, User, Mail, Phone, MapPin, Briefcase, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";

const SERVICE_OPTIONS = [
  { value: "nettoyage", label: "Nettoyage" },
  { value: "nanny", label: "Nounou / Garde d'enfants" },
  { value: "cooker", label: "Cuisinier(ère)" },
  { value: "driver", label: "Chauffeur" },
  { value: "other", label: "Autre" },
] as const;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const WorkerRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    serviceType: "",
    experienceYears: "",
    motivation: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelect = (value: string) => {
    setForm((prev) => ({ ...prev, serviceType: value }));
    setErrors((prev) => ({ ...prev, serviceType: "" }));
  };

  const onFileSelect = (setter: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > MAX_FILE_BYTES) {
      toast.error("Fichier trop volumineux (max 10MB)");
      return;
    }
    setter(f);
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Nom requis";
    if (!form.email.trim()) errs.email = "Email requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide";
    if (!form.phone.trim()) errs.phone = "Téléphone requis";
    if (!form.serviceType) errs.serviceType = "Sélectionnez un service";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "pdf";
    const path = `worker-applications/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("identities")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      console.error("[WorkerReg] Upload error:", error);
      return null;
    }
    return path;
  };

  const handleSubmit = async () => {
    if (!validateStep1()) return;
    setSubmitting(true);

    try {
      let cvPath: string | null = null;
      let certPath: string | null = null;

      if (cvFile) cvPath = await uploadFile(cvFile, `cv-${form.fullName.replace(/\s+/g, "_")}`);
      if (certFile) certPath = await uploadFile(certFile, `cert-${form.fullName.replace(/\s+/g, "_")}`);

      const { error } = await supabase.from("worker_applications").insert({
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        service_type: form.serviceType,
        experience_years: form.experienceYears ? parseInt(form.experienceYears, 10) : null,
        motivation: form.motivation.trim(),
        cv_url: cvPath,
        certificates_url: certPath,
        status: "pending",
      });

      if (error) throw error;

      setDone(true);
      toast.success("Candidature envoyée avec succès !");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
          <h1 className="text-2xl font-bold">Candidature envoyée !</h1>
          <p className="text-muted-foreground text-sm">
            Merci pour votre intérêt ! Notre équipe examinera votre candidature et vous recontactera sous peu.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">Retour à l'accueil</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Seo
        title="Nous Rejoindre — LaFriend's"
        description="Postulez pour rejoindre l'équipe LaFriend's à Bafoussam. Nous recrutons des professionnels du nettoyage, nounous, cuisiniers, chauffeurs."
        path="/join-our-team"
      />
      <Card className="max-w-2xl w-full p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold">Rejoindre LaFriend's</h1>
            <p className="text-sm text-muted-foreground">
              Vous souhaitez travailler avec nous ? Postulez ci-dessous.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {[1, 2].map((n) => (
            <div key={n} className={`h-2 flex-1 rounded-full ${step >= n ? "bg-accent" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="fullName" name="fullName" placeholder="Jean Dupont" value={form.fullName} onChange={handleChange} className="pl-10" />
              </div>
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="votre@email.com" value={form.email} onChange={handleChange} className="pl-10" />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="phone" name="phone" type="tel" placeholder="+237 6XX XXX XXX" value={form.phone} onChange={handleChange} className="pl-10" />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="address" name="address" placeholder="Bafoussam, Cameroun" value={form.address} onChange={handleChange} className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type de service *</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Select value={form.serviceType} onValueChange={handleSelect}>
                  <SelectTrigger className="pl-10"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.serviceType && <p className="text-sm text-destructive">{errors.serviceType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceYears">Années d'expérience</Label>
              <Input id="experienceYears" name="experienceYears" type="number" min="0" max="50" placeholder="5" value={form.experienceYears} onChange={handleChange} />
            </div>

            <Button onClick={() => { if (validateStep1()) setStep(2); }} className="w-full">
              Suivant
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivation">Lettre de motivation</Label>
              <Textarea
                id="motivation"
                name="motivation"
                placeholder="Parlez-nous de vous, de votre expérience et de vos motivations à rejoindre LaFriend's..."
                value={form.motivation}
                onChange={handleChange}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cv">CV (PDF, max 10 Mo)</Label>
              <div className="flex items-center gap-2">
                <Input id="cv" ref={cvRef} type="file" accept=".pdf,.doc,.docx" onChange={onFileSelect(setCvFile)} className="flex-1" />
              </div>
              {cvFile && <p className="text-xs text-green-600 flex items-center gap-1"><Upload className="h-3 w-3" /> {cvFile.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificates">Certificats / Diplômes (optionnel)</Label>
              <div className="flex items-center gap-2">
                <Input id="certificates" ref={certRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={onFileSelect(setCertFile)} className="flex-1" />
              </div>
              {certFile && <p className="text-xs text-green-600 flex items-center gap-1"><Upload className="h-3 w-3" /> {certFile.name}</p>}
            </div>

            <p className="text-xs text-muted-foreground">
              Votre candidature sera examinée par notre équipe RH. Nous vous recontacterons par email ou téléphone.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1" disabled={submitting}>
                Retour
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-[2] bg-accent text-accent-foreground hover:bg-accent/90">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : "Envoyer ma candidature"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WorkerRegistration;
