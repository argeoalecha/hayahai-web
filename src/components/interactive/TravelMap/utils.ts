import { MapLocation, MapBounds } from './types';

/**
 * Calculate bounds for a set of locations with error handling
 */
export function calculateMapBounds(locations: MapLocation[]): MapBounds | null {
  if (!locations || locations.length === 0) {
    return null;
  }

  try {
    const validLocations = locations.filter(
      (location) =>
        location.coordinates &&
        Array.isArray(location.coordinates) &&
        location.coordinates.length === 2 &&
        typeof location.coordinates[0] === 'number' &&
        typeof location.coordinates[1] === 'number' &&
        !isNaN(location.coordinates[0]) &&
        !isNaN(location.coordinates[1]) &&
        location.coordinates[0] >= -90 &&
        location.coordinates[0] <= 90 &&
        location.coordinates[1] >= -180 &&
        location.coordinates[1] <= 180
    );

    if (validLocations.length === 0) {
      return null;
    }

    const latitudes = validLocations.map((loc) => loc.coordinates[0]);
    const longitudes = validLocations.map((loc) => loc.coordinates[1]);

    return {
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes),
    };
  } catch (error) {
    console.error('Error calculating map bounds:', error);
    return null;
  }
}

/**
 * Validate location data with comprehensive checks
 */
export function validateLocation(location: unknown): location is MapLocation {
  if (!location || typeof location !== 'object') {
    return false;
  }

  const loc = location as Record<string, unknown>;

  // Required fields
  if (!loc.id || typeof loc.id !== 'string') {
    return false;
  }

  if (!loc.name || typeof loc.name !== 'string') {
    return false;
  }

  if (
    !loc.coordinates ||
    !Array.isArray(loc.coordinates) ||
    loc.coordinates.length !== 2 ||
    typeof loc.coordinates[0] !== 'number' ||
    typeof loc.coordinates[1] !== 'number' ||
    isNaN(loc.coordinates[0]) ||
    isNaN(loc.coordinates[1]) ||
    loc.coordinates[0] < -90 ||
    loc.coordinates[0] > 90 ||
    loc.coordinates[1] < -180 ||
    loc.coordinates[1] > 180
  ) {
    return false;
  }

  if (
    !loc.type ||
    typeof loc.type !== 'string' ||
    !['accommodation', 'attraction', 'restaurant', 'transport', 'other'].includes(
      loc.type
    )
  ) {
    return false;
  }

  // Optional fields validation
  if (loc.description !== undefined && typeof loc.description !== 'string') {
    return false;
  }

  if (
    loc.images !== undefined &&
    (!Array.isArray(loc.images) ||
      !loc.images.every((img) => typeof img === 'string'))
  ) {
    return false;
  }

  if (loc.visitDate !== undefined && typeof loc.visitDate !== 'string') {
    return false;
  }

  if (loc.tags !== undefined) {
    if (
      !Array.isArray(loc.tags) ||
      !loc.tags.every((tag) => typeof tag === 'string')
    ) {
      return false;
    }
  }

  if (loc.cost !== undefined) {
    if (
      !loc.cost ||
      typeof loc.cost !== 'object' ||
      typeof (loc.cost as any).amount !== 'number' ||
      typeof (loc.cost as any).currency !== 'string'
    ) {
      return false;
    }
  }

  if (loc.duration !== undefined) {
    if (
      !loc.duration ||
      typeof loc.duration !== 'object' ||
      typeof (loc.duration as any).value !== 'number' ||
      !['hours', 'days', 'weeks'].includes((loc.duration as any).unit)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Generate a unique marker icon based on location type
 */
export function getMarkerIconUrl(type: MapLocation['type']): string {
  const iconMap = {
    accommodation: '/icons/hotel.svg',
    attraction: '/icons/camera.svg',
    restaurant: '/icons/utensils.svg',
    transport: '/icons/plane.svg',
    other: '/icons/map-pin.svg',
  };

  return iconMap[type] || iconMap.other;
}

/**
 * Format location cost for display
 */
export function formatCost(cost?: MapLocation['cost']): string {
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
 * Format duration for display
 */
export function formatDuration(duration?: MapLocation['duration']): string {
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
 * Sanitize location data to prevent XSS
 */
export function sanitizeLocation(location: MapLocation): MapLocation {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  };

  const sanitizedLocation: MapLocation = {
    id: sanitizeString(location.id),
    name: sanitizeString(location.name),
    coordinates: [
      Math.max(-90, Math.min(90, location.coordinates[0])),
      Math.max(-180, Math.min(180, location.coordinates[1])),
    ],
    type: location.type,
  };

  if (location.description) {
    sanitizedLocation.description = sanitizeString(location.description);
  }

  if (location.images) {
    sanitizedLocation.images = location.images
      .filter((img) => typeof img === 'string' && img.trim().length > 0)
      .map((img) => sanitizeString(img));
  }

  if (location.visitDate) {
    sanitizedLocation.visitDate = sanitizeString(location.visitDate);
  }

  if (location.cost) {
    sanitizedLocation.cost = {
      amount: Math.max(0, location.cost.amount),
      currency: sanitizeString(location.cost.currency),
    };
  }

  if (location.duration) {
    sanitizedLocation.duration = {
      value: Math.max(0, location.duration.value),
      unit: location.duration.unit,
    };
  }

  if (location.tags) {
    sanitizedLocation.tags = location.tags
      .filter((tag) => typeof tag === 'string' && tag.trim().length > 0)
      .map((tag) => sanitizeString(tag));
  }

  return sanitizedLocation;
}