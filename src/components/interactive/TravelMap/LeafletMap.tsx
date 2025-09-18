'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapLocation, MapBounds } from './types';
import { getMarkerIconUrl } from './utils';

// Leaflet types (will be available when package is installed)
type LeafletMap = any;
type LeafletMarker = any;
type LeafletIcon = any;

interface LeafletMapProps {
  locations: MapLocation[];
  bounds: MapBounds | null;
  height: string;
  showControls: boolean;
  interactive: boolean;
  onLocationClick: (location: MapLocation) => void;
  onError: (error: Error) => void;
}

/**
 * Leaflet map implementation with comprehensive error handling
 * This component is dynamically loaded to prevent SSR issues
 */
export default function LeafletMap({
  locations,
  bounds,
  height,
  showControls,
  interactive,
  onLocationClick,
  onError,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!mapRef.current || mapInstanceRef.current) {
          return;
        }

        // Dynamic import of Leaflet to prevent SSR issues
        const L = await import('leaflet');

        // Fix for default marker icons in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        });

        // Create map instance
        const map = L.map(mapRef.current, {
          zoomControl: showControls,
          attributionControl: showControls,
          dragging: interactive,
          touchZoom: interactive,
          scrollWheelZoom: interactive,
          doubleClickZoom: interactive,
          boxZoom: interactive,
          keyboard: interactive,
        });

        // Add tile layer with error handling
        const tileLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            errorTileUrl: '/images/map-tile-error.png', // Fallback tile
          }
        );

        tileLayer.on('tileerror', (e: any) => {
          console.warn('Map tile loading error:', e);
          // Optionally switch to alternative tile source
        });

        tileLayer.addTo(map);

        // Set initial view
        if (bounds && locations.length > 0) {
          const leafletBounds = L.latLngBounds(
            [bounds.south, bounds.west],
            [bounds.north, bounds.east]
          );
          map.fitBounds(leafletBounds, { padding: [20, 20] });
        } else {
          // Default view (world map)
          map.setView([20, 0], 2);
        }

        mapInstanceRef.current = map;
        setIsMapReady(true);
        setMapError(null);

        // Error handling for map events
        map.on('error', (e: any) => {
          console.error('Leaflet map error:', e);
          setMapError('Map rendering error occurred');
          onError(new Error('Map rendering error'));
        });

      } catch (error) {
        console.error('Failed to initialize map:', error);
        setMapError('Failed to load map');
        onError(error as Error);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapReady(false);
      }
    };
  }, [showControls, interactive, onError]);

  // Update markers when locations change
  useEffect(() => {
    const updateMarkers = async () => {
      if (!isMapReady || !mapInstanceRef.current) {
        return;
      }

      try {
        const L = await import('leaflet');

        // Clear existing markers
        markersRef.current.forEach((marker) => {
          mapInstanceRef.current?.removeLayer(marker);
        });
        markersRef.current = [];

        // Add new markers
        locations.forEach((location) => {
          try {
            const [lat, lng] = location.coordinates;

            // Validate coordinates
            if (
              typeof lat !== 'number' ||
              typeof lng !== 'number' ||
              isNaN(lat) ||
              isNaN(lng) ||
              lat < -90 ||
              lat > 90 ||
              lng < -180 ||
              lng > 180
            ) {
              console.warn(`Invalid coordinates for location ${location.id}:`, location.coordinates);
              return;
            }

            // Create custom icon
            const iconUrl = getMarkerIconUrl(location.type);
            const customIcon = L.icon({
              iconUrl: iconUrl,
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowUrl: '/leaflet/marker-shadow.png',
              shadowSize: [41, 41],
            });

            // Create marker
            const marker = L.marker([lat, lng], { icon: customIcon });

            // Add popup content
            const popupContent = `
              <div class="p-2 max-w-xs">
                <h3 class="font-semibold text-sm mb-1">${L.Util.htmlEscape(location.name)}</h3>
                ${location.description ? `<p class="text-xs text-gray-600 mb-2">${L.Util.htmlEscape(location.description)}</p>` : ''}
                <button
                  onclick="window.handleLocationClick('${location.id}')"
                  class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  View Details
                </button>
              </div>
            `;

            marker.bindPopup(popupContent, {
              maxWidth: 250,
              className: 'travel-map-popup',
            });

            // Handle marker click
            marker.on('click', () => {
              onLocationClick(location);
            });

            // Add marker to map
            marker.addTo(mapInstanceRef.current);
            markersRef.current.push(marker);

          } catch (markerError) {
            console.error(`Error creating marker for location ${location.id}:`, markerError);
          }
        });

        // Update map bounds if needed
        if (bounds && locations.length > 0) {
          const leafletBounds = L.latLngBounds(
            [bounds.south, bounds.west],
            [bounds.north, bounds.east]
          );
          mapInstanceRef.current.fitBounds(leafletBounds, { padding: [20, 20] });
        }

      } catch (error) {
        console.error('Error updating markers:', error);
        setMapError('Failed to update map markers');
        onError(error as Error);
      }
    };

    updateMarkers();
  }, [locations, bounds, isMapReady, onLocationClick, onError]);

  // Global click handler for popup buttons
  useEffect(() => {
    const handleGlobalLocationClick = (locationId: string) => {
      const location = locations.find((loc) => loc.id === locationId);
      if (location) {
        onLocationClick(location);
      }
    };

    // Make handler available globally for popup buttons
    (window as any).handleLocationClick = handleGlobalLocationClick;

    return () => {
      delete (window as any).handleLocationClick;
    };
  }, [locations, onLocationClick]);

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-center text-gray-500">
          <p className="text-sm mb-2">Map failed to load</p>
          <p className="text-xs">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-200 bg-gray-50"
      />

      {/* Loading overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-600">Initializing map...</p>
          </div>
        </div>
      )}
    </>
  );
}