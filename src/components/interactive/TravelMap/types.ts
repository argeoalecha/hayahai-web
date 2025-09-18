export interface MapLocation {
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  description?: string;
  images?: string[];
  visitDate?: string;
  cost?: {
    amount: number;
    currency: string;
  };
  duration?: {
    value: number;
    unit: 'hours' | 'days' | 'weeks';
  };
  tags?: string[];
  type: 'accommodation' | 'attraction' | 'restaurant' | 'transport' | 'other';
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface TravelMapProps {
  locations: MapLocation[];
  title?: string;
  height?: string;
  className?: string;
  showControls?: boolean;
  interactive?: boolean;
  onLocationClick?: (location: MapLocation) => void;
  fallbackComponent?: React.ReactNode;
}

export interface MapState {
  isLoading: boolean;
  error: string | null;
  bounds: MapBounds | null;
  selectedLocation: MapLocation | null;
}

export interface MapError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}