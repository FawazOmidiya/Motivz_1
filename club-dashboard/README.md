# Club Events Dashboard

A web dashboard for managing club events. Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- ✅ Create new events with start/end dates
- ✅ View all events with status indicators
- ✅ Edit and delete events
- ✅ Filter upcoming events
- ✅ Clean, modern UI with shadcn/ui components
- ✅ Responsive design

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env.local
   ```

   Then add your Supabase credentials to `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

Make sure you have the `events` table in your Supabase database:

```sql
create table events (
  id uuid default gen_random_uuid() primary key,
  inserted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  club_id text not null references "Clubs"(id) on delete cascade,
  event_name text not null,
  caption text,
  poster_url text,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  created_by text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint check_event_dates check (end_date > start_date)
);
```

## Usage

1. **Dashboard**: View overview and quick actions
2. **Create Event**: Add new events with all details
3. **View Events**: See all events with edit/delete options
4. **Filter Events**: View only upcoming events

## Current Configuration

- **Club ID**: Hardcoded to `ChIJHUs0vJ01K4gRys6H5F8MkGY`
- **Authentication**: None (manual admin access)
- **Event Creator**: Hardcoded as "admin"

## Future Enhancements

- [ ] Club owner authentication
- [ ] Multiple club support
- [ ] Image upload functionality
- [ ] Event analytics
- [ ] Email notifications
- [ ] Advanced filtering and search

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Database**: Supabase
- **Icons**: Lucide React
- **Date Handling**: date-fns
