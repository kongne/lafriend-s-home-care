export type Zone = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  eta: string;
  fee: number;
  primary?: boolean;
};

export const ZONES: Zone[] = [
  { id: "bafoussam",  name: "Bafoussam",  lat: 5.4737, lon: 10.4179, distanceKm: 0,   eta: "0-20 min", fee: 0,     primary: true },
  { id: "bandjoun",   name: "Bandjoun",   lat: 5.3778, lon: 10.4139, distanceKm: 15,  eta: "25-35 min", fee: 3000 },
  { id: "baham",      name: "Baham",      lat: 5.2664, lon: 10.3853, distanceKm: 25,  eta: "40-50 min", fee: 4000 },
  { id: "bandenkop",  name: "Bandenkop",  lat: 5.2117, lon: 10.3947, distanceKm: 30,  eta: "45-55 min", fee: 5000 },
  { id: "bafang",     name: "Bafang",     lat: 5.1610, lon: 10.1758, distanceKm: 55,  eta: "1h - 1h15", fee: 8000 },
  { id: "dschang",    name: "Dschang",    lat: 5.4460, lon: 10.0570, distanceKm: 45,  eta: "1h - 1h10", fee: 7000 },
  { id: "mbouda",     name: "Mbouda",     lat: 5.6260, lon: 10.2540, distanceKm: 30,  eta: "45-55 min", fee: 5000 },
  { id: "foumban",    name: "Foumban",    lat: 5.7274, lon: 10.9016, distanceKm: 75,  eta: "1h30",      fee: 10000 },
];
