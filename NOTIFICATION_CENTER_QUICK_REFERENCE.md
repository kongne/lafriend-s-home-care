# Notification Center - Quick Reference

## 10 New Features Added ✨

### 1. Search 🔍
- Real-time search by title or message
- Type in search box, see results instantly

### 2. Type Filter 🏷️
- Filter by: Booking, Contact, Warning, Error, System
- Select multiple types at once
- Shows active filter count

### 3. Archive 📦
- Archive instead of delete
- Toggle between active and archived views
- Restore archived notifications

### 4. Snooze ⏰
- Hide notification for 30 minutes
- Auto-reappears when timer ends
- Don't delete, just postpone

### 5. Priority Levels 🎯
- High (red) - urgent
- Medium (yellow) - important
- Low (green) - informational
- Visual badge on each notification

### 6. Mark as Unread 👁️
- Toggle read/unread status
- Eye icon shows/hides on hover
- Unread count updates

### 7. Mark All as Read ✅
- One-click mark all as read
- Only works on unread items
- Quick count clear

### 8. Enhanced UI 🎨
- Larger 450px width panel
- Better spacing and typography
- Color-coded left borders
- Improved hover effects

### 9. Better Info Display
- Type indicator dot
- Title + message separation
- Priority badge
- External link indicator
- French timestamps ("2 heures ago")

### 10. Expanded Data
- Loads 100 notifications (was 20)
- Still fast with client-side filtering
- Enough for most use cases

---

## How to Use

### Search Notifications
1. Click Bell icon
2. Type in search box
3. Results filter in real-time

### Filter by Type
1. Click "Type" button
2. Check notification types you want
3. Button shows count of active filters
4. Click again to remove filter

### Switch Views
Click "Actifs" or "Archive" button to toggle between:
- **Actifs**: Current notifications
- **Archive**: Archived notifications

### Snooze a Notification
1. Hover over notification
2. Click clock icon (⏰)
3. Notification hides for 30 minutes
4. Auto-reappears later

### Archive a Notification
1. Hover over notification
2. Click box icon (📦) in active view
3. Notification moves to archive
4. Switch to archive view to see it

### Restore Archived
1. Switch to "Archive" view
2. Hover over notification
3. Click checkmark (✓) icon
4. Notification back in active list

### Mark as Unread
1. Hover over notification
2. Click eye icon (👁️)
3. Notification shows as unread
4. Returns to bold text

### Mark All as Read
1. Click CheckCheck icon in header (✓✓)
2. All unread marked as read
3. Unread count drops to 0

---

## Button Icons Explained

| Icon | Name | Function | View |
|------|------|----------|------|
| 🔍 | Search | Search by text | Header |
| 📊 | Filter | Filter by type | Header |
| A | Active | Show active notifications | Header |
| Archive | Archive | Show archived notifications | Header |
| ✓✓ | Mark All Read | Mark all as read | Header |
| 👁️ | Unread | Mark as unread | Hover |
| ⏰ | Snooze | Snooze 30 minutes | Hover |
| 📦 | Archive | Archive notification | Hover (Active) |
| ✓ | Restore | Restore from archive | Hover (Archive) |
| 🗑️ | Delete | Permanently delete | Hover |

---

## Priority Color Codes

🔴 **High (Red)** → Urgent, needs immediate action
🟡 **Medium (Yellow)** → Important but not urgent
🟢 **Low (Green)** → Informational, FYI

---

## Notification Type Colors

🟢 **Booking** → New bookings, status changes
🔵 **Contact** → Contact form submissions
🟡 **Warning** → Important alerts
🔴 **Error** → System errors
🟣 **System** → Maintenance, events

---

## Example Actions

### Find all booking errors
1. Type "booking" in search
2. Filter by "Error" type
3. See: Red dot notifications with "booking"

### Archive old messages
1. Search "message" or "old"
2. Hover each notification
3. Click archive icon (📦)
4. All archived

### Review archived items
1. Click "Archive" view
2. See: All archived notifications
3. Restore (✓) or Delete (🗑️)

### Snooze non-urgent
1. See newsletter notification
2. Click clock icon (⏰)
3. Hides for 30 minutes
4. Reappears later

---

## Settings Tips

### Cleaner Inbox
- Archive instead of delete
- Snooze for later
- Filter out non-critical

### Quick Review
- Use search to find specific
- Filter by type to focus
- Mark unread to remember

### Regular Cleanup
- Archive old items weekly
- Delete confirmed resolved
- Check archive occasionally

---

## Mobile Friendly ✅

All features work on mobile:
- Search bar full width
- Filter dropdown responsive
- Touch-friendly button sizes
- Easy scrolling

---

## Keyboard Shortcuts

- **Escape**: Close notification panel
- **Type**: Activates search
- **Tab**: Navigate elements

---

## Database Fields

If creating notifications:
```json
{
  "type": "booking|contact|warning|error|system",
  "title": "Notification title",
  "message": "Detailed message",
  "link": "url/to/action",
  "priority": "high|medium|low",
  "is_read": false,
  "is_archived": false
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Search not working | Clear search box, try again |
| Archive button missing | Check `is_archived` field in DB |
| Snooze not showing | Wait 30 minutes or check console |
| Badges not showing | Verify `priority` field in DB |
| Count not updating | Refresh page |

---

## What's Stored vs. Client-Side

### Stored in Database ✅
- is_read (read status)
- is_archived (archived status)
- priority (notification priority)

### Client-Side Only ⚡
- Search results
- Type filters
- Snooze timer
- UI state

---

**Status**: ✅ Ready to Use
**Version**: 2.0
**Last Updated**: January 14, 2026

For detailed guide, see: [NOTIFICATION_CENTER_FEATURES.md](NOTIFICATION_CENTER_FEATURES.md)
