import { supabase } from "@/integrations/supabase/client";
import { error as logError } from "@/lib/logger";

export interface EmailReminder {
  id: string;
  booking_id: string;
  email: string;
  reminder_type: string;
  scheduled_send_time: string;
  sent_at: string | null;
  status: "pending" | "sent" | "failed";
  retry_count: number;
  last_error: string | null;
}

/**
 * Service for managing email reminders
 */
export const reminderService = {
  /**
   * Create a reminder for a specific booking
   */
  async createReminder(
    bookingId: string,
    email: string,
    appointmentDateTime: Date,
    reminderType: "24hours" | "48hours" = "24hours"
  ) {
    try {
      // Calculate when to send the reminder
      const hoursToSubtract = reminderType === "24hours" ? 24 : 48;
      const scheduledTime = new Date(appointmentDateTime.getTime());
      scheduledTime.setHours(scheduledTime.getHours() - hoursToSubtract);

      const { data, error } = await supabase.from("email_reminders").insert({
        booking_id: bookingId,
        email,
        reminder_type: reminderType,
        scheduled_send_time: scheduledTime.toISOString(),
        status: "pending",
      });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      logError("Error creating reminder:", err);
      return { success: false, error: err };
    }
  },

  /**
   * Get reminders for a specific booking
   */
  async getRemindersByBooking(bookingId: string) {
    try {
      const { data, error } = await supabase
        .from("email_reminders")
        .select("*")
        .eq("booking_id", bookingId)
        .order("scheduled_send_time", { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      logError("Error fetching reminders:", err);
      return { success: false, error: err };
    }
  },

  /**
   * Get all pending reminders
   */
  async getPendingReminders(limit = 10) {
    try {
      const { data, error } = await supabase
        .from("email_reminders")
        .select("*")
        .eq("status", "pending")
        .order("scheduled_send_time", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      logError("Error fetching pending reminders:", err);
      return { success: false, error: err };
    }
  },

  /**
   * Manually trigger the reminder sending process
   * This would typically be called by a cron job or scheduled function
   */
  async triggerReminderSending() {
    try {
      const response = await supabase.functions.invoke(
        "send-appointment-reminder",
        {
          method: "POST",
        }
      );

      return { success: true, data: response };
    } catch (err) {
      logError("Error triggering reminder sending:", err);
      return { success: false, error: err };
    }
  },

  /**
   * Cancel a reminder
   */
  async cancelReminder(reminderId: string) {
    try {
      const { error } = await supabase
        .from("email_reminders")
        .update({ status: "cancelled" })
        .eq("id", reminderId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      logError("Error cancelling reminder:", err);
      return { success: false, error: err };
    }
  },
};

export default reminderService;
