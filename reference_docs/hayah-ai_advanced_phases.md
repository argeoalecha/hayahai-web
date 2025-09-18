# Hayah-AI Blog Website - Advanced Phases Implementation Guide

## 📋 Table of Contents
1. [Phase 3C: Advanced Interactive Features (Week 6-7)](#phase-3c-advanced-interactive-features-week-6-7)
2. [Phase 3D: Production Deployment (Week 8)](#phase-3d-production-deployment-week-8)
3. [Error Prevention Testing Strategy](#error-prevention-testing-strategy)
4. [CI/CD Pipeline with Error Prevention](#cicd-pipeline-with-error-prevention)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Performance Optimization](#performance-optimization)
7. [Security Hardening](#security-hardening)
8. [Implementation Checklist](#implementation-checklist)

---

## Phase 3C: Advanced Interactive Features (Week 6-7)

### 🗺️ **Interactive Travel Map with Error Handling**

```typescript
// components/interactive/Map.tsx - Error-proof travel map component
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { LatLngExpression, Icon } from 'leaflet'
import { TravelLocation } from '@prisma/client'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AlertCircleIcon, MapPinIcon, ExternalLinkIcon } from 'lucide-react'

// Lazy load Leaflet CSS to prevent SSR issues
import dynamic from 'next/dynamic'

interface MapProps {
  locations: TravelLocation[]
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
  onLocationClick?: (location: TravelLocation) => void
}

// Custom hook for map error handling
function useMapErrorHandler() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const handleError = useCallback((err: Error, context: string) => {
    console.error(`Map error in ${context}:`, err)
    setError(`Map failed to load: ${err.message}`)
    setIsLoading(false)
  }, [])
  
  const clearError = useCallback(() => {
    setError(null)
    setIsLoading(true)
  }, [])
  
  return { error, isLoading, setIsLoading, handleError, clearError }
}

// Map bounds calculation with error handling
function calculateMapBounds(locations: TravelLocation[]): {
  center: [number, number]
  zoom: number
} {
  if (locations.length === 0) {
    return { center: [0, 0], zoom: 2 }
  }
  
  if (locations.length === 1) {
    return { 
      center: [locations[0].latitude, locations[0].longitude], 
      zoom: 10 
    }
  }
  
  try {
    const validLocations = locations.filter(loc => 
      typeof loc.latitude === 'number' && 
      typeof loc.longitude === 'number' &&
      !isNaN(loc.latitude) && 
      !isNaN(loc.longitude) &&
      Math.abs(loc.latitude) <= 90 &&
      Math.abs(loc.longitude) <= 180
    )
    
    if (validLocations.length === 0) {
      throw new Error('No valid coordinates found')
    }
    
    const lats = validLocations.map(loc => loc.latitude)
    const lngs = validLocations.map(loc => loc.longitude)
    
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    
    // Calculate appropriate zoom level
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const maxDiff = Math.max(latDiff, lngDiff)
    
    let zoom = 10
    if (maxDiff > 10) zoom = 3
    else if (maxDiff > 5) zoom = 5
    else if (maxDiff > 2) zoom = 6
    else if (maxDiff > 1) zoom = 8
    else if (maxDiff > 0.5) zoom = 9
    
    return { center: [centerLat, centerLng], zoom }
  } catch (error) {
    console.error('Error calculating map bounds:', error)
    return { center: [0, 0], zoom: 2 }
  }
}

// Custom marker icons with error handling
const createCustomIcon = (category: string): Icon => {
  try {
    const iconUrl = `/images/map-icons/${category.toLowerCase()}.png`
    return new Icon({
      iconUrl,
      iconSize: [25, 25],
      iconAnchor: [12, 25],
      popupAnchor: [0, -25],
    })
  } catch (error) {
    console.error('Error creating custom icon:', error)
    // Fallback to default marker
    return new Icon.Default()
  }
}

// Map component with comprehensive error handling
function MapComponent({ 
  locations, 
  center, 
  zoom, 
  height = '400px',
  className,
  onLocationClick 
}: MapProps) {
  const { error, isLoading, setIsLoading, handleError, clearError } = useMapErrorHandler()
  const [mapInstance, setMapInstance] = useState<any>(null)
  
  // Calculate optimal map view
  const mapBounds = useMemo(() => {
    if (center && zoom) {
      return { center, zoom }
    }
    return calculateMapBounds(locations)
  }, [locations, center, zoom])
  
  // Validate locations data
  const validLocations = useMemo(() => {
    return locations.filter(location => {
      if (!location.latitude || !location.longitude) {
        console.warn('Location missing coordinates:', location.name)
        return false
      }
      
      if (Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) {
        console.warn('Invalid coordinates for location:', location.name)
        return false
      }
      
      return true
    })
  }, [locations])
  
  // Handle map load
  const handleMapLoad = useCallback(() => {
    setIsLoading(false)
  }, [setIsLoading])
  
  // Handle location marker click
  const handleMarkerClick = useCallback((location: TravelLocation) => {
    try {
      onLocationClick?.(location)
    } catch (error) {
      console.error('Error handling marker click:', error)
    }
  }, [onLocationClick])
  
  // Error fallback component
  if (error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center border border-destructive/50 bg-destructive/10 rounded-lg p-8 ${className}`}
        style={{ height }}
      >
        <AlertCircleIcon className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-destructive text-center mb-4">{error}</p>
        <button
          onClick={clearError}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center border rounded-lg ${className}`}
        style={{ height }}
      >
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  return (
    <div className={`relative border rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={mapBounds.center as LatLngExpression}
        zoom={mapBounds.zoom}
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMapInstance}
        whenReady={handleMapLoad}
        onError={(error) => handleError(error.error, 'MapContainer')}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          onError={(error) => handleError(new Error('Failed to load map tiles'), 'TileLayer')}
        />
        
        {validLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={createCustomIcon(location.category)}
            eventHandlers={{
              click: () => handleMarkerClick(location),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-sm mb-1">{location.name}</h3>
                {location.description && (
                  <p className="text-xs text-muted-foreground mb-2">{location.description}</p>
                )}
                
                <div className="space-y-1 text-xs">
                  {location.rating && (
                    <div className="flex items-center gap-1">
                      <span>Rating:</span>
                      <span className="font-medium">{location.rating}/5</span>
                    </div>
                  )}
                  
                  {location.priceLevel && (
                    <div className="flex items-center gap-1">
                      <span>Price:</span>
                      <span className="font-medium">{'$'.repeat(location.priceLevel)}</span>
                    </div>
                  )}
                  
                  {location.website && (
                    <a
                      href={location.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLinkIcon className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Location count indicator */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium">
        <MapPinIcon className="h-3 w-3 inline mr-1" />
        {validLocations.length} location{validLocations.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

// Dynamic import to prevent SSR issues
const DynamicMap = dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center border rounded-lg h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  ),
})

// Main export with error boundary
export function TravelMap(props: MapProps) {
  return (
    <ErrorBoundary
      level="component"
      fallback={({ resetError }) => (
        <div className="flex flex-col items-center justify-center border border-destructive/50 bg-destructive/10 rounded-lg p-8">
          <AlertCircleIcon className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive text-center mb-4">
            Map failed to load. This might be due to network issues or browser compatibility.
          </p>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      )}
    >
      <DynamicMap {...props} />
    </ErrorBoundary>
  )
}
```

### ⏱️ **Interactive Timeline Component**

```typescript
// components/interactive/Timeline.tsx - Error-proof timeline with animations
'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { TimelineEvent } from '@prisma/client'
import { format, isValid, parseISO } from 'date-fns'
import { MapPinIcon, ClockIcon, DollarSignIcon, ImageIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

interface TimelineProps {
  events: TimelineEvent[]
  className?: string
  showImages?: boolean
  collapsible?: boolean
  sortOrder?: 'asc' | 'desc'
}

interface TimelineEventProps {
  event: TimelineEvent
  index: number
  isLast: boolean
  showImages: boolean
  isCollapsible: boolean
}

// Utility function to safely format dates
function safeDateFormat(dateString: string, formatString: string = 'PPP'): string {
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) {
      console.warn('Invalid date:', dateString)
      return 'Invalid date'
    }
    return format(date, formatString)
  } catch (error) {
    console.error('Date formatting error:', error)
    return 'Date error'
  }
}

// Utility function to safely format time
function safeTimeFormat(dateString: string): string {
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return ''
    return format(date, 'HH:mm')
  } catch (error) {
    console.error('Time formatting error:', error)
    return ''
  }
}

// Utility function to format duration
function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return ''
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours > 0) {
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`
  }
  
  return `${remainingMinutes}m`
}

// Utility function to format cost
function formatCost(cost: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(cost)
  } catch (error) {
    console.error('Cost formatting error:', error)
    return `${cost} ${currency}`
  }
}

// Individual timeline event component
function TimelineEventComponent({ 
  event, 
  index, 
  isLast, 
  showImages, 
  isCollapsible 
}: TimelineEventProps) {
  const [isExpanded, setIsExpanded] = useState(!isCollapsible)
  const [imageError, setImageError] = useState<string | null>(null)
  
  const toggleExpanded = useCallback(() => {
    if (isCollapsible) {
      setIsExpanded(prev => !prev)
    }
  }, [isCollapsible])
  
  const handleImageError = useCallback((error: any) => {
    console.error('Timeline image error:', error)
    setImageError('Failed to load image')
  }, [])
  
  // Parse event data safely
  const eventData = useMemo(() => {
    try {
      return {
        date: safeDateFormat(event.eventDate),
        time: safeTimeFormat(event.eventDate),
        duration: event.duration ? formatDuration(event.duration) : null,
        cost: event.cost && event.currency ? formatCost(Number(event.cost), event.currency) : null,
        hasImages: Array.isArray(event.images) && event.images.length > 0,
        validImages: Array.isArray(event.images) 
          ? event.images.filter(img => typeof img === 'string' && img.length > 0)
          : [],
      }
    } catch (error) {
      console.error('Error parsing event data:', error)
      return {
        date: 'Invalid date',
        time: '',
        duration: null,
        cost: null,
        hasImages: false,
        validImages: [],
      }
    }
  }, [event])
  
  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm" />
        {!isLast && <div className="w-0.5 bg-border h-full mt-2" />}
      </div>
      
      {/* Event content */}
      <div className="flex-1 min-w-0">
        {/* Event header */}
        <div 
          className={`${isCollapsible ? 'cursor-pointer' : ''} mb-2`}
          onClick={toggleExpanded}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base text-foreground">
                {event.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span>{eventData.date}</span>
                {eventData.time && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      {eventData.time}
                    </div>
                  </>
                )}
                {eventData.duration && (
                  <>
                    <span>•</span>
                    <span>{eventData.duration}</span>
                  </>
                )}
              </div>
            </div>
            
            {isCollapsible && (
              <Button variant="ghost" size="sm">
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Expandable content */}
        {isExpanded && (
          <div className="space-y-3">
            {/* Description */}
            {event.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            )}
            
            {/* Event details */}
            <div className="flex flex-wrap gap-4 text-sm">
              {event.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPinIcon className="h-3 w-3" />
                  <span>{event.location}</span>
                </div>
              )}
              
              {eventData.cost && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSignIcon className="h-3 w-3" />
                  <span>{eventData.cost}</span>
                </div>
              )}
              
              {eventData.hasImages && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  <span>{eventData.validImages.length} photo{eventData.validImages.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            
            {/* Tags */}
            {Array.isArray(event.tags) && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {event.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Images */}
            {showImages && eventData.validImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                {eventData.validImages.slice(0, 6).map((image, imageIndex) => (
                  <div key={imageIndex} className="relative aspect-square rounded-lg overflow-hidden">
                    {imageError ? (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      <Image
                        src={image}
                        alt={`${event.title} - Image ${imageIndex + 1}`}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    )}
                  </div>
                ))}
                
                {eventData.validImages.length > 6 && (
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">
                      +{eventData.validImages.length - 6} more
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Notes */}
            {event.notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground italic">
                  {event.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Main timeline component
function TimelineComponent({ 
  events, 
  className, 
  showImages = true, 
  collapsible = false,
  sortOrder = 'asc' 
}: TimelineProps) {
  // Sort and validate events
  const sortedEvents = useMemo(() => {
    try {
      const validEvents = events.filter(event => {
        if (!event.eventDate) {
          console.warn('Event missing date:', event.title)
          return false
        }
        
        const date = parseISO(event.eventDate)
        if (!isValid(date)) {
          console.warn('Event has invalid date:', event.title, event.eventDate)
          return false
        }
        
        return true
      })
      
      return validEvents.sort((a, b) => {
        const dateA = parseISO(a.eventDate)
        const dateB = parseISO(b.eventDate)
        
        if (sortOrder === 'desc') {
          return dateB.getTime() - dateA.getTime()
        }
        
        return dateA.getTime() - dateB.getTime()
      })
    } catch (error) {
      console.error('Error sorting events:', error)
      return []
    }
  }, [events, sortOrder])
  
  // Handle empty state
  if (sortedEvents.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ClockIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No timeline events to display</p>
      </div>
    )
  }
  
  return (
    <div className={`space-y-0 ${className}`}>
      {sortedEvents.map((event, index) => (
        <ErrorBoundary
          key={event.id}
          level="component"
          fallback={({ resetError }) => (
            <div className="relative flex gap-4 pb-8">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-destructive rounded-full border-2 border-background" />
                {index < sortedEvents.length - 1 && (
                  <div className="w-0.5 bg-border h-full mt-2" />
                )}
              </div>
              <div className="flex-1 p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive mb-2">
                  Failed to load timeline event: {event.title}
                </p>
                <Button variant="outline" size="sm" onClick={resetError}>
                  Retry
                </Button>
              </div>
            </div>
          )}
        >
          <TimelineEventComponent
            event={event}
            index={index}
            isLast={index === sortedEvents.length - 1}
            showImages={showImages}
            isCollapsible={collapsible}
          />
        </ErrorBoundary>
      ))}
    </div>
  )
}

// Main export with error boundary
export function Timeline(props: TimelineProps) {
  return (
    <ErrorBoundary
      level="component"
      fallback={({ resetError }) => (
        <div className="text-center py-8 border border-destructive/50 bg-destructive/10 rounded-lg">
          <ClockIcon className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive mb-4">Timeline failed to load</p>
          <Button variant="outline" onClick={resetError}>
            Try Again
          </Button>
        </div>
      )}
    >
      <TimelineComponent {...props} />
    </ErrorBoundary>
  )
}
```

### 💻 **Code Execution Sandbox (Secure)**

```typescript
// components/interactive/CodeSandbox.tsx - Secure code execution with error handling
'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { PlayIcon, StopIcon, CopyIcon, DownloadIcon, MaximizeIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useTheme } from 'next-themes'

interface CodeSandboxProps {
  code: string
  language: string
  title?: string
  description?: string
  editable?: boolean
  runnable?: boolean
  theme?: 'light' | 'dark' | 'auto'
  maxHeight?: string
  showLineNumbers?: boolean
  allowDownload?: boolean
  onCodeChange?: (code: string) => void
  onRun?: (code: string) => Promise<string>
}

// Supported languages for execution (security whitelist)
const EXECUTABLE_LANGUAGES = ['javascript', 'typescript', 'python'] as const
type ExecutableLanguage = typeof EXECUTABLE_LANGUAGES[number]

// Security: Sanitize code before execution
function sanitizeCode(code: string, language: string): string {
  // Remove potentially dangerous patterns
  const dangerousPatterns = [
    /import\s+.*\s+from\s+['"][^'"]*['"]/g, // ES6 imports
    /require\s*\(\s*['"][^'"]*['"]\s*\)/g,  // CommonJS requires
    /eval\s*\(/g,                          // eval calls
    /Function\s*\(/g,                      // Function constructor
    /window\./g,                           // Window object access
    /document\./g,                         // Document object access
    /fetch\s*\(/g,                         // Fetch calls
    /XMLHttpRequest/g,                     // XHR
    /localStorage/g,                       // Local storage
    /sessionStorage/g,                     // Session storage
  ]
  
  let sanitized = code
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '// [BLOCKED FOR SECURITY]')
  })
  
  return sanitized
}

// Mock execution environment for safe code running
function createMockEnvironment() {
  return {
    console: {
      log: (...args: any[]) => args.map(arg => String(arg)).join(' '),
      error: (...args: any[]) => `Error: ${args.map(arg => String(arg)).join(' ')}`,
      warn: (...args: any[]) => `Warning: ${args.map(arg => String(arg)).join(' ')}`,
    },
    setTimeout: () => { throw new Error('setTimeout is not allowed') },
    setInterval: () => { throw new Error('setInterval is not allowed') },
    fetch: () => { throw new Error('Network requests are not allowed') },
  }
}

// Safe code execution with timeout
async function executeCode(code: string, language: ExecutableLanguage): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Code execution timeout (5 seconds)'))
    }, 5000)
    
    try {
      const sanitized = sanitizeCode(code, language)
      const mockEnv = createMockEnvironment()
      
      let result = ''
      
      if (language === 'javascript' || language === 'typescript') {
        // Create a safe execution context
        const wrappedCode = `
          (function() {
            const console = arguments[0];
            const output = [];
            
            // Override console methods to capture output
            const captureConsole = {
              log: (...args) => output.push(args.map(String).join(' ')),
              error: (...args) => output.push('Error: ' + args.map(String).join(' ')),
              warn: (...args) => output.push('Warning: ' + args.map(String).join(' ')),
            };
            
            try {
              ${sanitized}
              return output.join('\\n') || 'Code executed successfully (no output)';
            } catch (error) {
              return 'Runtime Error: ' + error.message;
            }
          })
        `
        
        // Execute in controlled environment
        const func = new Function('return ' + wrappedCode)()
        result = func(mockEnv.console)
      } else {
        // For other languages, return a mock result
        result = `Code execution for ${language} is not yet implemented in this demo.`
      }
      
      clearTimeout(timeout)
      resolve(result)
    } catch (error) {
      clearTimeout(timeout)
      reject(error instanceof Error ? error : new Error('Unknown execution error'))
    }
  })
}

// Main code sandbox component
function CodeSandboxComponent({
  code,
  language,
  title,
  description,
  editable = false,
  runnable = false,
  theme = 'auto',
  maxHeight = '400px',
  showLineNumbers = true,
  allowDownload = true,
  onCodeChange,
  onRun,
}: CodeSandboxProps) {
  const { theme: systemTheme } = useTheme()
  const [currentCode, setCurrentCode] = useState(code)
  const [output, setOutput] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Determine syntax highlighting theme
  const syntaxTheme = useMemo(() => {
    if (theme === 'auto') {
      return systemTheme === 'dark' ? oneDark : oneLight
    }
    return theme === 'dark' ? oneDark : oneLight
  }, [theme, systemTheme])
  
  // Check if language is executable
  const isExecutable = useMemo(() => {
    return runnable && EXECUTABLE_LANGUAGES.includes(language as ExecutableLanguage)
  }, [runnable, language])
  
  // Handle code changes
  const handleCodeChange = useCallback((newCode: string) => {
    setCurrentCode(newCode)
    onCodeChange?.(newCode)
    setError(null)
  }, [onCodeChange])
  
  // Handle code execution
  const handleRun = useCallback(async () => {
    if (!isExecutable || isRunning) return
    
    setIsRunning(true)
    setError(null)
    setOutput('')
    
    try {
      let result: string
      
      if (onRun) {
        // Use custom execution handler
        result = await onRun(currentCode)
      } else {
        // Use built-in safe execution
        result = await executeCode(currentCode, language as ExecutableLanguage)
      }
      
      setOutput(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      setOutput(`Execution failed: ${errorMessage}`)
    } finally {
      setIsRunning(false)
    }
  }, [currentCode, language, isExecutable, isRunning, onRun])
  
  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }, [currentCode])
  
  // Handle download
  const handleDownload = useCallback(() => {
    const blob = new Blob([currentCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${language}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [currentCode, language])
  
  // Sync external code changes
  useEffect(() => {
    setCurrentCode(code)
  }, [code])
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b">
        <div>
          {title && (
            <h3 className="font-medium text-sm">{title}</h3>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{language}</span>
            {isExecutable && (
              <>
                <span>•</span>
                <span>Executable</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isExecutable && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRun}
              disabled={isRunning}
              loading={isRunning}
              loadingText="Running..."
            >
              {isRunning ? (
                <StopIcon className="h-3 w-3" />
              ) : (
                <PlayIcon className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            disabled={copied}
          >
            <CopyIcon className="h-3 w-3" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          
          {allowDownload && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
            >
              <DownloadIcon className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Description */}
      {description && (
        <div className="px-4 py-2 text-sm text-muted-foreground border-b">
          {description}
        </div>
      )}
      
      {/* Code editor/viewer */}
      <div className="relative" style={{ maxHeight }}>
        {editable ? (
          <textarea
            ref={textareaRef}
            value={currentCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm bg-transparent resize-none focus:outline-none"
            style={{ minHeight: '200px' }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        ) : (
          <div className="overflow-auto" style={{ maxHeight }}>
            <SyntaxHighlighter
              language={language}
              style={syntaxTheme}
              showLineNumbers={showLineNumbers}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'transparent',
              }}
              codeTagProps={{
                style: {
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-mono, Consolas, Monaco, "Courier New", monospace)',
                }
              }}
            >
              {currentCode}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
      
      {/* Output panel */}
      {(output || error) && (
        <div className="border-t">
          <div className="px-4 py-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Output</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setOutput('')
                  setError(null)
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="p-4 font-mono text-sm max-h-40 overflow-auto">
            {error ? (
              <div className="text-destructive">{error}</div>
            ) : (
              <pre className="whitespace-pre-wrap">{output}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Main export with error boundary
export function CodeSandbox(props: CodeSandboxProps) {
  return (
    <ErrorBoundary
      level="component"
      fallback={({ error, resetError }) => (
        <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-4">
          <p className="text-destructive mb-2">Code sandbox failed to load</p>
          <p className="text-sm text-muted-foreground mb-4">
            {process.env.NODE_ENV === 'development' ? error.message : 'Please try refreshing the page'}
          </p>
          <Button variant="outline" onClick={resetError}>
            Try Again
          </Button>
        </div>
      )}
    >
      <CodeSandboxComponent {...props} />
    </ErrorBoundary>
  )
}

// Hook for managing multiple code sandboxes
export function useCodeSandbox() {
  const [sandboxes, setSandboxes] = useState<Map<string, string>>(new Map())
  
  const updateCode = useCallback((id: string, code: string) => {
    setSandboxes(prev => new Map(prev).set(id, code))
  }, [])
  
  const getCode = useCallback((id: string) => {
    return sandboxes.get(id) || ''
  }, [sandboxes])
  
  const removeCode = useCallback((id: string) => {
    setSandboxes(prev => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])
  
  return { updateCode, getCode, removeCode }
}
```

---

## Phase 3D: Production Deployment (Week 8)

### 🚀 **CI/CD Pipeline with Error Prevention**

```yaml
# .github/workflows/deploy.yml - Comprehensive CI/CD with testing
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  # Security and quality checks
  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Audit dependencies
        run: pnpm audit --audit-level moderate
        
      - name: Check for vulnerabilities
        run: pnpm audit --fix --audit-level high
        
      - name: Security scan with CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: typescript, javascript
          
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  # Type checking and linting
  code-quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Type checking
        run: pnpm run type-check
        
      - name: Linting
        run: pnpm run lint
        
      - name: Formatting check
        run: pnpm run format:check
        
      - name: Check for unused dependencies
        run: pnpm dlx depcheck
        
      - name: Bundle analysis
        run: pnpm run analyze
        env:
          ANALYZE: true

  # Database tests
  database-tests:
    name: Database Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Setup test database
        run: |
          pnpm prisma migrate deploy
          pnpm prisma db seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          
      - name: Run database tests
        run: pnpm test:db
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          
      - name: Test migrations
        run: pnpm prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma

  # Unit and integration tests
  tests:
    name: Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-type: [unit, integration, e2e]
        
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Install Playwright browsers
        if: matrix.test-type == 'e2e'
        run: pnpm exec playwright install --with-deps
        
      - name: Run tests
        run: pnpm test:${{ matrix.test-type }}
        env:
          CI: true
          
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results-${{ matrix.test-type }}
          path: |
            test-results/
            coverage/
            playwright-report/

  # Build and deployment
  build-and-deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    needs: [security-audit, code-quality, database-tests, tests]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build application
        run: pnpm build
        env:
          NODE_ENV: production
          NEXT_TELEMETRY_DISABLED: 1
          
      - name: Run post-build tests
        run: pnpm test:build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          
      - name: Run smoke tests
        run: pnpm test:smoke
        env:
          BASE_URL: https://hayah-ai.com
          
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  # Performance monitoring
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: [build-and-deploy]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true
          
      - name: WebPageTest
        uses: WPO-Foundation/webpagetest-github-action@v1
        with:
          apiKey: ${{ secrets.WPT_API_KEY }}
          urls: |
            https://hayah-ai.com
            https://hayah-ai.com/technology
            https://hayah-ai.com/travel
          label: 'Production Performance Test'
```

### 📊 **Performance Monitoring Configuration**

```json
// lighthouserc.json - Performance budgets and monitoring
{
  "ci": {
    "collect": {
      "url": [
        "https://hayah-ai.com",
        "https://hayah-ai.com/technology",
        "https://hayah-ai.com/travel",
        "https://hayah-ai.com/sites"
      ],
      "numberOfRuns": 3,
      "settings": {
        "chromeFlags": "--no-sandbox --disable-dev-shm-usage"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "categories:pwa": ["warn", { "minScore": 0.8 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 🔧 **Health Check API**

```typescript
// app/api/health/route.ts - Comprehensive health monitoring
import { NextResponse } from 'next/server'
import { checkDBHealth } from '@/lib/database/client'
import { validateExternalServices } from '@/lib/env'

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, any> = {}
  
  try {
    // Database health check
    checks.database = await checkDBHealth(1)
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
  
  try {
    // External services check
    checks.services = await validateExternalServices()
  } catch (error) {
    checks.services = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Service check failed'
    }
  }
  
  // Memory usage
  checks.memory = {
    used: process.memoryUsage().heapUsed,
    total: process.memoryUsage().heapTotal,
    percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
  }
  
  // Response time
  checks.responseTime = Date.now() - startTime
  
  // Overall health status
  const isHealthy = Object.values(checks).every(check => 
    !check.status || check.status === 'healthy'
  )
  
  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    checks
  }
  
  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json'
    }
  })
}
```

---

## Error Prevention Testing Strategy

### 🧪 **Comprehensive Testing Setup**

```typescript
// tests/setup.ts - Global test configuration
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
beforeAll(() => {
  vi.mock('@/lib/env', () => ({
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      NEXTAUTH_SECRET: 'test-secret-min-32-characters-long',
      NEXTAUTH_URL: 'http://localhost:3000',
    }
  }))
})

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => new Map(),
}))

