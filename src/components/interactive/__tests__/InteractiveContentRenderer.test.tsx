import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractiveContentRenderer from '../InteractiveContentRenderer';

// Mock the interactive components
jest.mock('../TravelMap', () => ({
  TravelMap: jest.fn(({ locations, title }) => (
    <div data-testid="travel-map">
      <h3>{title}</h3>
      <div>Locations: {locations.length}</div>
    </div>
  )),
}));

jest.mock('../Timeline', () => ({
  Timeline: jest.fn(({ events, title }) => (
    <div data-testid="timeline">
      <h3>{title}</h3>
      <div>Events: {events.length}</div>
    </div>
  )),
}));

jest.mock('../CodeSandbox', () => ({
  CodeSandbox: jest.fn(({ snippet }) => (
    <div data-testid="code-sandbox">
      <h3>{snippet.title}</h3>
      <div>Language: {snippet.language}</div>
    </div>
  )),
}));

const mockTravelMapContent = {
  id: 'travel-map-1',
  type: 'travel_map' as const,
  title: 'Test Travel Map',
  data: {
    locations: [
      {
        id: 'loc-1',
        name: 'Test Location',
        coordinates: [35.6762, 139.6503],
        type: 'attraction',
      },
    ],
  },
};

const mockTimelineContent = {
  id: 'timeline-1',
  type: 'timeline' as const,
  title: 'Test Timeline',
  data: {
    events: [
      {
        id: 'event-1',
        title: 'Test Event',
        date: '2024-03-15T10:00:00Z',
        type: 'milestone',
      },
    ],
  },
};

const mockCodeSnippetContent = {
  id: 'code-1',
  type: 'code_snippet' as const,
  title: 'Test Code',
  data: {
    code: 'console.log("test");',
    language: 'javascript',
    createdAt: '2024-03-15T10:00:00Z',
  },
};

