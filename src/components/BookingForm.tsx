import { useState } from "react";
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
import { Loader2, Repeat, Shield } from "lucide-react";
import { bookingSchema, rateLimit } from "@/lib/validation";
import { error as logError } from "@/lib/logger";
import { Switch } from "@/components/ui/switch";
import { getRecaptchaToken, verifyRecaptchaToken } from "@/lib/recaptcha";

export const BookingForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    serviceType: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
    isRecurring: false,
    recurrenceType: "",
    recurrenceEndDate: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    const rateLimitKey = user?.id || 'anonymous';
    if (!rateLimit(`booking:${rateLimitKey}`, 3, 60000)) {
      toast({
        title: "Trop de tentatives",
        description: "Veuillez patienter une minute avant de réessayer.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate form data
    const validation = bookingSchema.safeParse(formData);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
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
      // Get reCAPTCHA token for spam protection
      const recaptchaToken = await getRecaptchaToken('booking');
      
      // Verify reCAPTCHA token on backend
      const recaptchaResponse = await verifyRecaptchaToken(recaptchaToken, 'booking');

      if (!recaptchaResponse.success) {
        toast({
          title: "reCAPTCHA failed",
          description: "Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("bookings").insert({
        user_id: user?.id || null,
        full_name: validation.data.fullName,
        email: validation.data.email,
        phone: validation.data.phone,
        address: validation.data.address,
        service_type: validation.data.serviceType,
        preferred_date: validation.data.preferredDate,
        preferred_time: validation.data.preferredTime,
        message: validation.data.message || null,
        is_recurring: formData.isRecurring,
        recurrence_type: formData.isRecurring ? formData.recurrenceType : null,
        recurrence_end_date: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : null
      });

      if (error) throw error;

      // Send SMS notification to admin
      try {
        await supabase.functions.invoke('send-sms-notification', {
          method: 'POST',
          body: {
            booking: {
              full_name: validation.data.fullName,
              email: validation.data.email,
              phone: validation.data.phone,
              address: validation.data.address,
              service_type: validation.data.serviceType,
              preferred_date: validation.data.preferredDate,
              preferred_time: validation.data.preferredTime,
            }
          }
        });
      } catch (smsErr) {
        // Don't fail the booking if SMS fails
        logError("SMS notification error:", smsErr);
      }

      toast({
        title: t('booking.success'),
        description: t('booking.successDesc'),
        duration: 5000,
      });

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        serviceType: "",
        preferredDate: "",
        preferredTime: "",
        message: "",
        isRecurring: false,
        recurrenceType: "",
        recurrenceEndDate: ""
      });

      onSuccess?.();
    } catch (err) {
      logError("Booking error:", err);
      toast({
        title: t('booking.error'),
        description: t('booking.errorDesc'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 bg-card/95 backdrop-blur-sm shadow-2xl border-dashed rounded-md">
      <h3 className="text-2xl font-bold text-center mb-6 text-foreground">
        Réserver un service
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Votre Nom</Label>
          <Input 
            id="fullName" 
            name="fullName" 
            placeholder="Entrez votre nom" 
            value={formData.fullName} 
            onChange={handleChange} 
            required 
            maxLength={100}
            className={errors.fullName ? "border-destructive" : ""}
          />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="votre@email.com" 
            value={formData.email} 
            onChange={handleChange} 
            required 
            maxLength={255}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input 
            id="phone" 
            name="phone" 
            type="tel" 
            placeholder="+237 XXX XXX XXX" 
            value={formData.phone} 
            onChange={handleChange} 
            required 
            maxLength={20}
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input 
            id="address" 
            name="address" 
            placeholder="Entrez votre adresse" 
            value={formData.address} 
            onChange={handleChange} 
            required 
            maxLength={200}
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="serviceType">Choisir un Service</Label>
          <Select 
            value={formData.serviceType} 
            onValueChange={value => {
              setFormData(prev => ({ ...prev, serviceType: value }));
              if (errors.serviceType) setErrors(prev => ({ ...prev, serviceType: "" }));
            }} 
            required
          >
            <SelectTrigger className={errors.serviceType ? "border-destructive" : ""}>
              <SelectValue placeholder="Sélectionner un service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Nettoyage Résidentiel</SelectItem>
              <SelectItem value="commercial">Nettoyage Commercial</SelectItem>
              <SelectItem value="construction">Nettoyage de Construction</SelectItem>
              <SelectItem value="windows">Nettoyage de Vitres</SelectItem>
              <SelectItem value="car">Lavage de Voiture</SelectItem>
            </SelectContent>
          </Select>
          {errors.serviceType && <p className="text-sm text-destructive">{errors.serviceType}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preferredDate">Date souhaitée</Label>
            <Input 
              id="preferredDate" 
              name="preferredDate" 
              type="date" 
              value={formData.preferredDate} 
              onChange={handleChange} 
              required 
              min={new Date().toISOString().split('T')[0]}
              className={errors.preferredDate ? "border-destructive" : ""}
            />
            {errors.preferredDate && <p className="text-sm text-destructive">{errors.preferredDate}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredTime">Heure souhaitée</Label>
            <Select 
              value={formData.preferredTime} 
              onValueChange={value => {
                setFormData(prev => ({ ...prev, preferredTime: value }));
                if (errors.preferredTime) setErrors(prev => ({ ...prev, preferredTime: "" }));
              }} 
              required
            >
              <SelectTrigger className={errors.preferredTime ? "border-destructive" : ""}>
                <SelectValue placeholder="Heure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00">08:00</SelectItem>
                <SelectItem value="09:00">09:00</SelectItem>
                <SelectItem value="10:00">10:00</SelectItem>
                <SelectItem value="11:00">11:00</SelectItem>
                <SelectItem value="14:00">14:00</SelectItem>
                <SelectItem value="15:00">15:00</SelectItem>
                <SelectItem value="16:00">16:00</SelectItem>
                <SelectItem value="17:00">17:00</SelectItem>
              </SelectContent>
            </Select>
            {errors.preferredTime && <p className="text-sm text-destructive">{errors.preferredTime}</p>}
          </div>
        </div>

        {/* Recurring Booking Options */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="recurrenceType">Fréquence</Label>
                <Select 
                  value={formData.recurrenceType} 
                  onValueChange={value => setFormData(prev => ({ ...prev, recurrenceType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir la fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Hebdomadaire (chaque semaine)</SelectItem>
                    <SelectItem value="biweekly">Bi-hebdomadaire (toutes les 2 semaines)</SelectItem>
                    <SelectItem value="monthly">Mensuel (chaque mois)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurrenceEndDate">Date de fin (optionnel)</Label>
                <Input 
                  id="recurrenceEndDate" 
                  name="recurrenceEndDate" 
                  type="date" 
                  value={formData.recurrenceEndDate} 
                  onChange={handleChange}
                  min={formData.preferredDate || new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">Laissez vide pour une durée indéterminée</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message (optionnel)</Label>
          <Textarea 
            id="message" 
            name="message" 
            placeholder="Précisions supplémentaires..." 
            value={formData.message} 
            onChange={handleChange} 
            rows={3} 
            maxLength={1000}
          />
          {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-4 sm:py-6" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            "RÉSERVER MAINTENANT"
          )}
        </Button>
        
        {/* CAPTCHA Badge Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
          <Shield className="w-3 h-3" />
          <p>Protected by reCAPTCHA</p>
        </div>
      </form>
    </Card>
  );
};