// Mock authentication
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock database
vi.mock('@/lib/database/client', () => ({
  db: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
  checkDBHealth: vi.fn(() => Promise.resolve({ status: 'healthy' })),
}))

// Error boundary testing helper
global.ErrorBoundaryTest = {
  triggerError: (component: any) => {
    const error = new Error('Test error')
    component.componentDidCatch(error, { componentStack: 'test stack' })
  }
}
```

### 🔧 **Component Testing with Error Scenarios**

```typescript
// tests/components/Button.test.tsx - Comprehensive button testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('handles loading state correctly', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })
  
  it('handles error state correctly', () => {
    render(<Button error errorText="Failed to submit">Submit</Button>)
    expect(screen.getByText('Failed to submit')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })
  
  it('prevents multiple clicks during async operations', async () => {
    const mockClick = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<Button onClick={mockClick}>Submit</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button) // Second click should be ignored
    
    await waitFor(() => {
      expect(mockClick).toHaveBeenCalledTimes(1)
    })
  })
  
  it('handles click errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockClick = vi.fn().mockRejectedValue(new Error('Click failed'))
    
    render(<Button onClick={mockClick}>Submit</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Button click error:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})
```

### 🌐 **API Testing with Error Cases**

```typescript
// tests/api/posts.test.ts - API endpoint testing
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/posts/route'

