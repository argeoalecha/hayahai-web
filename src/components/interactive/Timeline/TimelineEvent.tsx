'use client';

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { TimelineEvent as TimelineEventType } from './types';
import {
  formatEventDate,
  formatEventCost,
  formatEventDuration,
  getEventTypeIcon,
  getEventTypeLabel,
  getRelativeTime,
} from './utils';

interface TimelineEventProps {
  event: TimelineEventType;
  isExpanded: boolean;
  showImages: boolean;
  showMetadata: boolean;
  onToggleExpand: (eventId: string) => void;
  onClick: (event: TimelineEventType) => void;
  className?: string;
}

/**
 * Individual timeline event component with collapsible details
 */
export default function TimelineEvent({
  event,
  isExpanded,
  showImages,
  showMetadata,
  onToggleExpand,
  onClick,
  className = '',
}: TimelineEventProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (imageUrl: string) => {
    setImageErrors((prev) => new Set(prev).add(imageUrl));
  };

  const handleLocationClick = () => {
    if (event.location?.coordinates) {
      const [lat, lng] = event.location.coordinates;
      const query = encodeURIComponent(event.location.name);
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const hasDetails = event.description ||
    (event.images && event.images.length > 0) ||
    (event.tags && event.tags.length > 0) ||
    event.cost ||
    event.duration ||
    event.location ||
    (showMetadata && event.metadata);

  return (
    <div className={`relative ${className}`}>
      {/* Timeline connector line */}
      <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200"></div>

      {/* Timeline dot */}
      <div className="relative flex items-start">
        <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-lg">
          <span role="img" aria-label={getEventTypeLabel(event.type)}>
            {getEventTypeIcon(event.type)}
          </span>
        </div>

        {/* Event content */}
        <div className="flex-1 ml-4 min-w-0">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            {/* Event header - always visible */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {event.title}
                    </h3>
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium mr-2">{formatEventDate(event.date)}</span>
                    <span className="text-gray-500">({getRelativeTime(event.date)})</span>
                  </div>

                  {event.location && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <button
                        onClick={handleLocationClick}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {event.location.name}
                        {event.location.coordinates && (
                          <ExternalLink className="h-3 w-3 ml-1 inline" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {event.cost && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                        {formatEventCost(event.cost)}
                      </div>
                    )}
                    {event.duration && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatEventDuration(event.duration)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => onClick(event)}
                    className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    View Details
                  </button>
                  {hasDetails && (
                    <button
                      onClick={() => onToggleExpand(event.id)}
                      className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          More
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Expandable details */}
            {hasDetails && isExpanded && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                {/* Description */}
                {event.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center text-sm font-medium text-gray-900 mb-2">
                      <Tag className="h-4 w-4 mr-2 text-gray-400" />
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                {showImages && event.images && event.images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Photos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {event.images
                        .filter((image) => !imageErrors.has(image))
                        .map((image, index) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={image}
                              alt={`${event.title} - Photo ${index + 1}`}
                              className="w-full h-full object-cover rounded border border-gray-200"
                              onError={() => handleImageError(image)}
                              loading="lazy"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {showMetadata && event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Details</h4>
                    <div className="space-y-1">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key} className="flex text-sm">
                          <span className="font-medium text-gray-700 capitalize mr-2">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-gray-600">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}