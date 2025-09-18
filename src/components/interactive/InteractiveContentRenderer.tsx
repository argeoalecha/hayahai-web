'use client';

import React from 'react';
import { TravelMap, Timeline, CodeSandbox } from './';
import type {
  MapLocation,
  TimelineEventType,
  CodeSnippet,
} from './';

interface InteractiveContent {
  id: string;
  type: 'travel_map' | 'timeline' | 'code_snippet';
  title?: string;
  data: any;
  metadata?: Record<string, unknown>;
}

interface InteractiveContentRendererProps {
  content: InteractiveContent[];
  className?: string;
  showControls?: boolean;
  allowEditing?: boolean;
  onError?: (error: Error, contentId: string) => void;
}

/**
 * Main renderer for all interactive content types in blog posts
 * Provides unified error handling and loading states
 */
export default function InteractiveContentRenderer({
  content,
  className = '',
  showControls = true,
  allowEditing = false,
  onError,
}: InteractiveContentRendererProps) {
  const handleError = (error: Error, contentId: string) => {
    console.error(`Interactive content error (${contentId}):`, error);
    if (onError) {
      onError(error, contentId);
    }
  };

  const renderContent = (item: InteractiveContent) => {
    try {
      switch (item.type) {
        case 'travel_map':
          return renderTravelMap(item);
        case 'timeline':
          return renderTimeline(item);
        case 'code_snippet':
          return renderCodeSnippet(item);
        default:
          return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Unknown interactive content type: {(item as any).type}
              </p>
            </div>
          );
      }
    } catch (error) {
      handleError(error as Error, item.id);
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to render interactive content. Please try refreshing the page.
          </p>
        </div>
      );
    }
  };

  const renderTravelMap = (item: InteractiveContent) => {
    const { locations, ...mapProps } = item.data;

    // Validate locations data
    if (!Array.isArray(locations)) {
      throw new Error('Travel map data must include a locations array');
    }

    const validatedLocations: MapLocation[] = locations.filter((location) => {
      return (
        location &&
        typeof location === 'object' &&
        location.id &&
        location.name &&
        Array.isArray(location.coordinates) &&
        location.coordinates.length === 2 &&
        typeof location.coordinates[0] === 'number' &&
        typeof location.coordinates[1] === 'number' &&
        location.type
      );
    });

    if (validatedLocations.length === 0) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">No valid locations found for travel map.</p>
        </div>
      );
    }

    return (
      <TravelMap
        locations={validatedLocations}
        title={item.title}
        showControls={showControls}
        className="mb-6"
        {...mapProps}
      />
    );
  };

  const renderTimeline = (item: InteractiveContent) => {
    const { events, ...timelineProps } = item.data;

    // Validate events data
    if (!Array.isArray(events)) {
      throw new Error('Timeline data must include an events array');
    }

    const validatedEvents: TimelineEventType[] = events.filter((event) => {
      return (
        event &&
        typeof event === 'object' &&
        event.id &&
        event.title &&
        event.date &&
        event.type
      );
    });

    if (validatedEvents.length === 0) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">No valid events found for timeline.</p>
        </div>
      );
    }

    return (
      <Timeline
        events={validatedEvents}
        title={item.title}
        className="mb-6"
        {...timelineProps}
      />
    );
  };

  const renderCodeSnippet = (item: InteractiveContent) => {
    const snippetData = item.data;

    // Validate snippet data
    if (
      !snippetData ||
      typeof snippetData !== 'object' ||
      !snippetData.code ||
      !snippetData.language
    ) {
      throw new Error('Code snippet data must include code and language properties');
    }

    const snippet: CodeSnippet = {
      id: item.id,
      title: item.title || 'Code Snippet',
      code: snippetData.code,
      language: snippetData.language,
      description: snippetData.description,
      tags: snippetData.tags,
      author: snippetData.author,
      createdAt: snippetData.createdAt || new Date().toISOString(),
      updatedAt: snippetData.updatedAt,
      isPublic: snippetData.isPublic,
      metadata: snippetData.metadata,
    };

    return (
      <CodeSandbox
        snippet={snippet}
        showExecuteButton={snippetData.allowExecution === true}
        allowEditing={allowEditing}
        className="mb-6"
        {...snippetData.props}
      />
    );
  };

  if (!content || content.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {content.map((item) => (
        <div key={item.id} className="interactive-content-item">
          {renderContent(item)}
        </div>
      ))}
    </div>
  );
}