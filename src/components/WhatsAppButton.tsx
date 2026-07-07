import { useState } from "react";
import { MessageCircle, ChevronDown, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NUMBERS = [
  { label: "+237 693 13 82 92", value: "237693138292" },
  { label: "+237 683 40 62 90", value: "237683406290" },
];

export const WhatsAppButton = () => {
  const { t } = useLanguage();
  const message = encodeURIComponent(t("whatsapp.message"));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="fixed bottom-24 right-6 z-50 group focus:outline-none">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25" />
            <div className="relative flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 hover:scale-110">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-foreground text-background px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              {t("whatsapp.tooltip")}
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-foreground" />
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[200px]">
        {NUMBERS.map((n) => (
          <DropdownMenuItem key={n.value} asChild>
            <a
              href={`https://wa.me/${n.value}?text=${message}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 cursor-pointer"
            >
              <Phone className="h-4 w-4 text-green-500" />
              <span>{n.label}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WhatsAppButton;
