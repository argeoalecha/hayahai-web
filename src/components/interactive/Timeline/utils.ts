import { TimelineEvent } from './types';

/**
 * Validate timeline event data with comprehensive checks
 */
export function validateTimelineEvent(event: unknown): event is TimelineEvent {
  if (!event || typeof event !== 'object') {
    return false;
  }

  const evt = event as Record<string, unknown>;

  // Required fields
  if (!evt.id || typeof evt.id !== 'string') {
    return false;
  }

  if (!evt.title || typeof evt.title !== 'string') {
    return false;
  }

  if (!evt.date || typeof evt.date !== 'string') {
    return false;
  }

  // Validate date format
  const dateObj = new Date(evt.date);
  if (isNaN(dateObj.getTime())) {
    return false;
  }

  if (
    !evt.type ||
    typeof evt.type !== 'string' ||
    !['travel', 'accommodation', 'activity', 'milestone', 'other'].includes(evt.type)
  ) {
    return false;
  }

  // Optional fields validation
  if (evt.description !== undefined && typeof evt.description !== 'string') {
    return false;
  }

  if (
    evt.images !== undefined &&
    (!Array.isArray(evt.images) ||
      !evt.images.every((img) => typeof img === 'string'))
  ) {
    return false;
  }

  if (evt.location !== undefined) {
    if (!evt.location || typeof evt.location !== 'object') {
      return false;
    }
    const loc = evt.location as any;
    if (!loc.name || typeof loc.name !== 'string') {
      return false;
    }
    if (loc.coordinates !== undefined) {
      if (
        !Array.isArray(loc.coordinates) ||
        loc.coordinates.length !== 2 ||
        typeof loc.coordinates[0] !== 'number' ||
        typeof loc.coordinates[1] !== 'number'
      ) {
        return false;
      }
    }
  }

  if (evt.cost !== undefined) {
    if (
      !evt.cost ||
      typeof evt.cost !== 'object' ||
      typeof (evt.cost as any).amount !== 'number' ||
      typeof (evt.cost as any).currency !== 'string'
    ) {
      return false;
    }
  }

  if (evt.duration !== undefined) {
    if (
      !evt.duration ||
      typeof evt.duration !== 'object' ||
      typeof (evt.duration as any).value !== 'number' ||
      !['hours', 'days', 'weeks', 'months'].includes((evt.duration as any).unit)
    ) {
      return false;
    }
  }

  if (evt.tags !== undefined) {
    if (
      !Array.isArray(evt.tags) ||
      !evt.tags.every((tag) => typeof tag === 'string')
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitize timeline event data to prevent XSS
 */
export function sanitizeTimelineEvent(event: TimelineEvent): TimelineEvent {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  };

  const sanitizedEvent: TimelineEvent = {
    id: sanitizeString(event.id),
    title: sanitizeString(event.title),
    date: event.date, // Date should already be validated
    type: event.type,
  };

  if (event.description) {
    sanitizedEvent.description = sanitizeString(event.description);
  }

  if (event.images) {
    sanitizedEvent.images = event.images
      .filter((img) => typeof img === 'string' && img.trim().length > 0)
      .map((img) => sanitizeString(img));
  }

  if (event.location) {
    sanitizedEvent.location = {
      name: sanitizeString(event.location.name),
    };
    if (event.location.coordinates) {
      sanitizedEvent.location.coordinates = [
        Math.max(-90, Math.min(90, event.location.coordinates[0])),
        Math.max(-180, Math.min(180, event.location.coordinates[1])),
      ];
    }
  }

  if (event.cost) {
    sanitizedEvent.cost = {
      amount: Math.max(0, event.cost.amount),
      currency: sanitizeString(event.cost.currency),
    };
  }

  if (event.duration) {
    sanitizedEvent.duration = {
      value: Math.max(0, event.duration.value),
      unit: event.duration.unit,
    };
  }

  if (event.tags) {
    sanitizedEvent.tags = event.tags
      .filter((tag) => typeof tag === 'string' && tag.trim().length > 0)
      .map((tag) => sanitizeString(tag));
  }

  if (event.metadata) {
    sanitizedEvent.metadata = { ...event.metadata };
  }

  return sanitizedEvent;
}

/**
 * Sort timeline events by date
 */
export function sortTimelineEvents(
  events: TimelineEvent[],
  order: 'asc' | 'desc' = 'desc'
): TimelineEvent[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    if (order === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
}

/**
 * Filter timeline events by date range
 */
export function filterEventsByDateRange(
  events: TimelineEvent[],
  dateRange?: { start: string; end: string }
): TimelineEvent[] {
  if (!dateRange) {
    return events;
  }

  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.warn('Invalid date range provided for timeline filtering');
    return events;
  }

  return events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= startDate && eventDate <= endDate;
  });
}