describe('InteractiveContentRenderer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders travel map content', () => {
    render(<InteractiveContentRenderer content={[mockTravelMapContent]} />);

    expect(screen.getByTestId('travel-map')).toBeInTheDocument();
    expect(screen.getByText('Test Travel Map')).toBeInTheDocument();
    expect(screen.getByText('Locations: 1')).toBeInTheDocument();
  });

  it('renders timeline content', () => {
    render(<InteractiveContentRenderer content={[mockTimelineContent]} />);

    expect(screen.getByTestId('timeline')).toBeInTheDocument();
    expect(screen.getByText('Test Timeline')).toBeInTheDocument();
    expect(screen.getByText('Events: 1')).toBeInTheDocument();
  });

  it('renders code snippet content', () => {
    render(<InteractiveContentRenderer content={[mockCodeSnippetContent]} />);

    expect(screen.getByTestId('code-sandbox')).toBeInTheDocument();
    expect(screen.getByText('Test Code')).toBeInTheDocument();
    expect(screen.getByText('Language: javascript')).toBeInTheDocument();
  });

  it('renders multiple content types', () => {
    const content = [
      mockTravelMapContent,
      mockTimelineContent,
      mockCodeSnippetContent,
    ];

    render(<InteractiveContentRenderer content={content} />);

    expect(screen.getByTestId('travel-map')).toBeInTheDocument();
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
    expect(screen.getByTestId('code-sandbox')).toBeInTheDocument();
  });

  it('renders nothing when content is empty', () => {
    const { container } = render(<InteractiveContentRenderer content={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when content is null or undefined', () => {
    const { container: container1 } = render(
      <InteractiveContentRenderer content={null as any} />
    );
    expect(container1.firstChild).toBeNull();

    const { container: container2 } = render(
      <InteractiveContentRenderer content={undefined as any} />
    );
    expect(container2.firstChild).toBeNull();
  });

  it('handles unknown content types', () => {
    const unknownContent = {
      id: 'unknown-1',
      type: 'unknown_type' as any,
      title: 'Unknown Content',
      data: {},
    };

    render(<InteractiveContentRenderer content={[unknownContent]} />);

    expect(screen.getByText(/Unknown interactive content type/)).toBeInTheDocument();
    expect(screen.getByText(/unknown_type/)).toBeInTheDocument();
  });

  it('handles invalid travel map data', () => {
    const invalidTravelMapContent = {
      id: 'invalid-map',
      type: 'travel_map' as const,
      title: 'Invalid Map',
      data: {
        locations: 'not-an-array', // Invalid data
      },
    };

    render(<InteractiveContentRenderer content={[invalidTravelMapContent]} />);

    expect(screen.getByText(/Failed to render interactive content/)).toBeInTheDocument();
  });

  it('handles invalid timeline data', () => {
    const invalidTimelineContent = {
      id: 'invalid-timeline',
      type: 'timeline' as const,
      title: 'Invalid Timeline',
      data: {
        events: 'not-an-array', // Invalid data
      },
    };

    render(<InteractiveContentRenderer content={[invalidTimelineContent]} />);

    expect(screen.getByText(/Failed to render interactive content/)).toBeInTheDocument();
  });

  it('handles invalid code snippet data', () => {
    const invalidCodeContent = {
      id: 'invalid-code',
      type: 'code_snippet' as const,
      title: 'Invalid Code',
      data: {
        // Missing required fields
      },
    };

    render(<InteractiveContentRenderer content={[invalidCodeContent]} />);

    expect(screen.getByText(/Failed to render interactive content/)).toBeInTheDocument();
  });

  it('handles empty travel map locations', () => {
    const emptyMapContent = {
      id: 'empty-map',
      type: 'travel_map' as const,
      title: 'Empty Map',
      data: {
        locations: [], // Empty array
      },
    };

    render(<InteractiveContentRenderer content={[emptyMapContent]} />);

    expect(screen.getByText(/No valid locations found/)).toBeInTheDocument();
  });

  it('handles empty timeline events', () => {
    const emptyTimelineContent = {
      id: 'empty-timeline',
      type: 'timeline' as const,
      title: 'Empty Timeline',
      data: {
        events: [], // Empty array
      },
    };

    render(<InteractiveContentRenderer content={[emptyTimelineContent]} />);

    expect(screen.getByText(/No valid events found/)).toBeInTheDocument();
  });

  it('filters out invalid locations from travel map', () => {
    const mapWithInvalidLocations = {
      id: 'mixed-map',
      type: 'travel_map' as const,
      title: 'Mixed Map',
      data: {
        locations: [
          {
            id: 'valid',
            name: 'Valid Location',
            coordinates: [35.6762, 139.6503],
            type: 'attraction',
          },
          {
            id: 'invalid',
            // Missing required fields
          },
          {
            // Missing id
            name: 'Invalid Location 2',
            coordinates: [35.6762, 139.6503],
            type: 'restaurant',
          },
        ],
      },
    };

    render(<InteractiveContentRenderer content={[mapWithInvalidLocations]} />);

    // Should render with only valid locations
    expect(screen.getByTestId('travel-map')).toBeInTheDocument();
    expect(screen.getByText('Locations: 1')).toBeInTheDocument();
  });

  it('filters out invalid events from timeline', () => {
    const timelineWithInvalidEvents = {
      id: 'mixed-timeline',
      type: 'timeline' as const,
      title: 'Mixed Timeline',
      data: {
        events: [
          {
            id: 'valid',
            title: 'Valid Event',
            date: '2024-03-15T10:00:00Z',
            type: 'milestone',
          },
          {
            id: 'invalid',
            // Missing required fields
          },
          {
            // Missing id
            title: 'Invalid Event 2',
            date: '2024-03-15T10:00:00Z',
            type: 'activity',
          },
        ],
      },
    };

    render(<InteractiveContentRenderer content={[timelineWithInvalidEvents]} />);

    // Should render with only valid events
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
    expect(screen.getByText('Events: 1')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-renderer-class';
    const { container } = render(
      <InteractiveContentRenderer
        content={[mockTravelMapContent]}
        className={customClass}
      />
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it('passes showControls prop to components', () => {
    const { TravelMap } = require('../TravelMap');

    render(
      <InteractiveContentRenderer
        content={[mockTravelMapContent]}
        showControls={false}
      />
    );

    expect(TravelMap).toHaveBeenCalledWith(
      expect.objectContaining({ showControls: false }),
      expect.any(Object)
    );
  });

  it('passes allowEditing prop to code sandbox', () => {
    const { CodeSandbox } = require('../CodeSandbox');

    render(
      <InteractiveContentRenderer
        content={[mockCodeSnippetContent]}
        allowEditing={true}
      />
    );

    expect(CodeSandbox).toHaveBeenCalledWith(
      expect.objectContaining({ allowEditing: true }),
      expect.any(Object)
    );
  });

  it('calls onError callback when content fails to render', () => {
    const mockOnError = jest.fn();
    const invalidContent = {
      id: 'error-content',
      type: 'travel_map' as const,
      title: 'Error Content',
      data: {
        locations: 'invalid', // This will cause an error
      },
    };

    render(
      <InteractiveContentRenderer
        content={[invalidContent]}
        onError={mockOnError}
      />
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      'error-content'
    );
  });

  it('handles content with additional props in data', () => {
    const contentWithProps = {
      id: 'props-content',
      type: 'code_snippet' as const,
      title: 'Code with Props',
      data: {
        code: 'console.log("test");',
        language: 'javascript',
        createdAt: '2024-03-15T10:00:00Z',
        props: {
          theme: 'dark',
          maxHeight: '300px',
        },
      },
    };

    render(<InteractiveContentRenderer content={[contentWithProps]} />);

    expect(screen.getByTestId('code-sandbox')).toBeInTheDocument();
  });
});

describe('InteractiveContentRenderer Error Handling', () => {
  beforeEach(() => {
    // Suppress console.error for error tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('gracefully handles rendering errors', () => {
    // Mock the TravelMap to throw an error
    const { TravelMap } = require('../TravelMap');
    TravelMap.mockImplementation(() => {
      throw new Error('Rendering error');
    });

    render(<InteractiveContentRenderer content={[mockTravelMapContent]} />);

    expect(screen.getByText(/Failed to render interactive content/)).toBeInTheDocument();
  });

  it('continues rendering other content when one fails', () => {
    // Mock the TravelMap to throw an error
    const { TravelMap } = require('../TravelMap');
    TravelMap.mockImplementation(() => {
      throw new Error('Map rendering error');
    });

    const content = [mockTravelMapContent, mockTimelineContent];
    render(<InteractiveContentRenderer content={content} />);

    // Should show error for travel map but still render timeline
    expect(screen.getByText(/Failed to render interactive content/)).toBeInTheDocument();
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });
});