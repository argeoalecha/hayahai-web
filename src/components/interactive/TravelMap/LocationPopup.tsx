'use client';

import React from 'react';
import { X, ExternalLink, Calendar, DollarSign, Clock, Tag } from 'lucide-react';
import { MapLocation } from './types';
import { formatCost, formatDuration } from './utils';

interface LocationPopupProps {
  location: MapLocation;
  onClose: () => void;
  onOpenInMaps?: () => void;
  className?: string;
}

/**
 * Detailed popup component for location information
 * Includes comprehensive error handling and accessibility features
 */
export default function LocationPopup({
  location,
  onClose,
  onOpenInMaps,
  className = '',
}: LocationPopupProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const openInMaps = () => {
    if (onOpenInMaps) {
      onOpenInMaps();
    } else {
      const [lat, lng] = location.coordinates;
      const query = encodeURIComponent(location.name);
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${query}`;

      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
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

  // Focus management for accessibility
  React.useEffect(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 ${className}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-popup-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <span className="text-xl mr-2" role="img" aria-label={getLocationTypeLabel(location.type)}>
              {getLocationTypeIcon(location.type)}
            </span>
            <h2 id="location-popup-title" className="text-lg font-semibold text-gray-900 truncate">
              {location.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close popup"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Type and basic info */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {getLocationTypeLabel(location.type)}
            </span>
            <button
              onClick={openInMaps}
              className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open in Maps
            </button>
          </div>

          {/* Coordinates */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Coordinates:</span>{' '}
            {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}
          </div>

          {/* Description */}
          {location.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Description</h3>
              <p className="text-sm text-gray-600">{location.description}</p>
            </div>
          )}

          {/* Visit date */}
          {location.visitDate && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-medium mr-1">Visited:</span>
              {new Date(location.visitDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}

          {/* Cost */}
          {location.cost && (
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-medium mr-1">Cost:</span>
              {formatCost(location.cost)}
            </div>
          )}

          {/* Duration */}
          {location.duration && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-medium mr-1">Duration:</span>
              {formatDuration(location.duration)}
            </div>
          )}

          {/* Tags */}
          {location.tags && location.tags.length > 0 && (
            <div>
              <div className="flex items-center text-sm font-medium text-gray-900 mb-2">
                <Tag className="h-4 w-4 mr-2 text-gray-400" />
                Tags
              </div>
              <div className="flex flex-wrap gap-1">
                {location.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {location.images && location.images.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Photos</h3>
              <div className="grid grid-cols-2 gap-2">
                {location.images.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`${location.name} - Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded border border-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show a placeholder
                        const placeholder = document.createElement('div');
                        placeholder.className = 'w-full h-full bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500';
                        placeholder.textContent = 'Image not available';
                        target.parentNode?.replaceChild(placeholder, target);
                      }}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}