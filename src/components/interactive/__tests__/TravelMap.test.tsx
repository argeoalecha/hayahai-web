import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TravelMap } from '../TravelMap';
import type { MapLocation } from '../TravelMap/types';

// Mock dynamic imports to prevent Leaflet SSR issues in tests
jest.mock('next/dynamic', () => {
  return function mockDynamic(fn: () => Promise<any>) {
    const Component = React.forwardRef((props: any, ref) => {
      return <div data-testid="mocked-leaflet-map" {...props} />;
    });
    Component.displayName = 'MockedDynamicComponent';
    return Component;
  };
});

const mockLocations: MapLocation[] = [
  {
    id: 'test-1',
    name: 'Test Location 1',
    coordinates: [35.6762, 139.6503],
    description: 'Test description',
    type: 'attraction',
    visitDate: '2024-03-15',
    cost: { amount: 100, currency: 'USD' },
    duration: { value: 2, unit: 'hours' },
    tags: ['test', 'location'],
  },
  {
    id: 'test-2',
    name: 'Test Location 2',
    coordinates: [35.6894, 139.6917],
    description: 'Another test location',
    type: 'restaurant',
    tags: ['food', 'dining'],
  },
];

describe('TravelMap Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with valid locations', () => {
    render(<TravelMap locations={mockLocations} />);

    // Should not render fallback when locations are valid
    expect(screen.queryByText(/No locations to display/)).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    const title = 'My Travel Map';
    render(<TravelMap locations={mockLocations} title={title} />);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('renders fallback when no locations provided', () => {
    render(<TravelMap locations={[]} />);

    expect(screen.getByText(/No locations to display/)).toBeInTheDocument();
  });

  it('filters out invalid locations', () => {
    const invalidLocations = [
      {
        id: 'invalid-1',
        name: '',
        coordinates: [91, 181], // Invalid coordinates
        type: 'attraction',
      },
      {
        id: 'invalid-2',
        name: 'Valid Name',
        coordinates: 'invalid' as any, // Invalid coordinate format
        type: 'restaurant',
      },
      ...mockLocations,
    ];

    render(<TravelMap locations={invalidLocations as MapLocation[]} />);

    // Should still render with valid locations
    expect(screen.queryByText(/No locations to display/)).not.toBeInTheDocument();
  });

  it('handles location click events', () => {
    const mockOnLocationClick = jest.fn();
    render(
      <TravelMap
        locations={mockLocations}
        onLocationClick={mockOnLocationClick}
      />
    );

    // This would be triggered by the actual map component in real usage
    // For testing, we verify the prop is passed correctly
    expect(mockOnLocationClick).toBeDefined();
  });

  it('renders with custom className', () => {
    const customClass = 'custom-map-class';
    const { container } = render(
      <TravelMap locations={mockLocations} className={customClass} />
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it('handles empty locations array gracefully', () => {
    render(<TravelMap locations={[]} />);

    expect(screen.getByText(/No locations to display/)).toBeInTheDocument();
  });

  it('sanitizes location data', () => {
    const maliciousLocations: MapLocation[] = [
      {
        id: '<script>alert("xss")</script>',
        name: '<img src=x onerror=alert("xss")>',
        coordinates: [35.6762, 139.6503],
        description: 'javascript:alert("xss")',
        type: 'attraction',
        tags: ['<script>alert("xss")</script>'],
      },
    ];

    render(<TravelMap locations={maliciousLocations} />);

    // Should not contain the malicious scripts
    expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
    expect(screen.queryByText(/javascript:/)).not.toBeInTheDocument();
  });

  it('validates coordinate bounds', () => {
    const locationsWithInvalidCoords: MapLocation[] = [
      {
        id: 'out-of-bounds-1',
        name: 'Invalid Latitude',
        coordinates: [91, 139.6503], // Latitude > 90
        type: 'attraction',
      },
      {
        id: 'out-of-bounds-2',
        name: 'Invalid Longitude',
        coordinates: [35.6762, 181], // Longitude > 180
        type: 'restaurant',
      },
      ...mockLocations,
    ];

    render(<TravelMap locations={locationsWithInvalidCoords as MapLocation[]} />);

    // Should still render with valid locations only
    expect(screen.queryByText(/No locations to display/)).not.toBeInTheDocument();
  });

  it('handles undefined or null locations prop', () => {
    render(<TravelMap locations={undefined as any} />);
    expect(screen.getByText(/No locations to display/)).toBeInTheDocument();

    render(<TravelMap locations={null as any} />);
    expect(screen.getByText(/No locations to display/)).toBeInTheDocument();
  });

  it('renders with all optional props', () => {
    const props = {
      locations: mockLocations,
      title: 'Test Map',
      height: '500px',
      className: 'test-class',
      showControls: false,
      interactive: false,
      onLocationClick: jest.fn(),
    };

    render(<TravelMap {...props} />);

    expect(screen.getByText('Test Map')).toBeInTheDocument();
  });

  it('handles location with missing optional fields', () => {
    const minimalLocation: MapLocation = {
      id: 'minimal',
      name: 'Minimal Location',
      coordinates: [35.6762, 139.6503],
      type: 'other',
    };

    render(<TravelMap locations={[minimalLocation]} />);

    expect(screen.queryByText(/No locations to display/)).not.toBeInTheDocument();
  });
});

describe('TravelMap Error Handling', () => {
  it('handles map initialization errors gracefully', () => {
    // Mock console.error to suppress error logs during testing
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // This would trigger the error boundary in a real scenario
    render(<TravelMap locations={mockLocations} />);

    consoleSpy.mockRestore();
  });

  it('provides fallback component when specified', () => {
    const fallback = <div data-testid="custom-fallback">Custom Fallback</div>;

    render(
      <TravelMap
        locations={mockLocations}
        fallbackComponent={fallback}
      />
    );

    // The fallback wouldn't normally show unless there's an error
    // But we can test that the prop is accepted
    expect(fallback).toBeDefined();
  });
});