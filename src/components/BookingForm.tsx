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
import { Loader2 } from "lucide-react";

export const BookingForm = () => {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    serviceType: "",
    preferredDate: "",
    preferredTime: "",
    message: ""
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from("bookings").insert({
        user_id: user?.id || null,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        service_type: formData.serviceType,
        preferred_date: formData.preferredDate,
        preferred_time: formData.preferredTime,
        message: formData.message || null
      });
      if (error) throw error;
      toast({
        title: "Réservation envoyée!",
        description: "Nous vous contacterons bientôt pour confirmer votre rendez-vous."
      });
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        serviceType: "",
        preferredDate: "",
        preferredTime: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <Card className="p-8 bg-card/95 backdrop-blur-sm shadow-2xl py-[32px] px-[32px] border-dashed rounded-md">
      <h3 className="text-2xl font-bold text-center mb-6 text-foreground">
        Réserver un service
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Votre Nom</Label>
          <Input id="fullName" name="fullName" placeholder="Entrez votre nom" value={formData.fullName} onChange={handleChange} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="votre@email.com" value={formData.email} onChange={handleChange} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input id="phone" name="phone" type="tel" placeholder="+237 XXX XXX XXX" value={formData.phone} onChange={handleChange} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" name="address" placeholder="Votre adresse" value={formData.address} onChange={handleChange} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="serviceType">Choisir un Service</Label>
          <Select value={formData.serviceType} onValueChange={value => setFormData(prev => ({
          ...prev,
          serviceType: value
        }))} required>
            <SelectTrigger>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preferredDate">Date souhaitée</Label>
            <Input id="preferredDate" name="preferredDate" type="date" value={formData.preferredDate} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredTime">Heure souhaitée</Label>
            <Select value={formData.preferredTime} onValueChange={value => setFormData(prev => ({
            ...prev,
            preferredTime: value
          }))} required>
              <SelectTrigger>
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
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message (optionnel)</Label>
          <Textarea id="message" name="message" placeholder="Précisions supplémentaires..." value={formData.message} onChange={handleChange} rows={3} />
        </div>

        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-6" disabled={loading}>
          {loading ? <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </> : "RÉSERVER MAINTENANT"}
        </Button>
      </form>
    </Card>;
};