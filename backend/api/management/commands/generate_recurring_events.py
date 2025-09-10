from django.core.management.base import BaseCommand
from services.supabase_service import generate_recurring_events

class Command(BaseCommand):
    help = 'Generate recurring events for the next few weeks'

    def add_arguments(self, parser):
        parser.add_argument(
            '--weeks',
            type=int,
            default=4,
            help='Number of weeks ahead to generate events'
        )

    def handle(self, *args, **options):
        weeks_ahead = options['weeks']
        
        try:
            events = generate_recurring_events(weeks_ahead)
            self.stdout.write(
                self.style.SUCCESS(f'Successfully generated {len(events)} recurring events')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error generating recurring events: {e}')
            ) 