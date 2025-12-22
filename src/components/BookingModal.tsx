import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingForm } from "./BookingForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { ReactNode } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface BookingModalProps {
  children?: ReactNode;
  className?: string;
}

export const BookingModal = ({ children, className }: BookingModalProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            size="lg"
            className={`bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 ${className}`}
          >
            {t('hero.book')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-full max-w-full sm:max-w-[500px] rounded-none sm:rounded-lg max-h-[90vh] overflow-y-auto p-2 sm:p-0">
        <VisuallyHidden>
          <DialogTitle>{t('booking.title')}</DialogTitle>
          <DialogDescription>{t('booking.successDesc')}</DialogDescription>
        </VisuallyHidden>
        <BookingForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