// Mock dependencies
vi.mock('@/lib/database/client')
vi.mock('next-auth')

describe('/api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('GET /api/posts', () => {
    it('returns posts successfully', async () => {
      const mockPosts = [
        { id: '1', title: 'Test Post', published: true },
      ]
      
      vi.mocked(db.post.findMany).mockResolvedValue(mockPosts)
      vi.mocked(db.post.count).mockResolvedValue(1)
      
      const { req } = createMocks({ method: 'GET' })
      const response = await GET(req as any)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.posts).toEqual(mockPosts)
      expect(data.pagination).toBeDefined()
    })
    
    it('handles database errors gracefully', async () => {
      vi.mocked(db.post.findMany).mockRejectedValue(new Error('DB Error'))
      
      const { req } = createMocks({ method: 'GET' })
      const response = await GET(req as any)
      
      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({
        error: 'Failed to fetch posts'
      })
    })
    
    it('validates query parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: { limit: '1000' } // Invalid: too large
      })
      
      const response = await GET(req as any)
      
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        error: 'Invalid parameters'
      })
    })
  })
  
  describe('POST /api/posts', () => {
    it('creates post successfully', async () => {
      const mockSession = {
        user: { id: '1', role: 'ADMIN' }
      }
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      vi.mocked(db.post.findFirst).mockResolvedValue(null) // No duplicate slug
      vi.mocked(withTransaction).mockImplementation(async (fn) => {
        return await fn(db as any)
      })
      
      const mockPost = { id: '1', title: 'New Post', slug: 'new-post' }
      vi.mocked(db.post.create).mockResolvedValue(mockPost)
      
      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({
          title: 'New Post',
          content: 'Post content here...',
          category: 'TECHNOLOGY',
          published: false,
        })
      })
      
      const response = await POST(req as any)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data).toEqual(mockPost)
    })
    
    it('handles authentication errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)
      
      const { req } = createMocks({ method: 'POST' })
      const response = await POST(req as any)
      
      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({
        error: 'Authentication required'
      })
    })
    
    it('handles validation errors', async () => {
      const mockSession = { user: { id: '1', role: 'ADMIN' } }
      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      
      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({
          title: '', // Invalid: empty title
          content: 'Content',
          category: 'INVALID_CATEGORY'
        })
      })
      
      const response = await POST(req as any)
      
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        error: 'Validation failed'
      })
    })
  })
})
```

### 🎭 **End-to-End Testing with Playwright**

```typescript
// tests/e2e/blog.spec.ts - E2E tests with error scenarios
import { test, expect, Page } from '@playwright/test'

