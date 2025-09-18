export interface TimelineEvent {
  id: string;
  title: string;
  date: string; // ISO 8601 date string
  description?: string;
  images?: string[];
  location?: {
    name: string;
    coordinates?: [number, number];
  };
  cost?: {
    amount: number;
    currency: string;
  };
  duration?: {
    value: number;
    unit: 'hours' | 'days' | 'weeks' | 'months';
  };
  tags?: string[];
  type: 'travel' | 'accommodation' | 'activity' | 'milestone' | 'other';
  metadata?: Record<string, unknown>;
}

export interface TimelineProps {
  events: TimelineEvent[];
  title?: string;
  className?: string;
  sortOrder?: 'asc' | 'desc';
  showImages?: boolean;
  showMetadata?: boolean;
  groupBy?: 'none' | 'month' | 'year';
  onEventClick?: (event: TimelineEvent) => void;
  filterTags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TimelineState {
  filteredEvents: TimelineEvent[];
  expandedEvents: Set<string>;
  selectedEvent: TimelineEvent | null;
  groupedEvents: Record<string, TimelineEvent[]>;
}

export interface TimelineError {
  code: string;
  message: string;
  eventId?: string;
  timestamp: string;
}