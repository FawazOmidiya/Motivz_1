from django.core.management.base import BaseCommand
from services.supabase_service import smart_generate_recurring_events

class Command(BaseCommand):
    help = 'Smart weekly generation of recurring events - avoids duplicates and only generates what\'s needed'

    def add_arguments(self, parser):
        parser.add_argument(
            '--weeks',
            type=int,
            default=4,
            help='Number of weeks ahead to generate events (default: 4)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be generated without actually creating events'
        )

    def handle(self, *args, **options):
        weeks_ahead = options['weeks']
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('🔍 DRY RUN MODE - No events will be created')
            )
        
        try:
            self.stdout.write(
                self.style.SUCCESS(f'🚀 Starting smart recurring event generation for next {weeks_ahead} weeks...')
            )
            
            events = smart_generate_recurring_events(weeks_ahead)
            
            if events:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Successfully generated {len(events)} recurring events')
                )
                
                # Show summary of generated events
                for i, event in enumerate(events[:5]):  # Show first 5
                    start_date = event['start_date']
                    if isinstance(start_date, str):
                        from datetime import datetime
                        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    self.stdout.write(f"   📅 {event['title']} on {start_date.strftime('%Y-%m-%d %H:%M')}")
                
                if len(events) > 5:
                    self.stdout.write(f"   ... and {len(events) - 5} more events")
            else:
                self.stdout.write(
                    self.style.WARNING('ℹ️  No new events needed to be generated')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error during smart generation: {e}')
            )
            raise e
        
        self.stdout.write(
            self.style.SUCCESS('🎉 Smart recurring event generation completed!')
        ) 