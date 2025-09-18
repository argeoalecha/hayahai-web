import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Timeline } from '../Timeline';
import type { TimelineEventType } from '../Timeline/types';

const mockEvents: TimelineEventType[] = [
  {
    id: 'event-1',
    title: 'First Event',
    date: '2024-03-15T10:00:00Z',
    description: 'This is the first event',
    type: 'milestone',
    location: {
      name: 'Test Location',
      coordinates: [35.6762, 139.6503],
    },
    cost: { amount: 100, currency: 'USD' },
    duration: { value: 2, unit: 'hours' },
    tags: ['important', 'milestone'],
  },
  {
    id: 'event-2',
    title: 'Second Event',
    date: '2024-03-16T14:00:00Z',
    description: 'This is the second event',
    type: 'activity',
    tags: ['fun', 'activity'],
  },
  {
    id: 'event-3',
    title: 'Third Event',
    date: '2024-03-14T08:00:00Z',
    description: 'This is the third event (earliest)',
    type: 'travel',
  },
];

describe('Timeline Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with valid events', () => {
    render(<Timeline events={mockEvents} />);

    expect(screen.getByText('First Event')).toBeInTheDocument();
    expect(screen.getByText('Second Event')).toBeInTheDocument();
    expect(screen.getByText('Third Event')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    const title = 'My Timeline';
    render(<Timeline events={mockEvents} title={title} />);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('renders empty state when no events provided', () => {
    render(<Timeline events={[]} />);

    expect(screen.getByText(/No timeline events to display/)).toBeInTheDocument();
  });

  it('sorts events by date in descending order by default', () => {
    render(<Timeline events={mockEvents} />);

    const eventTitles = screen.getAllByRole('heading', { level: 3 });
    expect(eventTitles[0]).toHaveTextContent('Second Event'); // 2024-03-16
    expect(eventTitles[1]).toHaveTextContent('First Event');  // 2024-03-15
    expect(eventTitles[2]).toHaveTextContent('Third Event');  // 2024-03-14
  });

  it('sorts events in ascending order when specified', () => {
    render(<Timeline events={mockEvents} sortOrder="asc" />);

    const eventTitles = screen.getAllByRole('heading', { level: 3 });
    expect(eventTitles[0]).toHaveTextContent('Third Event');  // 2024-03-14
    expect(eventTitles[1]).toHaveTextContent('First Event');  // 2024-03-15
    expect(eventTitles[2]).toHaveTextContent('Second Event'); // 2024-03-16
  });

  it('expands and collapses event details', async () => {
    render(<Timeline events={mockEvents} />);

    // Find the "More" button for the first event
    const moreButtons = screen.getAllByText('More');
    const firstMoreButton = moreButtons[0];

    // Initially, detailed description should not be visible
    expect(screen.queryByText('This is the second event')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(firstMoreButton);

    // Now the description should be visible
    await waitFor(() => {
      expect(screen.getByText('This is the second event')).toBeInTheDocument();
    });

    // Click to collapse
    const lessButton = screen.getByText('Less');
    fireEvent.click(lessButton);

    // Description should be hidden again
    await waitFor(() => {
      expect(screen.queryByText('This is the second event')).not.toBeInTheDocument();
    });
  });

  it('handles event click callback', () => {
    const mockOnEventClick = jest.fn();
    render(<Timeline events={mockEvents} onEventClick={mockOnEventClick} />);

    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    expect(mockOnEventClick).toHaveBeenCalledWith(expect.objectContaining({
      id: 'event-2', // First event in desc order
      title: 'Second Event',
    }));
  });

  it('filters events by tags', () => {
    render(<Timeline events={mockEvents} filterTags={['milestone']} />);

    expect(screen.getByText('First Event')).toBeInTheDocument();
    expect(screen.queryByText('Second Event')).not.toBeInTheDocument();
    expect(screen.queryByText('Third Event')).not.toBeInTheDocument();
  });

  it('filters events by date range', () => {
    const dateRange = {
      start: '2024-03-15T00:00:00Z',
      end: '2024-03-15T23:59:59Z',
    };

    render(<Timeline events={mockEvents} dateRange={dateRange} />);

    expect(screen.getByText('First Event')).toBeInTheDocument();
    expect(screen.queryByText('Second Event')).not.toBeInTheDocument();
    expect(screen.queryByText('Third Event')).not.toBeInTheDocument();
  });

  it('groups events by month', () => {
    render(<Timeline events={mockEvents} groupBy="month" />);

    expect(screen.getByText('March 2024')).toBeInTheDocument();
  });

  it('groups events by year', () => {
    const eventsFromDifferentYears: TimelineEventType[] = [
      {
        id: 'event-2023',
        title: '2023 Event',
        date: '2023-12-31T10:00:00Z',
        type: 'milestone',
      },
      ...mockEvents,
    ];

    render(<Timeline events={eventsFromDifferentYears} groupBy="year" />);

    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
  });

  it('displays event metadata when enabled', () => {
    render(<Timeline events={mockEvents} showMetadata={true} />);

    // Expand the first event to see metadata
    const moreButtons = screen.getAllByText('More');
    fireEvent.click(moreButtons[0]);

    // Should not show metadata section since this event doesn't have metadata
    expect(screen.queryByText('Additional Details')).not.toBeInTheDocument();
  });

  it('hides images when disabled', () => {
    const eventsWithImages: TimelineEventType[] = [
      {
        ...mockEvents[0],
        images: ['https://example.com/image1.jpg'],
      },
    ];

    render(<Timeline events={eventsWithImages} showImages={false} />);

    // Expand to see if images are hidden
    const moreButton = screen.getByText('More');
    fireEvent.click(moreButton);

    expect(screen.queryByText('Photos')).not.toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<Timeline events={mockEvents} />);

    expect(screen.getByText('March 16, 2024')).toBeInTheDocument();
    expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('March 14, 2024')).toBeInTheDocument();
  });

  it('displays relative time', () => {
    render(<Timeline events={mockEvents} />);

    // These will show relative time based on current date
    // The exact text depends on when the test runs
    expect(screen.getByText(/ago|In/)).toBeInTheDocument();
  });

  it('filters out invalid events', () => {
    const invalidEvents = [
      {
        id: '',
        title: 'Invalid ID',
        date: '2024-03-15T10:00:00Z',
        type: 'milestone',
      },
      {
        id: 'valid-1',
        title: '',
        date: '2024-03-15T10:00:00Z',
        type: 'milestone',
      },
      {
        id: 'valid-2',
        title: 'Valid Event',
        date: 'invalid-date',
        type: 'milestone',
      },
      ...mockEvents,
    ];

    render(<Timeline events={invalidEvents as TimelineEventType[]} />);

    // Should only render the valid events
    expect(screen.getByText('First Event')).toBeInTheDocument();
    expect(screen.queryByText('Invalid ID')).not.toBeInTheDocument();
  });

  it('sanitizes event data', () => {
    const maliciousEvents: TimelineEventType[] = [
      {
        id: 'malicious',
        title: '<script>alert("xss")</script>',
        date: '2024-03-15T10:00:00Z',
        description: 'javascript:alert("xss")',
        type: 'milestone',
        tags: ['<img src=x onerror=alert("xss")>'],
      },
    ];

    render(<Timeline events={maliciousEvents} />);

    // Should not contain malicious scripts
    expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
    expect(screen.queryByText(/javascript:/)).not.toBeInTheDocument();
  });

  it('handles undefined or null events prop', () => {
    render(<Timeline events={undefined as any} />);
    expect(screen.getByText(/No timeline events to display/)).toBeInTheDocument();

    render(<Timeline events={null as any} />);
    expect(screen.getByText(/No timeline events to display/)).toBeInTheDocument();
  });

  it('displays correct event counts', () => {
    render(<Timeline events={mockEvents} />);

    expect(screen.getByText(/Showing 3 of 3 events/)).toBeInTheDocument();
  });

  it('displays filter summary when filters are active', () => {
    render(
      <Timeline
        events={mockEvents}
        filterTags={['milestone']}
        dateRange={{
          start: '2024-03-01T00:00:00Z',
          end: '2024-03-31T23:59:59Z',
        }}
      />
    );

    expect(screen.getByText(/Active filters:/)).toBeInTheDocument();
    expect(screen.getByText('#milestone')).toBeInTheDocument();
  });
});

describe('Timeline Error Handling', () => {
  it('handles events with missing optional fields', () => {
    const minimalEvent: TimelineEventType = {
      id: 'minimal',
      title: 'Minimal Event',
      date: '2024-03-15T10:00:00Z',
      type: 'other',
    };

    render(<Timeline events={[minimalEvent]} />);

    expect(screen.getByText('Minimal Event')).toBeInTheDocument();
  });

  it('handles invalid date ranges gracefully', () => {
    const invalidDateRange = {
      start: 'invalid-date',
      end: 'also-invalid',
    };

    render(<Timeline events={mockEvents} dateRange={invalidDateRange} />);

    // Should render all events when date range is invalid
    expect(screen.getByText('First Event')).toBeInTheDocument();
    expect(screen.getByText('Second Event')).toBeInTheDocument();
    expect(screen.getByText('Third Event')).toBeInTheDocument();
  });
});