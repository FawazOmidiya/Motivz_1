export interface Event {
  id: string;
  club_id: string;
  title: string;
  caption?: string;
  poster_url?: string;
  ticket_link?: string;
  start_date: string;
  end_date: string;
  music_genres?: string[];
  created_by: string;
  created_at: string;
  inserted_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  Name: string;
  Image?: string;
  Address: string;
}

export interface CreateEventData {
  title: string;
  caption?: string;
  poster_url?: string;
  ticket_link?: string;
  start_date: string;
  end_date: string;
  music_genres?: string[];
}
