# Integration Guide - Where to Use New Components

This guide shows where and how to integrate the new features into your existing pages and components.

---

## 1. CAPTCHA Integration (Automatic)

### Status: ✅ Already Integrated

The CAPTCHA protection has been automatically integrated into:
- `src/components/BookingForm.tsx` - Booking form
- `src/components/Contact.tsx` - Contact form

**No additional changes needed** - users will see the protection badge automatically.

---

## 2. Feedback System Integration

### Location A: Customer Portal / Booking Details Page

**File:** `src/pages/CustomerPortal.tsx`

Add after completed bookings:

```tsx
import { FeedbackForm } from "@/components/FeedbackForm";
import { FeedbackList } from "@/components/FeedbackList";

export const BookingDetails = ({ bookingId, bookingStatus }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="booking-details">
      {/* Existing booking info */}
      <div className="booking-header">
        <h2>Booking Details</h2>
        {/* ... existing content ... */}
      </div>

      {/* Show feedback form only after service is completed */}
      {bookingStatus === 'completed' && !showFeedback && (
        <div className="mt-8">
          <button 
            onClick={() => setShowFeedback(true)}
            className="btn btn-primary"
          >
            Leave Feedback
          </button>
        </div>
      )}

      {/* Feedback form */}
      {showFeedback && (
        <div className="mt-8 border-t pt-8">
          <FeedbackForm 
            bookingId={bookingId}
            onSuccess={() => {
              setShowFeedback(false);
              // Refresh page or show success message
            }}
            onCancel={() => setShowFeedback(false)}
          />
        </div>
      )}
    </div>
  );
};
```

### Location B: Service/Booking Card

**File:** `src/components/BookingCard.tsx` or similar

Add to show recent feedback on booking cards:

```tsx
import { FeedbackList } from "@/components/FeedbackList";

export const BookingCard = ({ booking }) => {
  return (
    <Card className="p-6">
      {/* Existing booking info */}
      <div className="booking-info">
        <h3>{booking.service_type}</h3>
        <p>{booking.preferred_date} at {booking.preferred_time}</p>
      </div>

      {/* Show latest feedback for this booking */}
      {booking.status === 'completed' && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold mb-4">Customer Feedback</h4>
          <FeedbackList bookingId={booking.id} limit={1} />
        </div>
      )}
    </Card>
  );
};
```

### Location C: Services Overview / Statistics

**File:** `src/components/Services.tsx` or `src/pages/Index.tsx`

Add to show overall service quality:

```tsx
import { FeedbackList } from "@/components/FeedbackList";

export const ServicesSection = () => {
  return (
    <section className="services">
      <h2>Our Services</h2>
      
      {/* Existing services grid */}
      <div className="services-grid">
        {/* ... services ... */}
      </div>

      {/* Show overall customer feedback */}
      <div className="mt-16">
        <h3>Customer Reviews</h3>
        <FeedbackList limit={6} />
      </div>
    </section>
  );
};
```

---

## 3. Email Reminders Integration

### Status: ✅ Automatic

Email reminders are automatically managed:
- **Created:** When a booking is made (via database trigger)
- **Sent:** By scheduled Edge Function (needs cron job setup)
- **Tracked:** In `email_reminders` table

**No component integration needed** - this works silently in the background.

### Optional: Admin Dashboard Access

**File:** `src/pages/Admin.tsx` or `src/components/admin/EmailRemindersPanel.tsx`

Add to let admins monitor reminders:

```tsx
import { reminderService } from "@/lib/reminderService";

export const EmailRemindersPanel = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    const result = await reminderService.getPendingReminders();
    if (result.success) {
      setReminders(result.data || []);
    }
    setLoading(false);
  };

  const handleTriggerSending = async () => {
    const result = await reminderService.triggerReminderSending();
    if (result.success) {
      toast.success('Reminders sent!');
      fetchReminders();
    }
  };

  return (
    <div className="reminders-panel">
      <h3>Email Reminders Status</h3>
      
      <button onClick={handleTriggerSending} disabled={loading}>
        Send Pending Reminders Now
      </button>

      <table className="w-full mt-4">
        <thead>
          <tr>
            <th>Email</th>
            <th>Scheduled Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reminders.map(reminder => (
            <tr key={reminder.id}>
              <td>{reminder.email}</td>
              <td>{new Date(reminder.scheduled_send_time).toLocaleString()}</td>
              <td>
                <span className={`badge badge-${reminder.status}`}>
                  {reminder.status}
                </span>
              </td>
              <td>
                {reminder.status === 'failed' && (
                  <button onClick={() => handleRetry(reminder.id)}>
                    Retry
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 4. Integration Checklist

### For Each Page/Component:

- [ ] Import component: `import { FeedbackForm } from "@/components/FeedbackForm";`
- [ ] Add to appropriate location in JSX
- [ ] Pass required props (bookingId, onSuccess, etc.)
- [ ] Handle success/cancel callbacks
- [ ] Add loading state if needed
- [ ] Test on mobile and desktop

---

## 5. Example: Complete Booking Details Page

Here's a complete example integrating all features:

```tsx
// src/pages/BookingDetails.tsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackForm } from "@/components/FeedbackForm";
import { FeedbackList } from "@/components/FeedbackList";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, Clock } from "lucide-react";