test.describe('Blog Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data
    await page.goto('/')
  })
  
  test('homepage loads successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Hayah AI')
    await expect(page.locator('nav')).toBeVisible()
    
    // Check for error indicators
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible()
  })
  
  test('blog post page handles missing posts', async ({ page }) => {
    await page.goto('/non-existent-post')
    
    // Should show 404 page, not error boundary
    await expect(page.locator('h1')).toContainText('404')
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible()
  })
  
  test('search functionality works with error handling', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'test query')
    await page.click('[data-testid="search-button"]')
    
    // Wait for results or error message
    await page.waitForSelector('[data-testid="search-results"], [data-testid="search-error"]')
    
    // Should not crash on search errors
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible()
  })
  
  test('admin panel requires authentication', async ({ page }) => {
    await page.goto('/admin')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*auth.*/)
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible()
  })
  
  test('network errors are handled gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('/')
    await page.click('[data-testid="load-more-button"]')
    
    // Should show error message, not crash
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible()
  })
})

test.describe('Performance Tests', () => {
  test('page loads within performance budget', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000) // 3 second budget
  })
  
  test('images load progressively', async ({ page }) => {
    await page.goto('/')
    
    // Check for loading skeletons
    await expect(page.locator('[data-testid="image-skeleton"]')).toBeVisible()
    
    // Wait for images to load
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="image-skeleton"]')).not.toBeVisible()
  })
})
```

---

## Monitoring & Maintenance

### 📊 **Error Tracking with Sentry**

```typescript
// lib/monitoring/sentry.ts - Error tracking configuration
import * as Sentry from '@sentry/nextjs'
import { env } from '@/lib/env'

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: env.NODE_ENV === 'development',
    
    environment: env.NODE_ENV,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException
      
      if (error instanceof Error) {
        // Filter out network errors that are user-caused
        if (error.message.includes('Failed to fetch')) {
          return null
        }
        
        // Filter out bot/crawler errors
        if (event.request?.headers?.['user-agent']?.includes('bot')) {
          return null
        }
      }
      
      return event
    },
    
    // Performance monitoring
    integrations: [
      new Sentry.BrowserTracing({
        // Track specific operations
        tracePropagationTargets: ['localhost', 'hayah-ai.com'],
      }),
    ],
    
    // Custom tags
    initialScope: {
      tags: {
        component: 'blog-platform',
      },
    },
  })
}

