'use client';

import React, { useMemo, useState } from 'react';
import { Clock, Filter, Calendar } from 'lucide-react';
import { TimelineProps, TimelineEvent as TimelineEventType, TimelineState } from './types';
import {
  validateTimelineEvent,
  sanitizeTimelineEvent,
  sortTimelineEvents,
  filterEventsByDateRange,
  filterEventsByTags,
  groupTimelineEvents,
} from './utils';
import TimelineEvent from './TimelineEvent';

/**
 * Main Timeline component with comprehensive error handling and filtering
 */
export default function Timeline({
  events = [],
  title,
  className = '',
  sortOrder = 'desc',
  showImages = true,
  showMetadata = false,
  groupBy = 'none',
  onEventClick,
  filterTags,
  dateRange,
}: TimelineProps) {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    filteredEvents: [],
    expandedEvents: new Set(),
    selectedEvent: null,
    groupedEvents: {},
  });

  // Validate and sanitize events
  const validatedEvents = useMemo(() => {
    if (!Array.isArray(events)) {
      console.warn('Timeline: events prop must be an array');
      return [];
    }

    return events
      .filter((event) => {
        if (!validateTimelineEvent(event)) {
          console.warn('Timeline: Invalid event data:', event);
          return false;
        }
        return true;
      })
      .map(sanitizeTimelineEvent);
  }, [events]);

  // Filter and sort events
  const processedEvents = useMemo(() => {
    let filtered = [...validatedEvents];

    // Apply date range filter
    if (dateRange) {
      filtered = filterEventsByDateRange(filtered, dateRange);
    }

    // Apply tag filter
    if (filterTags && filterTags.length > 0) {
      filtered = filterEventsByTags(filtered, filterTags);
    }

    // Sort events
    filtered = sortTimelineEvents(filtered, sortOrder);

    return filtered;
  }, [validatedEvents, dateRange, filterTags, sortOrder]);

  // Group events
  const groupedEvents = useMemo(() => {
    return groupTimelineEvents(processedEvents, groupBy);
  }, [processedEvents, groupBy]);

  // Update timeline state when processed events change
  React.useEffect(() => {
    setTimelineState((prev) => ({
      ...prev,
      filteredEvents: processedEvents,
      groupedEvents,
    }));
  }, [processedEvents, groupedEvents]);

  const handleToggleExpand = (eventId: string) => {
    setTimelineState((prev) => {
      const newExpanded = new Set(prev.expandedEvents);
      if (newExpanded.has(eventId)) {
        newExpanded.delete(eventId);
      } else {
        newExpanded.add(eventId);
      }
      return {
        ...prev,
        expandedEvents: newExpanded,
      };
    });
  };

  const handleEventClick = (event: TimelineEventType) => {
    setTimelineState((prev) => ({
      ...prev,
      selectedEvent: event,
    }));

    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Empty state
  if (timelineState.filteredEvents.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {validatedEvents.length === 0
              ? 'No timeline events to display'
              : 'No events match the current filters'}
          </p>
          {(filterTags?.length || dateRange) && (
            <p className="text-xs mt-1">Try adjusting your filters to see more events</p>
          )}
        </div>
      </div>
    );
  }

  // Render grouped timeline
  const renderGroupedTimeline = () => {
    const groups = Object.entries(timelineState.groupedEvents);

    if (groupBy === 'none') {
      return timelineState.filteredEvents.map((event, index) => (
        <TimelineEvent
          key={event.id}
          event={event}
          isExpanded={timelineState.expandedEvents.has(event.id)}
          showImages={showImages}
          showMetadata={showMetadata}
          onToggleExpand={handleToggleExpand}
          onClick={handleEventClick}
          className={index < timelineState.filteredEvents.length - 1 ? 'mb-8' : ''}
        />
      ));
    }

    return groups.map(([groupName, groupEvents]) => (
      <div key={groupName} className="mb-12">
        {/* Group header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-2 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            {groupName}
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {groupEvents.length} event{groupEvents.length !== 1 ? 's' : ''}
            </span>
          </h3>
        </div>

        {/* Group events */}
        <div className="space-y-8">
          {groupEvents.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              isExpanded={timelineState.expandedEvents.has(event.id)}
              showImages={showImages}
              showMetadata={showMetadata}
              onToggleExpand={handleToggleExpand}
              onClick={handleEventClick}
            />
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      {title && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-blue-600" />
            {title}
          </h2>
        </div>
      )}

      {/* Filters summary */}
      {(filterTags?.length || dateRange) && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-sm text-blue-800">
            <Filter className="h-4 w-4 mr-2" />
            <span className="font-medium mr-2">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {filterTags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700"
                >
                  #{tag}
                </span>
              ))}
              {dateRange && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                  {new Date(dateRange.start).toLocaleDateString()} -{' '}
                  {new Date(dateRange.end).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Events count */}
      <div className="mb-6 text-sm text-gray-600">
        Showing {timelineState.filteredEvents.length} of {validatedEvents.length} event
        {validatedEvents.length !== 1 ? 's' : ''}
        {sortOrder === 'desc' ? ' (newest first)' : ' (oldest first)'}
      </div>

      {/* Timeline content */}
      <div className="relative">
        {renderGroupedTimeline()}

        {/* Timeline end marker */}
        <div className="relative flex items-center justify-center pt-8">
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}