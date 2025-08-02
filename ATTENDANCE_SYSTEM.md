# Attendance System

This system automatically clears user attendance status when clubs close, ensuring that users' "going" status is reset to "not going" at the appropriate time.

## How It Works

### 1. User Checks Into Club

When a user checks into a club using the `updateUserActiveClub()` function:

1. The system calculates when the club closes based on its operating hours
2. Sets the `active_club_closed` field to the closing datetime
3. Updates the user's profile with both `active_club_id` and `active_club_closed`

### 2. Automatic Attendance Clearing

When the app opens or when the user logs in:

1. The `checkAndClearExpiredAttendance()` function is called
2. It checks if the current time is past the `active_club_closed` time
3. If so, it clears both `active_club_id` and `active_club_closed` fields
4. Broadcasts the change to all connected clients for real-time updates

## Database Schema

The `profiles` table now includes:

- `active_club_id`: The club the user is currently attending (existing)
- `active_club_closed`: ISO datetime string when the club closes (new)

## Key Functions

### `updateUserActiveClub(userId, clubId)`

- Updates user's active club
- Automatically calculates and sets closing time
- Clears closing time when user leaves club

### `checkAndClearExpiredAttendance(userId)`

- Checks if user's club has closed
- Clears attendance if expired
- Returns true if attendance was cleared

### `checkAndClearAllExpiredAttendance()`

- Checks all users for expired attendance
- Useful for testing or manual cleanup
- Returns count of cleared users and any errors

## Integration Points

### SessionContext

- Automatically checks expired attendance when app starts
- Checks when user logs in
- Ensures attendance is always up-to-date

### Real-time Updates

- Uses Supabase real-time to broadcast attendance changes
- All connected clients receive immediate updates
- Friends lists and UI components update automatically

## Usage Examples

### Check Into Club

```typescript
// User checks into a club
await updateUserActiveClub(userId, clubId);
// This automatically sets active_club_closed to the club's closing time
```

### Manual Attendance Check

```typescript
// Check if current user's attendance has expired
const wasCleared = await checkAndClearExpiredAttendance(userId);
if (wasCleared) {
  console.log("Attendance was cleared due to club closing");
}
```

### Bulk Cleanup

```typescript
// Clear all expired attendance (for testing/admin)
const result = await checkAndClearAllExpiredAttendance();
console.log(`Cleared ${result.clearedCount} expired attendances`);
```

## Benefits

1. **Automatic**: No manual intervention required
2. **Real-time**: Immediate updates across all clients
3. **Efficient**: Only checks when app opens or user logs in
4. **Reliable**: Uses club's actual operating hours
5. **Scalable**: Works for any number of users and clubs

## Error Handling

- Graceful fallback if club hours are missing
- Continues operation even if attendance check fails
- Comprehensive error logging for debugging
- No impact on app functionality if system fails

## Testing

To test the system:

1. Check into a club with known closing hours
2. Verify `active_club_closed` is set correctly
3. Wait for club to close (or manually set past time in database)
4. Open app and verify attendance is cleared
5. Check that real-time updates work across devices

## Future Enhancements

- Notification system to alert users before club closes
- Support for special events with different hours
- Analytics on attendance patterns
- Time zone support for clubs in different locations