/**
 * Filter timeline events by tags
 */
export function filterEventsByTags(
  events: TimelineEvent[],
  filterTags?: string[]
): TimelineEvent[] {
  if (!filterTags || filterTags.length === 0) {
    return events;
  }

  return events.filter((event) => {
    if (!event.tags || event.tags.length === 0) {
      return false;
    }

    return filterTags.some((filterTag) =>
      event.tags!.some((eventTag) =>
        eventTag.toLowerCase().includes(filterTag.toLowerCase())
      )
    );
  });
}

/**
 * Group timeline events by time period
 */
export function groupTimelineEvents(
  events: TimelineEvent[],
  groupBy: 'none' | 'month' | 'year'
): Record<string, TimelineEvent[]> {
  if (groupBy === 'none') {
    return { all: events };
  }

  const grouped: Record<string, TimelineEvent[]> = {};

  events.forEach((event) => {
    const eventDate = new Date(event.date);
    let key: string;

    if (groupBy === 'month') {
      key = eventDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
    } else if (groupBy === 'year') {
      key = eventDate.getFullYear().toString();
    } else {
      key = 'all';
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key]!.push(event);
  });

  return grouped;
}

/**
 * Format event date for display
 */
export function formatEventDate(
  date: string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return 'Invalid Date';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return eventDate.toLocaleDateString('en-US', options || defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format event cost for display
 */
export function formatEventCost(cost?: TimelineEvent['cost']): string {
  if (!cost || typeof cost.amount !== 'number' || !cost.currency) {
    return '';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cost.currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(cost.amount);
  } catch (error) {
    console.error('Error formatting cost:', error);
    return `${cost.amount} ${cost.currency}`;
  }
}

/**
 * Format event duration for display
 */
export function formatEventDuration(duration?: TimelineEvent['duration']): string {
  if (!duration || typeof duration.value !== 'number' || !duration.unit) {
    return '';
  }

  const value = duration.value;
  const unit = duration.unit;

  if (value <= 0) {
    return '';
  }

  const pluralUnit = value === 1 ? unit.slice(0, -1) : unit;
  return `${value} ${pluralUnit}`;
}

/**
 * Get timeline event type icon
 */
export function getEventTypeIcon(type: TimelineEvent['type']): string {
  const icons = {
    travel: '✈️',
    accommodation: '🏨',
    activity: '🎯',
    milestone: '🏆',
    other: '📍',
  };
  return icons[type] || icons.other;
}

/**
 * Get timeline event type label
 */
export function getEventTypeLabel(type: TimelineEvent['type']): string {
  const labels = {
    travel: 'Travel',
    accommodation: 'Accommodation',
    activity: 'Activity',
    milestone: 'Milestone',
    other: 'Event',
  };
  return labels[type] || labels.other;
}

/**
 * Calculate relative time from event date
 */
export function getRelativeTime(date: string): string {
  try {
    const eventDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - eventDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays === -1) {
      return 'Tomorrow';
    } else if (diffDays > 0) {
      if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years} year${years > 1 ? 's' : ''} ago`;
      }
    } else {
      const absDays = Math.abs(diffDays);
      if (absDays < 7) {
        return `In ${absDays} days`;
      } else if (absDays < 30) {
        const weeks = Math.floor(absDays / 7);
        return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
      } else {
        const months = Math.floor(absDays / 30);
        return `In ${months} month${months > 1 ? 's' : ''}`;
      }
    }
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return '';
  }
}