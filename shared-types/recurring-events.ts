/**
 * Shared TypeScript types for recurring events functionality
 * Used across frontend, backend, and club-dashboard
 */

export interface RecurringConfig {
  /** Whether the recurring event is active */
  active: boolean;

  /** How often the event repeats */
  frequency: "daily" | "weekly" | "monthly";

  /** Days of the week for weekly events (0 = Sunday, 1 = Monday, etc.) */
  days_of_week?: number[];

  /** When to stop generating recurring events (ISO string) */
  end_date?: string;

  /** Maximum number of occurrences to generate */
  max_occurrences?: number;

  /** Timezone for the recurring events (optional, defaults to club timezone) */
  timezone?: string;
}

export interface RecurringEventTemplate {
  /** The base event template */
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
  recurring_config: RecurringConfig;
}

export interface GeneratedEventInstance {
  /** Individual event instance generated from template */
  club_id: string;
  title: string;
  caption?: string;
  poster_url?: string;
  ticket_link?: string;
  start_date: string;
  end_date: string;
  music_genres?: string[];
  created_by: string;
  /** Note: Individual instances don't have recurring_config */
}

export interface RecurringEventGenerationOptions {
  /** Number of weeks ahead to generate events */
  weeks_ahead?: number;

  /** Whether this is a dry run (no actual creation) */
  dry_run?: boolean;

  /** Specific club ID to generate for (optional) */
  club_id?: string;

  /** Specific event template ID to generate for (optional) */
  template_id?: string;
}

export interface RecurringEventGenerationResult {
  /** Success message */
  message: string;

  /** Number of events generated */
  count: number;

  /** Array of generated events */
  generated_events: GeneratedEventInstance[];

  /** Any warnings or additional info */
  warnings?: string[];
}
