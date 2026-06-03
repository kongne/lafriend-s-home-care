import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const LazyChatWidget = lazy(() =>
  import("@/components/ChatWidget").then((m) => ({ default: m.ChatWidget }))
);

export function ChatWidgetDeferred() {
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <Button
        onClick={() => setEnabled(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 z-50"
        size="icon"
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Suspense fallback={null}>
      <LazyChatWidget defaultOpen />
    </Suspense>
  );
}

