import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, FileText, CheckCircle } from "lucide-react";
import { contactSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/validation";
import { error as logError } from "@/lib/logger";

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
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const message = [
        `Service: ${serviceLabel}`,
        formData.propertySize && `Taille: ${formData.propertySize}`,
        formData.frequency && `Fréquence: ${formData.frequency}`,
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
        <main className="container mx-auto px-4 py-24">
          <Card className="max-w-lg mx-auto p-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold text-foreground">Demande reçue !</h2>
            <p className="text-muted-foreground">
              Notre équipe vous contactera sous 24h avec un devis personnalisé.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline">
              Nouvelle demande
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <FileText className="h-12 w-12 mx-auto text-accent mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Demander un devis gratuit
            </h1>
            <p className="text-muted-foreground mt-2">
              Décrivez vos besoins et recevez un devis personnalisé sous 24h
            </p>
          </div>

          <Card className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-5" disabled={loading || !formData.serviceType || !formData.fullName || !formData.email}>
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
