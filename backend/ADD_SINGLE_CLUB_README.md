# Add Single Club Script

This script allows you to add a single specific club to the database by providing the club name and address. It's useful for adding clubs that might not be found through the general search or for adding specific venues you know about.

## Usage

```bash
python add_single_club.py "Club Name" "Full Address"
```

## Examples

```bash
# Add a specific club with full address
python add_single_club.py "Rebel" "11 Polson St, Toronto, ON M5A 1A4, Canada"

# Add another club
python add_single_club.py "Coda" "794 Bathurst St, Toronto, ON M5S 2R6, Canada"

# Add a club with just the name (will search for it)
python add_single_club.py "The Drake Hotel" "1150 Queen St W, Toronto, ON M6J 1J3, Canada"
```

## How It Works

1. **Search Strategy**: The script tries multiple search approaches:

   - First: Exact name + address combination
   - Second: Just the club name
   - Third: Just the address

2. **Matching Logic**: It looks for places where:

   - The club name appears in the Google Places result
   - The address matches (either exact or contains the provided address)

3. **Data Collection**: For each found club, it fetches:

   - Basic info (name, address, location, rating)
   - Photos from Google Places
   - Additional details (website, reviews)
   - Operating hours

4. **Database Storage**: Saves the club to the `Clubs` table in Supabase

## Requirements

- Google Places API key configured in `.env` file
- Supabase credentials configured in `.env` file
- Python virtual environment activated

## Environment Variables

Make sure these are set in your `.env` file:

```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Error Handling

The script handles various scenarios:

- **Club not found**: Provides helpful tips for better searching
- **API errors**: Shows specific error messages
- **Missing credentials**: Checks for required environment variables
- **Database errors**: Reports save failures with details

## Tips for Best Results

1. **Use full addresses**: Include city, province, and postal code
2. **Exact spelling**: Make sure the club name is spelled correctly
3. **Try variations**: If the first search fails, try different name variations
4. **Check Google Maps**: Verify the club exists on Google Maps first

## Output

The script provides detailed feedback:

```
🎯 Adding club: Rebel
📍 Address: 11 Polson St, Toronto, ON M5A 1A4, Canada
============================================================
🔍 Searching for: 'Rebel 11 Polson St, Toronto, ON M5A 1A4, Canada'
   Found 1 places
   ✅ Found match: Rebel
📋 Found club details:
   Name: Rebel
   Address: 11 Polson St, Toronto, ON M5A 1A4, Canada
   Google ID: ChIJ...
   Rating: 4.2
💾 Saving to database...
✅ Successfully saved club: Rebel
🎉 Successfully added 'Rebel' to the database!
   Club ID: ChIJ...
```

## Troubleshooting

### "Could not find club" error

- Check the spelling of the club name
- Try using the full address including postal code
- Verify the club exists on Google Maps
- Try searching with just the club name or just the address

### API key errors

- Make sure `GOOGLE_PLACES_API_KEY` is set in your `.env` file
- Verify the API key has Places API access enabled
- Check if you've exceeded your API quota

### Database errors

- Ensure Supabase credentials are correct
- Check if the `Clubs` table exists
- Verify your Supabase project is active
