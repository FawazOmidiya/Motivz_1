import { RecurringConfig } from "../../../shared-types/recurring-events";

export interface Event {
  id: string;
  club_id: string;
  title: string;
  caption?: string;
  poster_url?: string;
  ticket_link?: string;
  guestlist_available?: boolean;
  start_date: string;
  end_date: string;
  music_genres?: string[];
  created_by: string;
  created_at: string;
  inserted_at: string;
  updated_at: string;
  recurring_config?: RecurringConfig;
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
  guestlist_available?: boolean;
  start_date: string;
  end_date: string;
  music_genres?: string[];
  recurring_config?: RecurringConfig;
  club_id?: string;
}
