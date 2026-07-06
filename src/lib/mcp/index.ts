import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listServicesTool from "./tools/list-services";
import getBusinessInfoTool from "./tools/get-business-info";
import listMyBookingsTool from "./tools/list-my-bookings";

// Read Supabase project ref from Vite env (inlined at build time — import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "lafriends-services-mcp",
  title: "LaFriend's Services",
  version: "0.1.0",
  instructions:
    "Tools for LaFriend's Services Ménagers (Bafoussam, Cameroun). Use `list_services` and `get_business_info` for public catalog/contact info. Use `list_my_bookings` to fetch the signed-in customer's cleaning bookings.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listServicesTool, getBusinessInfoTool, listMyBookingsTool],
});