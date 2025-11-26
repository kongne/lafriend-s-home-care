import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export const BookingForm = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Réservation envoyée!",
      description: "Nous vous contactons bientôt pour confirmer votre rendez-vous.",
    });
  };

  return (
    <Card className="p-8 bg-card/95 backdrop-blur-sm shadow-2xl">
      <h3 className="text-2xl font-bold text-center mb-6 text-foreground">
        Réserver un service
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Votre Nom</Label>
          <Input id="name" placeholder="Entrez votre nom" required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input id="phone" type="tel" placeholder="+237 XXX XXX XXX" required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" placeholder="Votre adresse" required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="service">Choisir un Service</Label>
          <Select required>
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

        <Button 
          type="submit" 
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-6"
        >
          RÉSERVER MAINTENANT
        </Button>
      </form>
    </Card>
  );
};
