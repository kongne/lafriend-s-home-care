import { defineTool } from "@lovable.dev/mcp-js";

const INFO = {
  name: "LaFriend's Services Ménagers",
  location: "Bafoussam, Cameroun",
  hours: "Lundi–Samedi, 07:00–19:00",
  phone: "+237 693 13 82 92",
  email: "lafriendsservices@gmail.com",
  website: "https://lafriendsservices.lovable.app",
  languages: ["fr", "en"],
};

export default defineTool({
  name: "get_business_info",
  title: "Get business info",
  description: "Return LaFriend's Services contact details, hours, and location.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(INFO, null, 2) }],
    structuredContent: INFO,
  }),
});