import { useState, useRef, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { error as logError } from "@/lib/logger";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatWidget = forwardRef<HTMLDivElement>((_props, ref) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: t('chat.welcome'),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update welcome message when language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "assistant") {
      setMessages([{ role: "assistant", content: t('chat.welcome') }]);
    }
  }, [t]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-support", {
        body: { messages: [...messages, userMessage] },
      });

      if (error) throw error;

      const response = data as { ok?: boolean; data?: { message?: string }; error?: string };

      if (!response.ok || !response.data?.message) {
        toast({
          title: t('chat.error'),
          description: response.error || t('chat.errorDesc'),
          variant: "destructive",
        });
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      logError("Error sending message:", err);
      toast({
        title: t('chat.error'),
        description: t('chat.errorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div ref={ref}>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-96 h-[70vh] sm:h-[500px] max-h-[500px] bg-background border-2 border-border rounded-lg shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">{t('chat.title')}</span>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary/80"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.placeholder')}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
ChatWidget.displayName = "ChatWidget";