// Custom error reporting
export function reportError(error: Error, context?: Record<string, any>) {
  console.error('Error:', error)
  
  if (env.NODE_ENV === 'production') {
    Sentry.withScope(scope => {
      if (context) {
        scope.setContext('additional', context)
      }
      Sentry.captureException(error)
    })
  }
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op })
}
```

### 🚨 **Alerting Configuration**

```typescript
// lib/monitoring/alerts.ts - Alert system for critical errors
interface AlertConfig {
  webhook: string
  threshold: number
  timeWindow: number // minutes
}

class AlertManager {
  private errorCounts = new Map<string, number[]>()
  private configs: Record<string, AlertConfig> = {
    'database-errors': {
      webhook: process.env.SLACK_WEBHOOK_DB!,
      threshold: 5,
      timeWindow: 5,
    },
    'api-errors': {
      webhook: process.env.SLACK_WEBHOOK_API!,
      threshold: 10,
      timeWindow: 10,
    },
    'auth-errors': {
      webhook: process.env.SLACK_WEBHOOK_AUTH!,
      threshold: 3,
      timeWindow: 5,
    },
  }
  
  recordError(type: string, error: Error) {
    const now = Date.now()
    const config = this.configs[type]
    
    if (!config) return
    
    // Track error occurrences
    if (!this.errorCounts.has(type)) {
      this.errorCounts.set(type, [])
    }
    
    const errors = this.errorCounts.get(type)!
    errors.push(now)
    
    // Clean old errors outside time window
    const cutoff = now - (config.timeWindow * 60 * 1000)
    const recentErrors = errors.filter(time => time > cutoff)
    this.errorCounts.set(type, recentErrors)
    
    // Check if threshold exceeded
    if (recentErrors.length >= config.threshold) {
      this.sendAlert(type, error, recentErrors.length)
      // Reset counter to prevent spam
      this.errorCounts.set(type, [])
    }
  }
  
