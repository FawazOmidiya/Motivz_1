# Club Review Web App

A standalone web application that allows users to review clubs without needing to install the main app. Users can search for clubs, confirm their location, and submit detailed reviews including ratings, music genres, crowd levels, and written feedback.

## Features

- **Club Search**: Search for clubs by name
- **Personalized Club Links**: Each club has its own unique review URL (e.g., `/club-id`)
- **Share Review Links**: Copy direct links to share with customers for instant reviews
- **Club Confirmation**: Verify you're at the right club before reviewing
- **Rating System**: 1-5 star rating with descriptive labels
- **Music Genres**: Select from 18 different music genres
- **Crowd Levels**: Indicate how full the venue is (Empty to Packed)
- **Review Text**: Optional written feedback
- **Multi-step Form**: Guided experience with progress indicator
- **Mobile Responsive**: Works great on all devices

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** for database and backend
- **Lucide React** for icons

## Setup

1. **Clone and install dependencies**:

   ```bash
   cd web-review
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root directory:

   ```bash
   cp env.example .env.local
   ```

   Then add your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Database Setup**:
   Ensure your Supabase database has the following tables:

   - `Clubs` - Club information
   - `club_reviews` - Review submissions

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## URL Structure

The app supports two main URL patterns:

- **Home Page**: `/` - Search for clubs and copy review links
- **Club Review Page**: `/{clubId}` - Direct review page for a specific club

### Example URLs

- `https://yoursite.com/` - Main search page
- `https://yoursite.com/abc123` - Review page for club with ID "abc123"

## Database Schema

### Clubs Table

```sql
id: string (primary key)
Name: string
Address: string
Description: text (optional)
Rating: float
Hours: jsonb (optional)
```

### club_reviews Table

```sql
id: string (primary key, auto-generated)
club_id: string (foreign key to Clubs.id)
rating: integer (1-5)
genres: string[] (array of selected genres)
review_text: text (optional)
crowd_level: string (empty|quiet|moderate|busy|packed)
created_at: timestamp (auto-generated)
user_id: string (optional, for authenticated users)
```

## Usage

### For Club Owners/Staff

1. **Search for Your Club**: Enter your club name in the search bar
2. **Copy Review Link**: Click the link icon next to your club to copy a direct review URL
3. **Share with Customers**: Share the link via QR codes, social media, or in-person
4. **Track Reviews**: Monitor incoming reviews through your dashboard

### For Customers

1. **Direct Link Access**: Visit a club-specific review link (e.g., `yoursite.com/club-id`)
2. **Confirm Selection**: Verify you're at the correct club
3. **Rate Your Experience**: Give a 1-5 star rating
4. **Select Music Genres**: Choose what music is playing
5. **Indicate Crowd Level**: Show how full the venue is
6. **Add Review Text**: Optional written feedback
7. **Submit**: Your review is saved to the database

### Traditional Search Flow

1. **Search for a Club**: Enter the club name in the search bar
2. **Select Club**: Click on the desired club from search results
3. **Follow Review Process**: Complete the same review steps as above

## Deployment

The app can be deployed to Vercel, Netlify, or any other Next.js-compatible hosting platform.

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is part of the Motivz club discovery platform.
