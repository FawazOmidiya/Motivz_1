# 🚀 Smart Recurring Events System

A smart, efficient system for automatically generating recurring events that avoids duplicates and only creates what's needed.

## ✨ Key Features

- **🔄 Smart Generation**: Only generates events that don't already exist
- **📅 Weekly Scheduling**: Runs once per week instead of daily
- **🛡️ Duplicate Prevention**: Tracks existing events to avoid recreating them
- **⚡ Efficient**: Minimal database operations and processing
- **🎯 Flexible**: Supports weekly and monthly recurring patterns
- **🧪 Test Mode**: Dry-run option to preview what would be generated

## 🏗️ Architecture

### How It Works

1. **Weekly Job**: Runs once per week (e.g., every Monday at 2 AM)
2. **Smart Detection**: Checks what events already exist vs. what should exist
3. **Gap Filling**: Only generates events for dates that don't have events
4. **Buffer Management**: Maintains 3-4 weeks of events ahead

### Database Schema

The system uses your existing `events` table with a `recurring_config` JSONB field:

```sql
-- Example recurring_config for weekly events
{
  "type": "weekly",
  "weekday": 4,        -- Friday (0=Monday, 4=Friday)
  "start_time": "22:00",
  "end_time": "02:00",
  "active": true
}

-- Example recurring_config for monthly events
{
  "type": "monthly",
  "month_day": 1,      -- 1st of month
  "weekday": 5,        -- Saturday
  "start_time": "21:00",
  "end_time": "01:00",
  "active": true
}
```

## 🚀 Usage

### 1. Create Recurring Events

```python
from services.supabase_service import create_recurring_event

# Weekly event
weekly_config = {
    "type": "weekly",
    "weekday": 4,  # Friday
    "start_time": "22:00",
    "end_time": "02:00",
    "active": True
}

event = create_recurring_event(
    title="Friday Night Party",
    caption="The best party every Friday!",
    club_id="your_club_id",
    poster_url="https://example.com/poster.jpg",
    music_genres=["HipHop", "EDM"],
    start_date="2024-01-01T22:00:00",
    end_date="2024-01-02T02:00:00",
    recurring_config=weekly_config
)
```

### 2. Generate Events Manually

```bash
# Generate events for next 4 weeks
python manage.py smart_generate_recurring_events --weeks 4

# Test mode (see what would be generated without creating)
python manage.py smart_generate_recurring_events --weeks 4 --dry-run

# Generate events for next 2 weeks
python manage.py smart_generate_recurring_events --weeks 2
```

### 3. Automated Weekly Generation

Set up a cron job or Railway Cron to run weekly:

```bash
# Every Monday at 2 AM
0 2 * * 1 cd /path/to/backend && python manage.py smart_generate_recurring_events --weeks 4
```

## 🧪 Testing

### Test Organization

All tests are organized in the `tests/` folder:

```
backend/
├── tests/
│   ├── __init__.py
│   ├── README.md
│   ├── run_all_tests.py
│   ├── test_recurring_events.py
│   └── test_smart_recurring_events.py
└── run_tests.sh
```

### Run the Smart Generation Tests

```bash
cd backend
python tests/test_smart_recurring_events.py
```

### Run All Tests

```bash
cd backend
python tests/run_all_tests.py

# Or use the convenient shell script
./run_tests.sh
```

This will test:

- ✅ Creating recurring events
- ✅ First run of smart generation
- ✅ Second run (should avoid duplicates)
- ✅ Extended weeks generation

### Test the Management Command

```bash
# Test mode
python manage.py smart_generate_recurring_events --dry-run

# Actual generation
python manage.py smart_generate_recurring_events --weeks 3
```

## 🔧 Configuration

### Weekly Generation Settings

- **Default weeks ahead**: 4 weeks
- **Generation frequency**: Once per week
- **Buffer management**: Always maintains 3-4 weeks of events

### Customization

You can modify the generation logic in `services/supabase_service.py`:

- `smart_generate_recurring_events()` - Main generation function
- `_calculate_events_needed()` - Determines what events are needed
- `_find_missing_dates()` - Identifies gaps in event coverage

## 📊 Monitoring

### Check Generation Status

```sql
-- See all recurring event templates
SELECT title, recurring_config, created_at
FROM events
WHERE recurring_config IS NOT NULL;

-- Count generated instances
SELECT COUNT(*)
FROM events
WHERE recurring_config IS NULL
AND title LIKE '%Friday Night Party%';
```

### Logs

The system provides detailed logging:

- 🔄 Generation start
- 📅 Events found
- 🎯 Events being generated
- 💾 Database insertion
- ✅ Completion status

## 🚨 Troubleshooting

### Common Issues

1. **No events generated**

   - Check if recurring events exist and are active
   - Verify `recurring_config` is properly formatted

2. **Duplicate events**

   - The smart system should prevent this
   - Check if manual generation was used

3. **Wrong dates**
   - Verify weekday numbering (0=Monday, 4=Friday)
   - Check time format (HH:MM)

### Debug Mode

Add debug logging to see exactly what's happening:

```python
# In smart_generate_recurring_events()
print(f"Debug: Processing event: {event['title']}")
print(f"Debug: Config: {config}")
print(f"Debug: Events needed: {events_needed}")
```

## 🔄 Migration from Old System

If you have the old `generate_recurring_events()` function:

1. **Keep both systems** during transition
2. **Test the new system** thoroughly
3. **Switch over** when confident
4. **Remove old function** after validation

## 🎯 Best Practices

1. **Run weekly**: Don't run daily - it's inefficient
2. **Monitor logs**: Check generation status regularly
3. **Test changes**: Use `--dry-run` before production
4. **Backup data**: Always backup before major changes
5. **Start small**: Begin with 2-3 weeks, then expand

## 🚀 Production Deployment

### Railway Cron Setup

```yaml
# railway.json
{
  "cron":
    {
      "generate-events":
        {
          "schedule": "0 2 * * 1",
          "command": "cd backend && python manage.py smart_generate_recurring_events --weeks 4",
        },
    },
}
```

### Environment Variables

```bash
# .env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
DJANGO_SETTINGS_MODULE=core.settings
```

## 📈 Performance

- **Efficiency**: Only generates needed events
- **Database**: Minimal insert operations
- **Memory**: Low memory footprint
- **Scalability**: Handles hundreds of recurring events

## 🔮 Future Enhancements

- **Parent-child relationships** between recurring templates and instances
- **Advanced patterns** (bi-weekly, quarterly, yearly)
- **Exception handling** (skip specific dates)
- **Bulk operations** for multiple clubs
- **Analytics** on generation patterns

---

**🎉 Your recurring events system is now smart, efficient, and production-ready!**