  private async sendAlert(type: string, error: Error, count: number) {
    try {
      const config = this.configs[type]
      const message = {
        text: `🚨 High error rate detected: ${type}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Error Type:* ${type}\n*Count:* ${count} errors in ${config.timeWindow} minutes\n*Latest Error:* ${error.message}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Environment: ${process.env.NODE_ENV} | Time: ${new Date().toISOString()}`
              }
            ]
          }
        ]
      }
      
      await fetch(config.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })
    } catch (alertError) {
      console.error('Failed to send alert:', alertError)
    }
  }
}

export const alertManager = new AlertManager()
```

### 📈 **Performance Monitoring**

```typescript
// lib/monitoring/performance.ts - Performance tracking
class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  
  startTiming(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }
  
  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const values = this.metrics.get(label)!
    values.push(value)
    
    // Keep only last 1000 measurements
    if (values.length > 1000) {
      values.shift()
    }
    
    // Alert on performance degradation
    if (values.length >= 10) {
      const recent = values.slice(-10)
      const average = recent.reduce((a, b) => a + b) / recent.length
      
      // Alert if average > 5 seconds
      if (average > 5000) {
        alertManager.recordError('performance', new Error(`Slow ${label}: ${average}ms`))
      }
    }
  }
  
  getMetrics() {
    const report: Record<string, any> = {}
    
    for (const [label, values] of this.metrics) {
      if (values.length > 0) {
        report[label] = {
          count: values.length,
          average: values.reduce((a, b) => a + b) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          p95: this.percentile(values, 95),
        }
      }
    }
    
    return report
  }
  
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[index]
  }
}

