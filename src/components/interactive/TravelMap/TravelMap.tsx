'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, AlertTriangle } from 'lucide-react';
import { TravelMapProps, MapState, MapLocation } from './types';
import { calculateMapBounds, validateLocation, sanitizeLocation } from './utils';
import MapErrorBoundary from './MapErrorBoundary';
import MapFallback from './MapFallback';
import LocationPopup from './LocationPopup';

// Dynamic import to prevent SSR issues with Leaflet
const DynamicMapComponent = dynamic(
  () => import('./LeafletMap').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading interactive map...</p>
        </div>
      </div>
    ),
  }
);

/**
 * Main TravelMap component with comprehensive error handling and fallbacks
 * Supports both interactive map view and accessible fallback list view
 */
export default function TravelMap({
  locations = [],
  title,
  height = '400px',
  className = '',
  showControls = true,
  interactive = true,
  onLocationClick,
  fallbackComponent,
}: TravelMapProps) {
  const [mapState, setMapState] = useState<MapState>({
    isLoading: true,
    error: null,
    bounds: null,
    selectedLocation: null,
  });

  const [useMapFallback, setUseMapFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Validate and sanitize locations
  const validatedLocations = useMemo(() => {
    if (!Array.isArray(locations)) {
      console.warn('TravelMap: locations prop must be an array');
      return [];
    }

    return locations
      .filter((location) => {
        if (!validateLocation(location)) {
          console.warn('TravelMap: Invalid location data:', location);
          return false;
        }
        return true;
      })
      .map(sanitizeLocation);
  }, [locations]);

  // Calculate map bounds
  const mapBounds = useMemo(() => {
    return calculateMapBounds(validatedLocations);
  }, [validatedLocations]);

  // Update map state when locations change
  useEffect(() => {
    setMapState((prev) => ({
      ...prev,
      bounds: mapBounds,
      isLoading: false,
    }));
  }, [mapBounds]);

  // Check if map libraries are available
  useEffect(() => {
    const checkMapSupport = () => {
      try {
        // Check if running in browser
        if (typeof window === 'undefined') {
          return;
        }

        // Check for WebGL support (required for some map features)
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) {
          console.warn('TravelMap: WebGL not supported, using fallback');
          setUseMapFallback(true);
          return;
        }

        // Check for essential APIs
        if (!window.fetch || !window.Promise) {
          console.warn('TravelMap: Essential APIs not available, using fallback');
          setUseMapFallback(true);
          return;
        }

        setMapState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        console.error('TravelMap: Error checking map support:', error);
        setUseMapFallback(true);
      }
    };

    checkMapSupport();
  }, []);

  const handleMapError = (error: Error) => {
    console.error('TravelMap: Map component error:', error);

    setMapState((prev) => ({
      ...prev,
      error: error.message,
      isLoading: false,
    }));

    // Auto-retry with exponential backoff
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setMapState((prev) => ({
          ...prev,
          error: null,
          isLoading: true,
        }));
      }, delay);
    } else {
      // Use fallback after max retries
      setUseMapFallback(true);
    }
  };

  const handleLocationSelect = (location: MapLocation) => {
    setMapState((prev) => ({
      ...prev,
      selectedLocation: location,
    }));

    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  const handleClosePopup = () => {
    setMapState((prev) => ({
      ...prev,
      selectedLocation: null,
    }));
  };

  const handleRetry = () => {
    setUseMapFallback(false);
    setRetryCount(0);
    setMapState({
      isLoading: true,
      error: null,
      bounds: mapBounds,
      selectedLocation: null,
    });
  };

  // Show custom fallback if provided
  if (useMapFallback && fallbackComponent) {
    return (
      <div className={className}>
        {fallbackComponent}
      </div>
    );
  }

  // Show map fallback for accessibility or when map fails
  if (useMapFallback || mapState.error) {
    return (
      <div className={className}>
        <MapFallback
          locations={validatedLocations}
          title={title}
          onLocationClick={handleLocationSelect}
        />

        {mapState.error && retryCount < maxRetries && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  Interactive map temporarily unavailable.
                  <button
                    onClick={handleRetry}
                    className="ml-1 underline hover:no-underline"
                  >
                    Try again
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {mapState.selectedLocation && (
          <LocationPopup
            location={mapState.selectedLocation}
            onClose={handleClosePopup}
          />
        )}
      </div>
    );
  }

  // No locations to display
  if (validatedLocations.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No locations to display on map</p>
        </div>
      </div>
    );
  }

  // Render interactive map
  return (
    <div className={className}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            {title}
          </h3>
        </div>
      )}

      <MapErrorBoundary
        onError={handleMapError}
        fallback={
          <MapFallback
            locations={validatedLocations}
            title={title}
            onLocationClick={handleLocationSelect}
          />
        }
      >
        <div style={{ height }} className="relative">
          <DynamicMapComponent
            locations={validatedLocations}
            bounds={mapBounds}
            height={height}
            showControls={showControls}
            interactive={interactive}
            onLocationClick={handleLocationSelect}
            onError={handleMapError}
          />
        </div>
      </MapErrorBoundary>

      {mapState.selectedLocation && (
        <LocationPopup
          location={mapState.selectedLocation}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
}