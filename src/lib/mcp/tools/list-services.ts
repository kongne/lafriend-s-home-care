import { defineTool } from "@lovable.dev/mcp-js";

const SERVICES = [
  { id: "residential", name: "Nettoyage Résidentiel", description: "Appartements, maisons et villas.", from_fcfa: 25000 },
  { id: "commercial", name: "Nettoyage Commercial", description: "Bureaux, boutiques et immeubles.", from_fcfa: 50000 },
  { id: "post_construction", name: "Nettoyage Après Construction", description: "Nettoyage complet après travaux.", from_fcfa: 45000 },
  { id: "car_wash", name: "Lavage Auto", description: "Intérieur et extérieur.", from_fcfa: 5000 },
  { id: "carpet", name: "Nettoyage de Tapis & Moquettes", description: "Traitement en profondeur.", from_fcfa: 15000 },
  { id: "windows", name: "Lavage de Vitres", description: "Vitres intérieures et extérieures.", from_fcfa: 10000 },
  { id: "deep_clean", name: "Nettoyage Approfondi", description: "Grand nettoyage saisonnier.", from_fcfa: 45000 },
];

export default defineTool({
  name: "list_services",
  title: "List cleaning services",
  description: "List LaFriend's Services cleaning offerings with indicative starting prices in FCFA.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(SERVICES, null, 2) }],
    structuredContent: { services: SERVICES },
  }),
});