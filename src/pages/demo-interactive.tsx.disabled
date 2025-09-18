'use client';

import React from 'react';
import InteractiveContentRenderer from '../components/interactive/InteractiveContentRenderer';
import type { MapLocation, TimelineEventType, CodeSnippet } from '../components/interactive';

/**
 * Demo page showcasing Phase 3C Interactive Features
 * Demonstrates TravelMap, Timeline, and CodeSandbox components
 */
export default function DemoInteractivePage() {
  // Sample travel map data
  const sampleMapData = {
    locations: [
      {
        id: 'tokyo-1',
        name: 'Tokyo Skytree',
        coordinates: [35.7101, 139.8107] as [number, number],
        description: 'Iconic broadcasting tower with panoramic city views',
        type: 'attraction' as const,
        visitDate: '2024-03-15',
        cost: { amount: 2100, currency: 'JPY' },
        duration: { value: 3, unit: 'hours' as const },
        tags: ['landmark', 'observation', 'tokyo'],
        images: [
          'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400',
          'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
        ],
      },
      {
        id: 'tokyo-2',
        name: 'Senso-ji Temple',
        coordinates: [35.7148, 139.7967] as [number, number],
        description: 'Ancient Buddhist temple in historic Asakusa district',
        type: 'attraction' as const,
        visitDate: '2024-03-16',
        duration: { value: 2, unit: 'hours' as const },
        tags: ['temple', 'history', 'culture', 'asakusa'],
        images: [
          'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
        ],
      },
      {
        id: 'shibuya-hotel',
        name: 'Shibuya Hotel',
        coordinates: [35.6598, 139.7006] as [number, number],
        description: 'Modern hotel in the heart of Shibuya crossing area',
        type: 'accommodation' as const,
        visitDate: '2024-03-15',
        cost: { amount: 15000, currency: 'JPY' },
        duration: { value: 3, unit: 'days' as const },
        tags: ['hotel', 'shibuya', 'accommodation'],
      },
    ] as MapLocation[],
  };

  // Sample timeline data
  const sampleTimelineData = {
    events: [
      {
        id: 'flight-departure',
        title: 'Flight Departure to Tokyo',
        date: '2024-03-14T10:30:00Z',
        description: 'Departing from SFO on JAL flight 002, excited for the adventure!',
        type: 'travel' as const,
        cost: { amount: 850, currency: 'USD' },
        duration: { value: 11, unit: 'hours' as const },
        tags: ['flight', 'departure', 'jal'],
        metadata: {
          flightNumber: 'JL002',
          seat: '14A',
          airline: 'Japan Airlines',
        },
      },
      {
        id: 'arrival-tokyo',
        title: 'Arrival in Tokyo',
        date: '2024-03-15T14:00:00Z',
        description: 'Landed safely at Narita Airport, customs was quick',
        type: 'travel' as const,
        location: {
          name: 'Narita International Airport',
          coordinates: [35.7720, 140.3929] as [number, number],
        },
        tags: ['arrival', 'narita', 'customs'],
      },
      {
        id: 'hotel-checkin',
        title: 'Hotel Check-in',
        date: '2024-03-15T16:30:00Z',
        description: 'Checked into the hotel in Shibuya, room has a great view of the crossing',
        type: 'accommodation' as const,
        location: {
          name: 'Shibuya Hotel',
          coordinates: [35.6598, 139.7006] as [number, number],
        },
        cost: { amount: 15000, currency: 'JPY' },
        duration: { value: 3, unit: 'days' as const },
        tags: ['checkin', 'shibuya', 'hotel'],
        images: [
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
        ],
      },
      {
        id: 'skytree-visit',
        title: 'Tokyo Skytree Experience',
        date: '2024-03-15T19:00:00Z',
        description: 'Visited Tokyo Skytree for sunset views, absolutely breathtaking!',
        type: 'activity' as const,
        location: {
          name: 'Tokyo Skytree',
          coordinates: [35.7101, 139.8107] as [number, number],
        },
        cost: { amount: 2100, currency: 'JPY' },
        duration: { value: 3, unit: 'hours' as const },
        tags: ['skytree', 'sunset', 'observation', 'landmark'],
        images: [
          'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400',
          'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
        ],
      },
      {
        id: 'temple-visit',
        title: 'Senso-ji Temple Visit',
        date: '2024-03-16T10:00:00Z',
        description: 'Explored the historic Senso-ji Temple and Nakamise shopping street',
        type: 'activity' as const,
        location: {
          name: 'Senso-ji Temple',
          coordinates: [35.7148, 139.7967] as [number, number],
        },
        duration: { value: 2, unit: 'hours' as const },
        tags: ['temple', 'history', 'culture', 'asakusa', 'shopping'],
        images: [
          'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
        ],
      },
      {
        id: 'tech-meetup',
        title: 'Tokyo Tech Meetup',
        date: '2024-03-16T18:00:00Z',
        description: 'Attended a fascinating React and Next.js meetup in Akihabara',
        type: 'milestone' as const,
        location: {
          name: 'Akihabara Convention Center',
          coordinates: [35.7022, 139.7733] as [number, number],
        },
        tags: ['tech', 'meetup', 'react', 'nextjs', 'networking'],
        metadata: {
          organizer: 'Tokyo React Community',
          attendees: 120,
          topics: ['Next.js 14', 'React Server Components', 'TypeScript'],
        },
      },
    ] as TimelineEventType[],
    sortOrder: 'asc' as const,
    groupBy: 'none' as const,
  };

  // Sample code snippets
  const sampleCodeSnippets = [
    {
      id: 'react-hook-example',
      title: 'Custom React Hook for API Calls',
      code: `import { useState, useEffect } from 'react';

// Custom hook for API calls with error handling
function useApiCall<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// Usage example
export default function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useApiCall<User>(\`/api/users/\${userId}\`);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`,
      language: 'typescript' as const,
      description: 'A reusable React hook for making API calls with built-in loading and error states',
      tags: ['react', 'hooks', 'typescript', 'api'],
      author: 'Hayah-AI',
      createdAt: '2024-03-10T10:00:00Z',
      allowExecution: false,
    },
    {
      id: 'javascript-array-methods',
      title: 'JavaScript Array Methods Demo',
      code: `// Array methods demonstration
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log('Original array:', numbers);

// Filter even numbers
const evenNumbers = numbers.filter(n => n % 2 === 0);
console.log('Even numbers:', evenNumbers);

// Double all numbers
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// Sum all numbers
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
console.log('Sum:', sum);

// Find first number greater than 5
const firstGreaterThan5 = numbers.find(n => n > 5);
console.log('First > 5:', firstGreaterThan5);

// Check if any number is greater than 8
const hasGreaterThan8 = numbers.some(n => n > 8);
console.log('Has > 8:', hasGreaterThan8);

// Check if all numbers are positive
const allPositive = numbers.every(n => n > 0);
console.log('All positive:', allPositive);`,
      language: 'javascript' as const,
      description: 'Interactive demonstration of common JavaScript array methods',
      tags: ['javascript', 'arrays', 'functional-programming'],
      author: 'Hayah-AI',
      createdAt: '2024-03-11T14:30:00Z',
      allowExecution: true,
    },
    {
      id: 'css-grid-layout',
      title: 'CSS Grid Layout Example',
      code: `.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 1rem;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.card-content {
  color: #4a5568;
  line-height: 1.6;
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
    padding: 0.5rem;
  }

  .card {
    padding: 1rem;
  }
}`,
      language: 'css' as const,
      description: 'Modern CSS Grid layout with responsive design and hover effects',
      tags: ['css', 'grid', 'responsive', 'layout'],
      author: 'Hayah-AI',
      createdAt: '2024-03-12T09:15:00Z',
      allowExecution: false,
    },
  ];

  // Interactive content configuration
  const interactiveContent = [
    {
      id: 'tokyo-travel-map',
      type: 'travel_map' as const,
      title: 'Tokyo Adventure Map',
      data: sampleMapData,
      metadata: {
        description: 'Interactive map showing key locations from our Tokyo trip',
        category: 'travel',
      },
    },
    {
      id: 'tokyo-timeline',
      type: 'timeline' as const,
      title: 'Tokyo Trip Timeline',
      data: sampleTimelineData,
      metadata: {
        description: 'Chronological timeline of our Tokyo adventure',
        category: 'travel',
      },
    },
    ...sampleCodeSnippets.map((snippet, index) => ({
      id: `code-snippet-${index}`,
      type: 'code_snippet' as const,
      title: snippet.title,
      data: snippet,
      metadata: {
        description: snippet.description,
        category: 'technology',
      },
    })),
  ];

  const handleError = (error: Error, contentId: string) => {
    console.error(`Interactive content error (${contentId}):`, error);
    // In a real application, you might want to send this to an error reporting service
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Phase 3C: Interactive Features Demo
          </h1>
          <p className="mt-2 text-gray-600">
            Demonstrating TravelMap, Timeline, and CodeSandbox components with comprehensive error handling
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              🚀 Interactive Features Overview
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-blue-800">Travel Map</h3>
                <p className="text-blue-700">
                  Interactive map with markers, popups, and fallback for accessibility
                </p>
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Timeline</h3>
                <p className="text-blue-700">
                  Chronological events with expandable details and filtering
                </p>
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Code Sandbox</h3>
                <p className="text-blue-700">
                  Secure code execution with syntax highlighting and safety controls
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive content */}
        <InteractiveContentRenderer
          content={interactiveContent}
          showControls={true}
          allowEditing={true}
          onError={handleError}
          className="space-y-8"
        />

        {/* Footer information */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🛡️ Security & Error Prevention Features
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Map Security</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• XSS prevention in location data</li>
                  <li>• Coordinate validation</li>
                  <li>• Error boundaries for map failures</li>
                  <li>• Graceful fallback to list view</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Timeline Safety</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Date validation & sanitization</li>
                  <li>• Content filtering</li>
                  <li>• Image loading error handling</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Code Execution</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Sandboxed execution environment</li>
                  <li>• Blocked dangerous functions</li>
                  <li>• Timeout protection</li>
                  <li>• XSS prevention</li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}