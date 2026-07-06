import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void;
  latitude?: string;
  longitude?: string;
}

export const LocationPicker = ({ onLocationSelect, latitude, longitude }: LocationPickerProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`,
            { headers: { "User-Agent": "LaFriendsHomeCare/1.0" } }
          );
          const data = await res.json();
          const address = data?.display_name || `${lat}, ${lng}`;
          onLocationSelect(address, lat, lng);
        } catch {
          onLocationSelect(`${lat}, ${lng}`, lat, lng);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Impossible d'obtenir votre position. Vérifiez les permissions.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapEmbedUrl = latitude && longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(longitude) - 0.01},${parseFloat(latitude) - 0.01},${parseFloat(longitude) + 0.01},${parseFloat(latitude) + 0.01}&layer=mapnik&marker=${latitude},${longitude}`
    : null;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGetLocation}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {loading ? "Localisation..." : "GPS"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {mapEmbedUrl && (
        <div className="mt-2 rounded-lg overflow-hidden border border-border h-48 w-full">
          <iframe
            title="Aperçu de la position"
            src={mapEmbedUrl}
            className="w-full h-full"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};
