import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  RecurringConfig, 
  RecurringEventGenerationOptions, 
  RecurringEventGenerationResult,
  GeneratedEventInstance 
} from '../../../../shared-types/recurring-events';

export async function POST(request: NextRequest): Promise<NextResponse<RecurringEventGenerationResult>> {
  try {
    const options: RecurringEventGenerationOptions = await request.json();
    const { weeks_ahead = 4, dry_run = false } = options;

    // Get all active recurring events
    const { data: recurringEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .not('recurring_config', 'is', null);

    if (fetchError) {
      console.error('Error fetching recurring events:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch recurring events' }, { status: 500 });
    }

    if (!recurringEvents || recurringEvents.length === 0) {
      return NextResponse.json({ 
        message: 'No recurring events found',
        generated_events: [],
        count: 0
      });
    }

    const generatedEvents: GeneratedEventInstance[] = [];

    // Process each recurring event
    for (const event of recurringEvents) {
      const config: RecurringConfig = event.recurring_config;
      
      if (!config.active) continue;

      const newEvents = generateRecurringInstances(event, config, weeks_ahead);
      generatedEvents.push(...newEvents);
    }

    if (!dry_run && generatedEvents.length > 0) {
      // Insert generated events
      const { error: insertError } = await supabase
        .from('events')
        .insert(generatedEvents);

      if (insertError) {
        console.error('Error inserting recurring events:', insertError);
        return NextResponse.json({ error: 'Failed to create recurring events' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: dry_run ? 'Dry run completed' : 'Recurring events generated successfully',
      generated_events: generatedEvents,
      count: generatedEvents.length
    });

  } catch (error) {
    console.error('Error in recurring events API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateRecurringInstances(event: any, config: RecurringConfig, weeks_ahead: number): GeneratedEventInstance[] {
  const instances: GeneratedEventInstance[] = [];
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const duration = endDate.getTime() - startDate.getTime();

  // Calculate how many instances to generate
  const endGenerationDate = new Date();
  endGenerationDate.setDate(endGenerationDate.getDate() + (weeks_ahead * 7));

  let currentDate = new Date(startDate);
  let instanceCount = 0;

  while (currentDate <= endGenerationDate && instanceCount < (config.max_occurrences || 12)) {
    // Check if we should generate this instance based on frequency and days
    if (shouldGenerateInstance(currentDate, config, startDate)) {
      const newStartDate = new Date(currentDate);
      const newEndDate = new Date(newStartDate.getTime() + duration);

      // Check if this instance already exists
      if (!instanceExists(event, newStartDate)) {
        instances.push({
          club_id: event.club_id,
          title: event.title,
          caption: event.caption,
          poster_url: event.poster_url,
          ticket_link: event.ticket_link,
          start_date: newStartDate.toISOString(),
          end_date: newEndDate.toISOString(),
          music_genres: event.music_genres,
          created_by: event.created_by,
          recurring_config: null, // Individual instances don't have recurring config
        });
        instanceCount++;
      }
    }

    // Move to next potential date
    currentDate = getNextDate(currentDate, config);
  }

  return instances;
}

function shouldGenerateInstance(date: Date, config: RecurringConfig, originalStartDate: Date): boolean {
  if (config.frequency === 'daily') {
    return true;
  } else if (config.frequency === 'weekly') {
    return config.days_of_week?.includes(date.getDay()) || false;
  } else if (config.frequency === 'monthly') {
    return date.getDate() === originalStartDate.getDate();
  }
  return false;
}

function getNextDate(currentDate: Date, config: RecurringConfig): Date {
  const nextDate = new Date(currentDate);
  
  if (config.frequency === 'daily') {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (config.frequency === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (config.frequency === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
}

async function instanceExists(event: any, startDate: Date): Promise<boolean> {
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('club_id', event.club_id)
    .eq('title', event.title)
    .gte('start_date', new Date(startDate.getTime() - 60000).toISOString()) // 1 minute before
    .lte('start_date', new Date(startDate.getTime() + 60000).toISOString()) // 1 minute after
    .limit(1);

  return data && data.length > 0;
}