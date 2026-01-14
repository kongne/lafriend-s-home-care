import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import { contactSchema, rateLimit } from "@/lib/validation";
import { warn, error as logError } from "@/lib/logger";
import { getRecaptchaToken } from "@/lib/recaptcha";

export const Contact = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    const rateLimitKey = user?.id || 'anonymous';
    if (!rateLimit(`contact:${rateLimitKey}`, 5, 60000)) {
      toast({
        title: "Trop de tentatives",
        description: "Veuillez patienter une minute avant de réessayer.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate form data
    const validation = contactSchema.safeParse(formData);
    
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
      const recaptchaToken = await getRecaptchaToken('contact');
      
      const { error } = await supabase.from("contact_submissions").insert({
        user_id: user?.id || null,
        full_name: validation.data.fullName,
        email: validation.data.email,
        phone: validation.data.phone || null,
        subject: validation.data.subject,
        message: validation.data.message,
        recaptcha_token: recaptchaToken || null
      });

      if (error) throw error;

      // Send notification email
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'contact',
            data: {
              full_name: validation.data.fullName,
              email: validation.data.email,
              phone: validation.data.phone,
              subject: validation.data.subject,
              message: validation.data.message
            }
          }
        });
      } catch (notifError) {
        warn("Notification email skipped:", notifError);
      }

      toast({
        title: t('contact.success'),
        description: t('contact.successDesc'),
      });

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      logError("Contact error:", err);
      toast({
        title: t('booking.error'),
        description: t('booking.errorDesc'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <p className="text-accent font-semibold uppercase tracking-wider">{t('nav.contact')}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            {t('contact.title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Téléphone</h3>
                <p className="text-muted-foreground">+237 693 13 82 92</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Email</h3>
                <p className="text-muted-foreground">lafriendsservices@gmail.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Adresse</h3>
                <p className="text-muted-foreground">Bafoussam, Cameroun</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Horaires</h3>
                <p className="text-muted-foreground">Lun - Dim: 8:00 - 18:00</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 sm:p-8 rounded-lg shadow-lg">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-fullName">{t('booking.name')}</Label>
                <Input 
                  id="contact-fullName" 
                  name="fullName"
                  placeholder={t('booking.namePlaceholder')} 
                  value={formData.fullName}
                  onChange={handleChange}
                  required 
                  maxLength={100}
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">{t('booking.email')}</Label>
                <Input 
                  id="contact-email" 
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">{t('booking.phone')} (optionnel)</Label>
              <Input 
                id="contact-phone" 
                name="phone"
                type="tel" 
                placeholder="+237 XXX XXX XXX" 
                value={formData.phone}
                onChange={handleChange}
                maxLength={20}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject">{t('contact.subject')}</Label>
              <Input 
                id="contact-subject" 
                name="subject"
                placeholder={t('contact.subjectPlaceholder')} 
                value={formData.subject}
                onChange={handleChange}
                required 
                maxLength={200}
                className={errors.subject ? "border-destructive" : ""}
              />
              {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea 
                id="contact-message" 
                name="message"
                placeholder={t('booking.messagePlaceholder')} 
                rows={6}
                value={formData.message}
                onChange={handleChange}
                required 
                maxLength={2000}
                className={errors.message ? "border-destructive" : ""}
              />
              {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('contact.sending')}
                </>
              ) : (
                t('contact.send')
              )}
            </Button>
            
            {/* CAPTCHA Badge Notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
              <Shield className="w-3 h-3" />
              <p>Protected by reCAPTCHA</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