export const BookingDetails = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { toast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not load booking details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin" />;
  if (!booking) return <div>Booking not found</div>;

  const isCompleted = booking.status === "completed";
  const canLeaveFeedback = isCompleted && !showFeedback;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Booking Status */}
      <div className="bg-card p-6 rounded-lg">
        <div className="flex items-center gap-4">
          {isCompleted ? (
            <CheckCircle className="text-green-500" size={32} />
          ) : (
            <Clock className="text-yellow-500" size={32} />
          )}
          <div>
            <h1 className="text-2xl font-bold">{booking.service_type}</h1>
            <p className="text-muted-foreground">
              {booking.preferred_date} at {booking.preferred_time}
            </p>
            <p className="text-sm mt-2">
              <span className={`px-3 py-1 rounded-full ${
                isCompleted 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {booking.status.toUpperCase()}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-card p-6 rounded-lg space-y-4">
        <h2 className="font-semibold">Details</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Address:</span> {booking.address}</p>
          <p><span className="font-medium">Email:</span> {booking.email}</p>
          <p><span className="font-medium">Phone:</span> {booking.phone}</p>
          {booking.message && (
            <p><span className="font-medium">Notes:</span> {booking.message}</p>
          )}
        </div>
      </div>

      {/* Feedback Section - Only Show if Completed */}
      {isCompleted && (
        <div className="space-y-6">
          {/* Existing Feedback */}
          <div>
            <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
            <FeedbackList bookingId={bookingId} limit={5} />
          </div>

          {/* Feedback Form */}
          {canLeaveFeedback && (
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90"
            >
              Leave Feedback
            </button>
          )}

          {showFeedback && (
            <div className="border-t pt-6">
              <FeedbackForm
                bookingId={bookingId}
                onSuccess={() => {
                  setShowFeedback(false);
                  fetchBooking(); // Refresh to show new feedback
                  toast({
                    title: "Success",
                    description: "Thank you for your feedback!",
                  });
                }}
                onCancel={() => setShowFeedback(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingDetails;
```

---

## 6. Styling Considerations

### If Using Tailwind CSS (Recommended):

The components are built with Tailwind and shadow-cn/ui, so they'll match your existing design automatically.

### Custom CSS:

If you need to customize styling, modify these files:
- `src/App.css` - Global styles
- Individual component files - Component-specific styles

### Dark Mode:

Components support dark mode via the `theme-toggle` functionality already in your app.

---

## 7. Responsive Design

All components are responsive:
- Mobile: Single column, touch-friendly
- Tablet: Optimized spacing
- Desktop: Full layout

No additional responsive classes needed.

---

## 8. Accessibility

Components include:
- Semantic HTML
- ARIA labels
- Keyboard navigation support
- Focus management
- Color contrast compliance

---

## 9. Performance Optimization

### Code Splitting:

To lazy-load feedback components:

```tsx
import { lazy, Suspense } from 'react';

const FeedbackForm = lazy(() => import('@/components/FeedbackForm'));

<Suspense fallback={<Loader />}>
  <FeedbackForm {...props} />
</Suspense>
```

### Caching:

Use React Query or SWR to cache feedback queries:

```tsx
import { useQuery } from '@tanstack/react-query';

const { data: feedbacks } = useQuery({
  queryKey: ['feedbacks', bookingId],
  queryFn: () => supabase.from('feedback_ratings').select('*'),
});
```

---

## 10. Testing Integration

### Unit Tests:

```tsx
import { render, screen } from '@testing-library/react';
import { FeedbackForm } from '@/components/FeedbackForm';

describe('FeedbackForm', () => {
  it('renders feedback form', () => {
    render(<FeedbackForm bookingId="test-id" />);
    expect(screen.getByText(/Évaluez votre expérience/)).toBeInTheDocument();
  });
});
```

### Integration Tests:

Test the complete feedback flow:
1. Create booking
2. Complete booking
3. Submit feedback
4. Verify feedback appears in list

---

## Summary

| Feature | Integration | Status |
|---------|-----------|--------|
| CAPTCHA | Forms | ✅ Auto-integrated |
| Feedback Form | Booking Details | Manual (Optional) |
| Feedback List | Services/Cards | Manual (Optional) |
| Email Reminders | Background | ✅ Auto-managed |
| Admin Panel | Dashboard | Manual (Optional) |

Most features work automatically once deployed. Only feedback system requires optional UI integration in your pages.
