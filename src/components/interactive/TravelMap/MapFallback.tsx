'use client';

import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { MapLocation } from './types';
import { formatCost, formatDuration } from './utils';

interface MapFallbackProps {
  locations: MapLocation[];
  title?: string | undefined;
  className?: string;
  onLocationClick?: (location: MapLocation) => void;
}

/**
 * Fallback component when the interactive map cannot load
 * Provides accessible list view of locations with full functionality
 */
export default function MapFallback({
  locations,
  title,
  className = '',
  onLocationClick,
}: MapFallbackProps) {
  const handleLocationClick = (location: MapLocation) => {
    onLocationClick?.(location);
  };

  const openInMaps = (location: MapLocation) => {
    const [lat, lng] = location.coordinates;
    const query = encodeURIComponent(location.name);
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${query}`;

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getLocationTypeIcon = (type: MapLocation['type']) => {
    const icons = {
      accommodation: '🏨',
      attraction: '📸',
      restaurant: '🍽️',
      transport: '✈️',
      other: '📍',
    };
    return icons[type] || icons.other;
  };

  const getLocationTypeLabel = (type: MapLocation['type']) => {
    const labels = {
      accommodation: 'Accommodation',
      attraction: 'Attraction',
      restaurant: 'Restaurant',
      transport: 'Transport',
      other: 'Location',
    };
    return labels[type] || labels.other;
  };

  if (!locations || locations.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No locations to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            {title}
          </h3>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {locations.map((location) => (
          <div
            key={location.id}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2" role="img" aria-label={getLocationTypeLabel(location.type)}>
                    {getLocationTypeIcon(location.type)}
                  </span>
                  <h4 className="text-md font-semibold text-gray-900 truncate">
                    {location.name}
                  </h4>
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getLocationTypeLabel(location.type)}
                  </span>
                </div>

                {location.description && (
                  <p className="text-sm text-gray-600 mb-2">{location.description}</p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                  <span>
                    📍 {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}
                  </span>
                  {location.visitDate && (
                    <span>📅 {new Date(location.visitDate).toLocaleDateString()}</span>
                  )}
                  {location.cost && <span>💰 {formatCost(location.cost)}</span>}
                  {location.duration && <span>⏱️ {formatDuration(location.duration)}</span>}
                </div>

                {location.tags && location.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {location.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {location.images && location.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {location.images.slice(0, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${location.name} - Image ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ))}
                    {location.images.length > 3 && (
                      <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                        +{location.images.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => handleLocationClick(location)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => openInMaps(location)}
                  className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open in Maps
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Interactive map temporarily unavailable. Showing {locations.length} location{locations.length !== 1 ? 's' : ''} in list format.
        </p>
      </div>
    </div>
  );
}