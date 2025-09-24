"""
Shared types for recurring events functionality in the backend
Maintains consistency with TypeScript types in shared-types/
"""

from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from datetime import datetime


@dataclass
class RecurringConfig:
    """Configuration for recurring events"""
    active: bool
    frequency: str  # 'daily', 'weekly', 'monthly'
    days_of_week: Optional[List[int]] = None  # 0 = Sunday, 1 = Monday, etc.
    end_date: Optional[str] = None  # ISO string when to stop generating
    max_occurrences: Optional[int] = None  # Maximum number of occurrences
    timezone: Optional[str] = None  # Timezone for the recurring events


@dataclass
class RecurringEventTemplate:
    """Base event template for recurring events"""
    id: str
    club_id: str
    title: str
    caption: Optional[str] = None
    poster_url: Optional[str] = None
    ticket_link: Optional[str] = None
    start_date: str
    end_date: str
    music_genres: Optional[List[str]] = None
    created_by: str
    created_at: str
    inserted_at: str
    updated_at: str
    recurring_config: RecurringConfig


@dataclass
class GeneratedEventInstance:
    """Individual event instance generated from template"""
    club_id: str
    title: str
    caption: Optional[str] = None
    poster_url: Optional[str] = None
    ticket_link: Optional[str] = None
    start_date: str
    end_date: str
    music_genres: Optional[List[str]] = None
    created_by: str
    # Note: Individual instances don't have recurring_config


@dataclass
class RecurringEventGenerationOptions:
    """Options for generating recurring events"""
    weeks_ahead: int = 4
    dry_run: bool = False
    club_id: Optional[str] = None
    template_id: Optional[str] = None


@dataclass
class RecurringEventGenerationResult:
    """Result of recurring event generation"""
    message: str
    count: int
    generated_events: List[GeneratedEventInstance]
    warnings: Optional[List[str]] = None


def dict_to_recurring_config(data: Dict) -> RecurringConfig:
    """Convert dictionary to RecurringConfig object"""
    return RecurringConfig(
        active=data.get('active', True),
        frequency=data.get('frequency', 'weekly'),
        days_of_week=data.get('days_of_week'),
        end_date=data.get('end_date'),
        max_occurrences=data.get('max_occurrences'),
        timezone=data.get('timezone')
    )


def recurring_config_to_dict(config: RecurringConfig) -> Dict:
    """Convert RecurringConfig object to dictionary"""
    return {
        'active': config.active,
        'frequency': config.frequency,
        'days_of_week': config.days_of_week,
        'end_date': config.end_date,
        'max_occurrences': config.max_occurrences,
        'timezone': config.timezone
    }