import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MapPin, Crosshair, Navigation } from "lucide-react";

interface LocationResult {
  address: string;
  lat: number;
  lng: number;
}

interface LocationSearchProps {
  onLocationSelect: (location: LocationResult) => void;
  selectedLocation?: LocationResult | null;
}

export const LocationSearch = ({ onLocationSelect, selectedLocation }: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchAddress = async (q: string) => {
    if (!q || q.length < 3) { setResults([]); return; }
    setSearching(true);
    setError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=fr`,
        { headers: { "User-Agent": "LaFriendsHomeCare/1.0" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setResults(data.map((d: any) => ({
          address: d.display_name,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        })));
        setShowResults(true);
      } else {
        setResults([]);
        setError("Aucun résultat trouvé");
      }
    } catch {
      setError("Erreur de recherche");
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(value), 600);
  };

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée");
      return;
    }
    setGpsLoading(true);
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
          const loc = { address, lat, lng };
          setQuery(address);
          setResults([]);
          onLocationSelect(loc);
        } catch {
          const loc = { address: `${lat}, ${lng}`, lat, lng };
          setQuery(loc.address);
          onLocationSelect(loc);
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setError("Position indisponible. Vérifiez les permissions.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selectLocation = (loc: LocationResult) => {
    setQuery(loc.address);
    setShowResults(false);
    setResults([]);
    onLocationSelect(loc);
  };

  const mapEmbedUrl = selectedLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${selectedLocation.lng - 0.01},${selectedLocation.lat - 0.01},${selectedLocation.lng + 0.01},${selectedLocation.lat + 0.01}&layer=mapnik&marker=${selectedLocation.lat},${selectedLocation.lng}`
    : null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Saisissez votre adresse, quartier ou ville..."
            className="pl-9 pr-3"
          />
          {showResults && results.length > 0 && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectLocation(r)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 flex items-start gap-2 border-b last:border-0"
                >
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                  <span className="line-clamp-2">{r.address}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="button" variant="outline" size="icon" onClick={handleGetGpsLocation} disabled={gpsLoading} title="Utiliser ma position GPS">
          {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
        </Button>
      </div>

      {searching && <p className="text-xs text-muted-foreground animate-pulse"><Loader2 className="h-3 w-3 inline animate-spin mr-1" />Recherche...</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {selectedLocation && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
          <span className="line-clamp-2">{selectedLocation.address}</span>
        </div>
      )}

      {mapEmbedUrl && (
        <div className="rounded-lg overflow-hidden border border-border h-48 w-full">
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
