import { useState } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Repeat, Shield, MessageCircle, CheckCircle2, ArrowLeft, ArrowRight, Calculator, Sparkles } from "lucide-react";
import { bookingSchema, rateLimit } from "@/lib/validation";
import { error as logError } from "@/lib/logger";
import { Switch } from "@/components/ui/switch";
import { getRecaptchaToken, verifyRecaptchaToken } from "@/lib/recaptcha";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

const SERVICE_BASE_PRICE: Record<string, number> = {
  residential: 25000,
  commercial: 50000,
  construction: 80000,
  windows: 15000,
  car: 8000,
  other: 20000,
};

const SERVICE_LABEL: Record<string, string> = {
  residential: "Nettoyage Résidentiel",
  commercial: "Nettoyage Commercial",
  construction: "Nettoyage de Construction",
  windows: "Nettoyage de Vitres",
  car: "Lavage de Voiture",
  other: "Autre service",
};

const RECURRENCE_DISCOUNT: Record<string, number> = {
  weekly: 0.15,
  biweekly: 0.10,
  monthly: 0.05,
};

export const BookingForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    serviceType: "",
    customService: "",
    estimatedHours: "2",
    preferredDate: "",
    preferredTime: "",
    message: "",
    isRecurring: false,
    recurrenceType: "",
    recurrenceEndDate: "",
    confirmViaWhatsApp: false,
  });

  useEffect(() => {
    if (!user?.id) { setLoyaltyPoints(0); return; }
    void supabase.from("profiles").select("loyalty_points").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setLoyaltyPoints(data?.loyalty_points || 0));
  }, [user?.id]);

  const hours = parseInt(formData.estimatedHours || "0", 10) || 0;
  const basePrice = SERVICE_BASE_PRICE[formData.serviceType] || 0;
  const subtotal = basePrice * Math.max(1, hours / 2);
  const discount = formData.isRecurring && formData.recurrenceType
    ? subtotal * (RECURRENCE_DISCOUNT[formData.recurrenceType] || 0)
    : 0;
  const pointsDiscount = pointsToRedeem * 10; // 1 pt = 10 FCFA
  const estimatedTotal = Math.max(0, Math.round(subtotal - discount - pointsDiscount));
  const maxRedeemable = Math.min(loyaltyPoints, Math.floor(Math.max(0, subtotal - discount) / 10));
  const formatPrice = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const goToStep2 = () => {
    const stepErrors: Record<string, string> = {};
    if (!formData.serviceType) stepErrors.serviceType = "Veuillez sélectionner un service";
    if (formData.serviceType === "other" && !formData.customService.trim()) {
      stepErrors.customService = "Précisez le service";
    }
    if (hours < 1) stepErrors.estimatedHours = "Estimation invalide";
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rateLimitKey = user?.id || 'anonymous';
    if (!rateLimit(`booking:${rateLimitKey}`, 3, 60000)) {
      toast({
        title: "Trop de tentatives",
        description: "Veuillez patienter une minute avant de réessayer.",
        variant: "destructive"
      });
      return;
    }

    const validation = bookingSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast({
        title: t('booking.error'),
        description: "Veuillez corriger les erreurs dans le formulaire.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const recaptchaToken = await getRecaptchaToken('booking');
      const recaptchaResponse = await verifyRecaptchaToken(recaptchaToken, 'booking');

      if (!recaptchaResponse.success) {
        toast({ title: "reCAPTCHA failed", description: "Please try again.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const serviceLabel = formData.serviceType === "other"
        ? formData.customService
        : SERVICE_LABEL[formData.serviceType] || validation.data.serviceType;

      const { data: insertedBooking, error } = await supabase.from("bookings").insert({
        user_id: user?.id || null,
        full_name: validation.data.fullName,
        email: validation.data.email,
        phone: validation.data.phone,
        address: validation.data.address,
        service_type: serviceLabel,
        preferred_date: validation.data.preferredDate,
        preferred_time: validation.data.preferredTime,
        message: validation.data.message || null,
        is_recurring: formData.isRecurring,
        recurrence_type: formData.isRecurring ? formData.recurrenceType : null,
        recurrence_end_date: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : null
      }).select("id").single();

      if (error) throw error;

      // Apply Pay-with-Points if any
      if (user?.id && pointsToRedeem > 0 && insertedBooking?.id) {
        try {
          await supabase.rpc("redeem_points_for_booking", {
            p_user_id: user.id,
            p_booking_id: insertedBooking.id,
            p_points: pointsToRedeem,
          });
          setLoyaltyPoints((p) => Math.max(0, p - pointsToRedeem));
        } catch (e) { logError("Points redemption failed:", e); }
      }

      try {
        const { data: emailData, error: emailErr } = await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            clientEmail: validation.data.email,
            clientName: validation.data.fullName,
            serviceType: serviceLabel,
            preferredDate: validation.data.preferredDate,
            preferredTime: validation.data.preferredTime,
            address: validation.data.address,
            language: 'fr'
          }
        });
        if (emailErr || !(emailData as { ok?: boolean })?.ok) {
          throw new Error(emailErr?.message || (emailData as { error?: string })?.error || "Erreur d'envoi de l'email");
        }
      } catch (emailErr) {
        logError("Email confirmation error:", emailErr);
      }

      try {
        const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-notification', {
          body: {
            booking: {
              full_name: validation.data.fullName,
              email: validation.data.email,
              phone: validation.data.phone,
              address: validation.data.address,
              service_type: serviceLabel,
              preferred_date: validation.data.preferredDate,
              preferred_time: validation.data.preferredTime,
            }
          }
        });
        if (smsError || !(smsData as { ok?: boolean })?.ok) {
          throw new Error(smsError?.message || (smsData as { error?: string })?.error || "Erreur d'envoi du SMS");
        }
      } catch (smsErr) {
        logError("SMS notification error:", smsErr);
      }

      if (formData.confirmViaWhatsApp && validation.data.phone) {
        const whatsappMsg = encodeURIComponent(
          `✅ Réservation confirmée!\n\nService: ${serviceLabel}\nDate: ${validation.data.preferredDate}\nHeure: ${validation.data.preferredTime}\nAdresse: ${validation.data.address}\n\nMerci de votre confiance! - LaFriend's Services`
        );
        window.open(`https://wa.me/${validation.data.phone.replace(/\D/g, '')}?text=${whatsappMsg}`, "_blank");
      }

      toast({ title: t('booking.success'), description: t('booking.successDesc'), duration: 5000 });
      setSubmitted(true);
    } catch (err) {
      logError("Booking error:", err);
      toast({ title: t('booking.error'), description: t('booking.errorDesc'), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSubmitted(false);
    setStep(1);
    setFormData({
      fullName: "", email: "", phone: "", address: "", serviceType: "",
      customService: "", estimatedHours: "2", preferredDate: "", preferredTime: "",
      message: "", isRecurring: false, recurrenceType: "", recurrenceEndDate: "",
      confirmViaWhatsApp: false,
    });
    onSuccess?.();
  };

  if (submitted) {
    return (
      <Card className="p-6 sm:p-10 bg-card/95 backdrop-blur-sm shadow-2xl text-center space-y-6 rounded-md">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center animate-in zoom-in-50">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground">{t('booking.success')}</h3>
          <p className="text-muted-foreground">{t('booking.successDesc')}</p>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg text-left space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium text-right">{formData.serviceType === "other" ? formData.customService : SERVICE_LABEL[formData.serviceType]}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{formData.preferredDate} • {formData.preferredTime}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Estimation</span>
            <span className="font-bold text-accent">{formatPrice(estimatedTotal)}</span>
          </div>
        </div>
        <Button onClick={reset} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          Fermer
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8 bg-card/95 backdrop-blur-sm shadow-2xl border-dashed rounded-md">
      <h3 className="text-2xl font-bold text-center mb-4 text-foreground">Réserver un service</h3>

      <div className="flex items-center justify-center gap-2 mb-3">
        <div className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-accent' : 'bg-muted'}`} />
        <div className={`h-2 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-accent' : 'bg-muted'}`} />
      </div>
      <p className="text-center text-sm text-muted-foreground mb-6">
        Étape {step} / 2 — {step === 1 ? "Service & estimation" : "Vos coordonnées"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="serviceType">Choisir un Service</Label>
              <Select
                value={formData.serviceType}
                onValueChange={value => {
                  setFormData(prev => ({ ...prev, serviceType: value }));
                  if (errors.serviceType) setErrors(prev => ({ ...prev, serviceType: "" }));
                }}
              >
                <SelectTrigger className={errors.serviceType ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_LABEL).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceType && <p className="text-sm text-destructive">{errors.serviceType}</p>}
            </div>

            {formData.serviceType === "other" && (
              <div className="space-y-2">
                <Label htmlFor="customService">Précisez le service souhaité</Label>
                <Input id="customService" name="customService" placeholder="Ex: Nettoyage de piscine, Jardinage..." value={formData.customService} onChange={handleChange} maxLength={200} />
                {errors.customService && <p className="text-sm text-destructive">{errors.customService}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Durée estimée</Label>
              <Select value={formData.estimatedHours} onValueChange={value => setFormData(prev => ({ ...prev, estimatedHours: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,8].map(h => (
                    <SelectItem key={h} value={String(h)}>{h} heure{h>1?'s':''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.serviceType && hours > 0 && (
              <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-lg p-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Calculator className="h-4 w-4 text-accent" />
                  Estimation du prix
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatPrice(Math.round(subtotal))}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Remise abonnement</span>
                    <span>-{formatPrice(Math.round(discount))}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-accent/20 font-bold">
                  <span>Total estimé</span>
                  <span className="text-accent text-lg">{formatPrice(estimatedTotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">* Estimation indicative — confirmation après visite.</p>
              </div>
            )}

            {user?.id && loyaltyPoints > 0 && formData.serviceType && hours > 0 && (
              <div className="bg-gradient-to-br from-primary/5 to-accent/10 border border-accent/30 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Payer avec mes points fidélité
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Solde : <span className="font-bold text-accent">{loyaltyPoints} pts</span>
                  </span>
                </div>
                {maxRedeemable > 0 ? (
                  <>
                    <Slider
                      value={[Math.min(pointsToRedeem, maxRedeemable)]}
                      onValueChange={([v]) => setPointsToRedeem(Math.floor(v / 10) * 10)}
                      min={0}
                      max={maxRedeemable}
                      step={10}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 pts</span>
                      <span>{maxRedeemable} pts max</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm pt-1">
                      <div className="bg-background/60 rounded p-2">
                        <p className="text-muted-foreground text-xs">Points utilisés</p>
                        <p className="font-bold">{pointsToRedeem} pts</p>
                      </div>
                      <div className="bg-background/60 rounded p-2">
                        <p className="text-muted-foreground text-xs">Réduction</p>
                        <p className="font-bold text-green-600">-{formatPrice(pointsDiscount)}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">1 point = 10 FCFA · paliers de 10</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Sélectionnez un service pour activer la réduction.</p>
                )}
              </div>
            )}

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-dashed">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-accent" />
                  <Label htmlFor="isRecurring" className="font-medium">Réservation récurrente</Label>
                </div>
                <Switch
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    isRecurring: checked,
                    recurrenceType: checked ? "weekly" : "",
                    recurrenceEndDate: ""
                  }))}
                />
              </div>
              {formData.isRecurring && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceType">Fréquence</Label>
                    <Select value={formData.recurrenceType} onValueChange={value => setFormData(prev => ({ ...prev, recurrenceType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir la fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Hebdomadaire (-15%)</SelectItem>
                        <SelectItem value="biweekly">Bi-hebdomadaire (-10%)</SelectItem>
                        <SelectItem value="monthly">Mensuel (-5%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceEndDate">Date de fin (optionnel)</Label>
                    <Input id="recurrenceEndDate" name="recurrenceEndDate" type="date" value={formData.recurrenceEndDate} onChange={handleChange} />
                  </div>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={goToStep2}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-4 sm:py-6"
            >
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Votre Nom</Label>
              <Input id="fullName" name="fullName" placeholder="Entrez votre nom" value={formData.fullName} onChange={handleChange} required maxLength={100} className={errors.fullName ? "border-destructive" : ""} />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="votre@email.com" value={formData.email} onChange={handleChange} required maxLength={255} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+237 XXX XXX XXX" value={formData.phone} onChange={handleChange} required maxLength={20} className={errors.phone ? "border-destructive" : ""} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" name="address" placeholder="Entrez votre adresse" value={formData.address} onChange={handleChange} required maxLength={200} className={errors.address ? "border-destructive" : ""} />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredDate">Date</Label>
                <Input id="preferredDate" name="preferredDate" type="date" value={formData.preferredDate} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} className={errors.preferredDate ? "border-destructive" : ""} />
                {errors.preferredDate && <p className="text-sm text-destructive">{errors.preferredDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Heure</Label>
                <Select value={formData.preferredTime} onValueChange={value => {
                  setFormData(prev => ({ ...prev, preferredTime: value }));
                  if (errors.preferredTime) setErrors(prev => ({ ...prev, preferredTime: "" }));
                }}>
                  <SelectTrigger className={errors.preferredTime ? "border-destructive" : ""}>
                    <SelectValue placeholder="Heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {["08:00","09:00","10:00","11:00","14:00","15:00","16:00","17:00"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.preferredTime && <p className="text-sm text-destructive">{errors.preferredTime}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea id="message" name="message" placeholder="Précisions supplémentaires..." value={formData.message} onChange={handleChange} rows={3} maxLength={1000} />
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <Checkbox
                id="confirmViaWhatsApp"
                checked={formData.confirmViaWhatsApp}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, confirmViaWhatsApp: checked as boolean }))}
              />
              <label htmlFor="confirmViaWhatsApp" className="flex items-center gap-2 text-sm cursor-pointer">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span>Confirmation par WhatsApp</span>
              </label>
            </div>

            {formData.serviceType && hours > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm flex justify-between items-center">
                <span className="text-muted-foreground">Estimation total</span>
                <span className="font-bold text-accent">{formatPrice(estimatedTotal)}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1" disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button type="submit" className="flex-[2] bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-4 sm:py-6" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "RÉSERVER MAINTENANT"
                )}
              </Button>
            </div>
          </>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
          <Shield className="w-3 h-3" />
          <p>Protected by reCAPTCHA</p>
        </div>
      </form>
    </Card>
  );
};
