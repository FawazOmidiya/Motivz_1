# DPRTMNTS Events Scraper

This Supabase Edge Function automatically scrapes events from DPRTMNTS website and inserts them into your events table.

## Features

- 🎵 **Automatic Event Detection**: Scrapes event names, dates, and ticket URLs
- 🎨 **Poster Image Extraction**: Fetches event poster images from ticket pages
- 🎭 **Genre Classification**: Automatically categorizes events by music genre
- 🔄 **Duplicate Prevention**: Prevents duplicate events from being inserted
- ⚡ **Fast Processing**: Efficient parsing and database operations

## Setup

### 1. Deploy the Function

```bash
# Make sure you're in the supabase directory
cd supabase

# Deploy the function
supabase functions deploy scrape-dprtmnt-events
```

### 2. Test the Function

```bash
# Test locally (optional)
deno run --allow-net test.ts

# Test the deployed function
curl -X POST 'https://your-project.supabase.co/functions/v1/scrape-dprtmnt-events' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Usage

### Manual Trigger

Call the function via HTTP request:

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/scrape-dprtmnt-events' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Scheduled Execution

Set up a cron job or use a service like GitHub Actions to run this function periodically:

```yaml
# .github/workflows/scrape-events.yml
name: Scrape DPRTMNTS Events
on:
  schedule:
    - cron: "0 9 * * *" # Run daily at 9 AM
  workflow_dispatch: # Allow manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Scrape Events
        run: |
          curl -X POST 'https://your-project.supabase.co/functions/v1/scrape-dprtmnt-events' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}'
```

## Event Data Structure

The scraper extracts the following information for each event:

```typescript
interface EventData {
  name: string; // Event name (e.g., "CID")
  start_datetime: string; // ISO datetime (defaults to 10 PM)
  end_datetime: string; // ISO datetime (defaults to 2 AM next day)
  poster_image_url: string | null; // Event poster image
  ticket_url: string | null; // Ticket purchase URL
  genre: string | null; // Inferred music genre
  source_url: string; // DPRTMNTS events page URL
}
```

## Genre Classification

The scraper automatically classifies events into these genres:

- **Techno**: techno, minimal techno, acid
- **House**: house, tech house, deep house, progressive
- **Trance**: trance, uplifting trance
- **EDM**: edm, big room, electro
- **Bass**: dubstep, dnb, drum & bass, bass
- **Hip-Hop**: hip hop, rap, trap
- **Latin**: reggaeton, latin, salsa, bachata
- **Afrobeats**: afrobeats, afro beats, afrobeat
- **Pop**: pop, top 40, mainstream

## Database Schema

The function inserts events into your `events` table with these fields:

- `title` → Event name
- `start_date` → Start datetime
- `end_date` → End datetime
- `image_url` → Poster image URL
- `ticket_url` → Ticket purchase URL
- `genre` → Music genre
- `source_url` → Source page URL
- `description` → Auto-generated description
- `club_id` → Can be mapped to specific club (optional)

## Error Handling

The function includes comprehensive error handling:

- **Network Errors**: Graceful handling of failed requests
- **Parsing Errors**: Continues processing even if some events fail
- **Duplicate Prevention**: Checks for existing events before insertion
- **Rate Limiting**: Respects server limits with delays

## Monitoring

Check the function logs in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions"
3. Click on "scrape-dprtmnt-events"
4. View logs and execution history

## Customization

### Modify Genre Keywords

Edit the `GENRE_KEYWORDS` object in `index.ts`:

```typescript
const GENRE_KEYWORDS = {
  techno: ["techno", "minimal techno", "acid"],
  house: ["house", "tech house", "deep house"],
  // Add your own genres...
};
```

### Change Default Times

Modify the default event times:

```typescript
// Default: 10 PM start, 2 AM end
startDate.setHours(22, 0, 0, 0); // 10 PM
endDate.setHours(2, 0, 0, 0); // 2 AM
```

### Add Club Mapping

Map events to specific clubs:

```typescript
// In the insertEvents function
club_id: event.club_id || "your-default-club-id",
```

## Troubleshooting

### Common Issues

1. **No events found**: Check if the website structure has changed
2. **Parsing errors**: Verify the HTML structure matches expected patterns
3. **Database errors**: Ensure your events table schema is correct
4. **Rate limiting**: Add delays between requests if needed

### Debug Mode

Enable detailed logging by adding console.log statements:

```typescript
console.log("Processing event:", event.name);
console.log("Found date:", dateMatch);
console.log("Ticket URL:", ticketUrl);
```

## License

This scraper is for educational and personal use only. Please respect the website's terms of service and robots.txt file.
