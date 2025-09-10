# 🎯 Recurring Events System

This system allows you to create events that automatically repeat on a schedule (weekly/monthly) and generate future event instances.

## 🏗️ Architecture

- **Minimal changes**: Just added `recurring_config` field to existing `events` table
- **Efficient**: Generates actual event records, not calculated on-the-fly
- **Simple**: Weekly/monthly patterns with flexible configuration
- **Automated**: Weekly job generates events for the next few weeks

## 📊 Database Schema

The `events` table now has a new field:

```sql
recurring_config JSONB DEFAULT NULL
```

## ⚙️ Configuration Examples

### Weekly Event (Every Friday at 10 PM)

```json
{
  "type": "weekly",
  "weekday": 4, // Friday (0=Monday, 4=Friday)
  "start_time": "22:00", // 10 PM
  "end_time": "02:00", // 2 AM next day
  "active": true
}
```

### Monthly Event (First Saturday of Every Month)

```json
{
  "type": "monthly",
  "month_day": 1, // 1st of month
  "weekday": 5, // Saturday
  "start_time": "21:00", // 9 PM
  "end_time": "01:00", // 1 AM next day
  "active": true
}
```

## 🚀 Usage

### 1. Create a Recurring Event

```python
from services.supabase_service import create_recurring_event
from datetime import datetime, timedelta

# Example: Every Friday at 10 PM
recurring_config = {
    "type": "weekly",
    "weekday": 4,  # Friday
    "start_time": "22:00",
    "end_time": "02:00",
    "active": True
}

event = create_recurring_event(
    title="Friday Night Party",
    caption="The best party in town every Friday!",
    club_id="your_club_id_here",
    poster_url="https://example.com/poster.jpg",
    music_genres=["HipHop", "EDM"],
    start_date=datetime.now(),
    end_date=datetime.now() + timedelta(hours=4),
    recurring_config=recurring_config
)
```

### 2. Generate Future Events

```bash
# Generate events for next 4 weeks (default)
python manage.py generate_recurring_events

# Generate events for next 8 weeks
python manage.py generate_recurring_events --weeks 8
```

### 3. Test the System

```bash
# Run the test script
python test_recurring_events.py
```

## 🔄 How It Works

1. **Create recurring event**: Event is created with `recurring_config` containing pattern info
2. **Generate instances**: System calculates next occurrences and creates individual event records
3. **Individual events**: Each generated event is a separate record with `recurring_config = NULL`
4. **Weekly job**: Automated process generates events for upcoming weeks

## 📅 Weekday Mapping

- `0` = Monday
- `1` = Tuesday
- `2` = Wednesday
- `3` = Thursday
- `4` = Friday
- `5` = Saturday
- `6` = Sunday

## 🛠️ API Functions

### `create_recurring_event()`

Creates an event with recurring configuration.

### `generate_recurring_events(weeks_ahead=4)`

Generates future events from all active recurring templates.

### `_generate_weekly_events()`

Internal function for weekly recurrence patterns.

### `_generate_monthly_events()`

Internal function for monthly recurrence patterns.

## ⏰ Automation

### Option 1: Railway Cron Job (Recommended)

```bash
# Run every Sunday at 2 AM
0 2 * * 0 cd /app && python manage.py generate_recurring_events --weeks 4
```

### Option 2: Manual (for testing)

```bash
python manage.py generate_recurring_events --weeks 4
```

## 🧪 Testing

1. **Create a recurring event** using the test script
2. **Generate events** using the management command
3. **Check your database** to see the generated events
4. **Verify** that individual events have `recurring_config = NULL`

## 🔍 Database Queries

### Find all recurring events:

```sql
SELECT * FROM events WHERE recurring_config IS NOT NULL;
```

### Find generated instances:

```sql
SELECT * FROM events WHERE recurring_config IS NULL;
```

### Find events for a specific club:

```sql
SELECT * FROM events WHERE club_id = 'your_club_id';
```

## 🚨 Important Notes

- **Individual events** (generated instances) have `recurring_config = NULL`
- **Template events** (recurring patterns) have `recurring_config` with pattern info
- **Generated events** inherit all properties from the template
- **Time zones** are handled in UTC (same as your existing system)
- **Active status** can be controlled via `"active": false` in config

## 🔮 Future Enhancements

- Ticket system integration
- Advanced recurrence patterns (custom RRULE)
- Conflict detection
- Revenue tracking
- Analytics and reporting

## 🆘 Troubleshooting

### Common Issues:

1. **No events generated**: Check if `recurring_config.active = true`
2. **Wrong dates**: Verify weekday numbers (0-6, Monday-Sunday)
3. **Time format**: Use 24-hour format (e.g., "22:00" not "10:00 PM")
4. **Club ID**: Ensure the club_id exists in your Clubs table

### Debug Commands:

```bash
# Check Django setup
python manage.py check

# Test recurring events
python test_recurring_events.py

# Generate events manually
python manage.py generate_recurring_events --weeks 1
```

---

**Need help?** Check the test script and management command for examples!