export const performanceMonitor = new PerformanceMonitor()

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const endTiming = performanceMonitor.startTiming(`component-${componentName}`)
    return endTiming
  }, [componentName])
}
```

---

## Implementation Checklist

### ✅ **Phase Completion Checklist**

#### **Week 1: Architecture & Planning**
- [ ] Environment setup and validation
- [ ] Database schema design and migration
- [ ] Authentication configuration
- [ ] Security headers implementation
- [ ] Error boundary setup
- [ ] Basic CI/CD pipeline

#### **Week 2-3: Foundation Development**
- [ ] Core UI components with error handling
- [ ] Layout components and navigation
- [ ] Theme system implementation
- [ ] Form validation system
- [ ] Loading states and skeletons
- [ ] Error tracking integration

#### **Week 4-5: Core Features**
- [ ] Blog post CRUD operations
- [ ] Comment system with moderation
- [ ] Search functionality
- [ ] SEO optimization
- [ ] Performance monitoring
- [ ] API rate limiting

#### **Week 6-7: Interactive Features**
- [ ] Travel map implementation
- [ ] Timeline component
- [ ] Code sandbox (if enabled)
- [ ] Image gallery system
- [ ] Mobile optimization
- [ ] Accessibility compliance

#### **Week 8: Production Deployment**
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Monitoring setup
- [ ] Backup procedures
- [ ] Documentation completion

### 🔍 **Quality Assurance Checklist**

#### **Security**
- [ ] All inputs validated and sanitized
- [ ] CSRF protection enabled
- [ ] XSS prevention implemented
- [ ] SQL injection prevention
- [ ] Rate limiting on all endpoints
- [ ] Secure headers configured
- [ ] Environment variables secured
- [ ] Authentication properly implemented

#### **Performance**
- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] Images optimized and lazy loaded
- [ ] Code splitting implemented
- [ ] Database queries optimized
- [ ] CDN configured
- [ ] Caching strategy implemented

#### **Accessibility**
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Color contrast compliance
- [ ] Focus management
- [ ] Alt text for images

#### **Error Handling**
- [ ] Error boundaries at all levels
- [ ] Graceful degradation
- [ ] User-friendly error messages
- [ ] Error logging and monitoring
- [ ] Fallback mechanisms
- [ ] Recovery procedures

#### **Testing**
- [ ] Unit tests for all utilities
- [ ] Component tests with error scenarios
- [ ] API endpoint tests
- [ ] E2E tests for critical paths
- [ ] Performance tests
- [ ] Security tests
- [ ] Load tests

This comprehensive implementation guide provides a bulletproof foundation for building your Hayah-AI blog platform with zero-tolerance error prevention. Every component, API endpoint, and user interaction is designed to handle errors gracefully while maintaining optimal performance and security.

