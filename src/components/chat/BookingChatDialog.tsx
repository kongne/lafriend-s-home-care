import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MessageCircle } from "lucide-react";
import { ChatRoom } from "./ChatRoom";
import { useChatRooms } from "@/hooks/chat/useChatRooms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingTitle: string;
  assignedStaffId?: string | null;
}

export const BookingChatDialog = ({ open, onOpenChange, bookingId, bookingTitle, assignedStaffId }: Props) => {
  const { t } = useLanguage();
  const { ensureBookingRoom } = useChatRooms();
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setRoomId(null); return; }
    (async () => {
      try {
        // Resolve staff user_id from staff_members if needed
        let participants: string[] = [];
        if (assignedStaffId) {
          const { data } = await supabase
            .from("staff_members").select("user_id").eq("id", assignedStaffId).maybeSingle();
          if (data?.user_id) participants.push(data.user_id);
        }
        // include all admins so support reaches them
        const { data: admins } = await supabase
          .from("user_roles").select("user_id").eq("role", "admin");
        participants = [...participants, ...((admins || []).map((a) => a.user_id))];

        const id = await ensureBookingRoom.mutateAsync({
          bookingId, name: bookingTitle, participantIds: participants,
        });
        setRoomId(id);
      } catch (e) {
        toast.error(t('chat.errorDesc'));
        onOpenChange(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bookingId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 h-[80vh] flex flex-col">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-base truncate flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> {bookingTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {roomId
            ? <ChatRoom roomId={roomId} title={bookingTitle} />
            : <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};