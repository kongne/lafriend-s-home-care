import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, FileText, CheckCircle, MapPin } from "lucide-react";
import { rateLimit } from "@/lib/validation";
import { error as logError } from "@/lib/logger";
import { Seo } from "@/components/Seo";
import { LocationSearch } from "@/components/LocationSearch";

const QuoteRequest = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    serviceType: "",
    customService: "",
    propertySize: "",
    frequency: "",
    address: "",
    latitude: "",
    longitude: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      address: location.address,
      latitude: String(location.lat),
      longitude: String(location.lng),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rateLimitKey = user?.id || "anonymous";
    if (!rateLimit(`quote:${rateLimitKey}`, 3, 60000)) {
      toast({ title: "Trop de tentatives", description: "Veuillez patienter une minute.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const serviceLabel = formData.serviceType === "other" 
        ? `Autre: ${formData.customService}` 
        : formData.serviceType;

      const subject = `Demande de devis - ${serviceLabel}`;
      const locationInfo = formData.address
        ? `\nAdresse: ${formData.address}${formData.latitude ? ` (${formData.latitude}, ${formData.longitude})` : ""}`
        : "";
      const message = [
        `Service: ${serviceLabel}`,
        formData.propertySize && `Taille: ${formData.propertySize}`,
        formData.frequency && `Fréquence: ${formData.frequency}`,
        locationInfo || null,
        formData.message && `\nDétails: ${formData.message}`,
      ].filter(Boolean).join("\n");

      const { error } = await supabase.from("contact_submissions").insert({
        user_id: user?.id || null,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        subject,
        message,
        status: "unread",
      });

      if (error) throw error;

      setSubmitted(true);
      toast({ title: "Demande envoyée !", description: "Nous vous contacterons sous 24h avec votre devis." });
    } catch (err) {
      logError("Quote request error:", err);
      toast({ title: "Erreur", description: "Impossible d'envoyer la demande. Réessayez.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="section-padding">
        <div className="section-container max-w-lg">
          <Card className="card-elevated p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Demande reçue !</h2>
              <p className="text-muted-foreground">
                Notre équipe vous contactera sous 24h avec un devis personnalisé.
              </p>
            </div>
            <Button onClick={() => setSubmitted(false)} variant="outline">
              Nouvelle demande
            </Button>
          </Card>
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Devis gratuit — LaFriend's Nettoyage Bafoussam"
        description="Recevez un devis personnalisé sous 24h pour vos services de nettoyage à Bafoussam : résidentiel, commercial, automobile."
        path="/quote"
      />
      <Navbar />
      <main className="section-padding">
        <div className="section-container max-w-2xl">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Demander un devis gratuit
            </h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              Décrivez vos besoins et recevez un devis personnalisé sous 24h
            </p>
          </div>

          <Card className="card-elevated p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet *</Label>
                  <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required maxLength={100} placeholder="Votre nom" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required maxLength={254} placeholder="votre@email.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} maxLength={20} placeholder="+237 XXX XXX XXX" />
              </div>

              <div className="space-y-2">
                <Label>Adresse / Localisation</Label>
                <LocationSearch onLocationSelect={handleLocationSelect} selectedLocation={formData.address ? { address: formData.address, lat: parseFloat(formData.latitude || "0"), lng: parseFloat(formData.longitude || "0") } : null} />
              </div>

              <div className="space-y-2">
                <Label>Type de service *</Label>
                <Select value={formData.serviceType} onValueChange={v => setFormData(prev => ({ ...prev, serviceType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Nettoyage Résidentiel</SelectItem>
                    <SelectItem value="commercial">Nettoyage Commercial</SelectItem>
                    <SelectItem value="construction">Nettoyage Post-Construction</SelectItem>
                    <SelectItem value="windows">Nettoyage de Vitres</SelectItem>
                    <SelectItem value="car">Lavage Auto</SelectItem>
                    <SelectItem value="other">Autre service...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.serviceType === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="customService">Précisez le service *</Label>
                  <Input id="customService" name="customService" value={formData.customService} onChange={handleChange} required placeholder="Décrivez le service souhaité" maxLength={200} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taille approximative</Label>
                  <Select value={formData.propertySize} onValueChange={v => setFormData(prev => ({ ...prev, propertySize: v }))}>
                    <SelectTrigger><SelectValue placeholder="Superficie" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Petit (&lt; 50m²)</SelectItem>
                      <SelectItem value="medium">Moyen (50-150m²)</SelectItem>
                      <SelectItem value="large">Grand (150-300m²)</SelectItem>
                      <SelectItem value="xlarge">Très grand (&gt; 300m²)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fréquence souhaitée</Label>
                  <Select value={formData.frequency} onValueChange={v => setFormData(prev => ({ ...prev, frequency: v }))}>
                    <SelectTrigger><SelectValue placeholder="Fréquence" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Une seule fois</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Détails supplémentaires</Label>
                <Textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={4} maxLength={2000} placeholder="Décrivez vos besoins spécifiques, accès, contraintes horaires..." />
              </div>

              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-5 text-base" disabled={loading || !formData.serviceType || !formData.fullName || !formData.email}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi en cours...</> : "Demander mon devis gratuit"}
              </Button>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuoteRequest;
