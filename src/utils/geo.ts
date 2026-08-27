import * as THREE from 'three';
import { ConnectionIntent, OrbLocation, UserProfile } from '../types';

/**
 * Convert latitude and longitude to 3D Cartesian Vector3 on sphere of given radius.
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Generate 3D Great-Circle Arc Curve with altitude elevation for connection trajectory.
 */
export function createGreatCircleArc(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  numPoints: number = 40
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const distance = start.distanceTo(end);
  
  // Elevation height scales with distance across globe (subtle, non-distracting)
  const maxAltitude = Math.min(0.35, Math.max(0.08, (distance / (radius * 2)) * 0.45));

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    
    // Spherical linear interpolation between start & end
    const p = new THREE.Vector3().lerpVectors(start, end, t);
    const length = p.length();
    
    // Smooth parabolic altitude curve: sin(t * PI)
    const altitude = Math.sin(t * Math.PI) * maxAltitude * radius;
    
    // Normalize to surface and extend by altitude
    p.normalize().multiplyScalar(radius + altitude);
    points.push(p);
  }

  return points;
}

/**
 * Generate a procedural high-resolution monochrome Earth texture on HTML Canvas.
 * Provides crisp dark minimalist continents, subtle grid coordinates, and delicate aesthetic.
 */
export function generateEarthCanvasTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    return fallback;
  }

  // Deep space / ocean base: #0E0E10
  ctx.fillStyle = '#0E0E11';
  ctx.fillRect(0, 0, width, height);

  // Subtle lat/long coordinate grid
  ctx.strokeStyle = 'rgba(245, 245, 240, 0.04)';
  ctx.lineWidth = 1;

  // Latitude lines (parallels)
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Longitude lines (meridians)
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Helper to draw continent polygons from lat/lng paths
  const drawLand = (coords: [number, number][], fillStyle = '#1C1C20', strokeStyle = 'rgba(245, 245, 240, 0.12)') => {
    if (coords.length < 3) return;
    ctx.beginPath();
    coords.forEach(([lat, lng], idx) => {
      const x = ((lng + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  };

  // Simplified high-aesthetic continent geometries [lat, lng]
  
  // North America
  drawLand([
    [70, -165], [72, -130], [68, -90], [60, -65], [50, -55], [45, -65],
    [40, -74], [30, -80], [25, -80], [20, -87], [16, -95], [18, -105],
    [32, -117], [38, -123], [48, -124], [58, -136], [60, -145], [65, -168]
  ]);

  // South America
  drawLand([
    [12, -72], [10, -62], [5, -52], [-2, -44], [-8, -35], [-18, -38],
    [-23, -43], [-34, -53], [-42, -64], [-54, -68], [-52, -75], [-38, -73],
    [-24, -70], [-15, -75], [-4, -80], [8, -77]
  ]);

  // Europe & Scandinavia
  drawLand([
    [71, 28], [65, 24], [60, 11], [54, 9], [51, 2], [43, -4], [36, -6],
    [36, -2], [37, 15], [36, 28], [42, 28], [45, 36], [50, 40], [55, 38],
    [60, 30], [65, 30], [70, 20]
  ]);

  // British Isles
  drawLand([
    [58, -5], [58, -2], [52, 1], [50, -5], [54, -4], [55, -6]
  ]);
  drawLand([
    [55, -7], [53, -6], [51, -10], [54, -10]
  ]);

  // Africa
  drawLand([
    [36, -5], [37, 10], [32, 25], [31, 32], [22, 38], [12, 43], [12, 51],
    [-4, 40], [-12, 40], [-26, 33], [-34, 18], [-33, 26], [-22, 14],
    [-5, 12], [4, 9], [5, 1], [5, -4], [10, -14], [15, -17], [22, -16],
    [28, -13], [35, -6]
  ]);

  // Asia & India & Middle East
  drawLand([
    [75, 100], [72, 140], [66, 170], [60, 160], [50, 140], [42, 130],
    [38, 120], [30, 122], [22, 114], [22, 108], [10, 105], [2, 103],
    [15, 100], [22, 90], [22, 88], [13, 80], [8, 77], [18, 73], [24, 68],
    [25, 60], [25, 55], [15, 45], [28, 48], [30, 35], [36, 36], [40, 48],
    [48, 55], [55, 60], [65, 60], [72, 70]
  ]);

  // Japan
  drawLand([
    [45, 142], [42, 144], [35, 140], [33, 133], [35, 136], [40, 140]
  ]);

  // Australia & New Zealand
  drawLand([
    [-12, 136], [-15, 145], [-25, 153], [-34, 151], [-38, 145], [-35, 117],
    [-22, 114], [-15, 125], [-12, 130]
  ]);
  drawLand([
    [-35, 174], [-41, 175], [-46, 168], [-44, 171], [-37, 175]
  ]);

  // Greenland
  drawLand([
    [83, -30], [78, -20], [70, -25], [60, -45], [65, -53], [76, -60], [82, -45]
  ]);

  // Fine stippled dot matrix overlay on landmasses for high-tech editorial craft
  ctx.fillStyle = 'rgba(212, 255, 63, 0.12)';
  for (let lat = -60; lat <= 70; lat += 6) {
    for (let lng = -180; lng <= 180; lng += 8) {
      const x = ((lng + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      
      // Sample if inside land pixels
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      // If land is drawn (red component > 15)
      if (pixel[0] > 18) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Get distinct glow color / style for connection intent (subtle and restrained).
 */
export function getIntentVisual(intent?: ConnectionIntent) {
  switch (intent) {
    case 'Build Together':
      return { color: '#D4FF3F', hex: 0xd4ff3f, label: 'Build' };
    case 'Exchange Ideas':
      return { color: '#F5F5F0', hex: 0xf5f5f0, label: 'Ideas' };
    case 'Collaborate':
      return { color: '#C8FF66', hex: 0xc8ff66, label: 'Collab' };
    case 'Learn Together':
      return { color: '#E0E0DB', hex: 0xe0e0db, label: 'Learn' };
    case 'Find a Co-founder':
      return { color: '#D4FF3F', hex: 0xd4ff3f, label: 'Founder' };
    case 'Find a Mentor':
      return { color: '#F0F0EA', hex: 0xf0f0ea, label: 'Mentor' };
    case 'Just Talk':
    default:
      return { color: '#969696', hex: 0x969696, label: 'Talk' };
  }
}

/**
 * Known global tech & cultural hub coordinates for reliable geocoding of user profile locations
 */
const KNOWN_COORDINATES: Record<string, { lat: number; lng: number; city: string; country: string }> = {
  // India
  chennai: { lat: 13.0827, lng: 80.2707, city: 'Chennai', country: 'India' },
  bengaluru: { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', country: 'India' },
  bangalore: { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', country: 'India' },
  mumbai: { lat: 19.0760, lng: 72.8777, city: 'Mumbai', country: 'India' },
  delhi: { lat: 28.6139, lng: 77.2090, city: 'New Delhi', country: 'India' },
  newdelhi: { lat: 28.6139, lng: 77.2090, city: 'New Delhi', country: 'India' },
  hyderabad: { lat: 17.3850, lng: 78.4867, city: 'Hyderabad', country: 'India' },
  pune: { lat: 18.5204, lng: 73.8567, city: 'Pune', country: 'India' },
  kolkata: { lat: 22.5726, lng: 88.3639, city: 'Kolkata', country: 'India' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad', country: 'India' },
  jaipur: { lat: 26.9124, lng: 75.7873, city: 'Jaipur', country: 'India' },
  kochi: { lat: 9.9312, lng: 76.2673, city: 'Kochi', country: 'India' },
  cochin: { lat: 9.9312, lng: 76.2673, city: 'Kochi', country: 'India' },
  goa: { lat: 15.2993, lng: 74.1240, city: 'Goa', country: 'India' },
  chandigarh: { lat: 30.7333, lng: 76.7794, city: 'Chandigarh', country: 'India' },
  india: { lat: 20.5937, lng: 78.9629, city: 'India', country: 'India' },

  // Americas
  sanfrancisco: { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA' },
  sf: { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA' },
  bayarea: { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA' },
  california: { lat: 36.7783, lng: -119.4179, city: 'California', country: 'USA' },
  newyork: { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA' },
  nyc: { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA' },
  brooklyn: { lat: 40.6782, lng: -73.9442, city: 'Brooklyn', country: 'USA' },
  seattle: { lat: 47.6062, lng: -122.3321, city: 'Seattle', country: 'USA' },
  austin: { lat: 30.2672, lng: -97.7431, city: 'Austin', country: 'USA' },
  boston: { lat: 42.3601, lng: -71.0589, city: 'Boston', country: 'USA' },
  cambridge: { lat: 42.3736, lng: -71.1097, city: 'Cambridge', country: 'USA' },
  chicago: { lat: 41.8781, lng: -87.6298, city: 'Chicago', country: 'USA' },
  losangeles: { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', country: 'USA' },
  la: { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', country: 'USA' },
  sandiego: { lat: 32.7157, lng: -117.1611, city: 'San Diego', country: 'USA' },
  portland: { lat: 45.5152, lng: -122.6784, city: 'Portland', country: 'USA' },
  denver: { lat: 39.7392, lng: -104.9903, city: 'Denver', country: 'USA' },
  toronto: { lat: 43.6532, lng: -79.3832, city: 'Toronto', country: 'Canada' },
  vancouver: { lat: 49.2827, lng: -123.1207, city: 'Vancouver', country: 'Canada' },
  montreal: { lat: 45.5017, lng: -73.5673, city: 'Montreal', country: 'Canada' },
  canada: { lat: 45.4215, lng: -75.6972, city: 'Ottawa', country: 'Canada' },
  mexicocity: { lat: 19.4326, lng: -99.1332, city: 'Mexico City', country: 'Mexico' },
  mexico: { lat: 19.4326, lng: -99.1332, city: 'Mexico City', country: 'Mexico' },
  saopaulo: { lat: -23.5505, lng: -46.6333, city: 'São Paulo', country: 'Brazil' },
  brazil: { lat: -15.7975, lng: -47.8919, city: 'Brasília', country: 'Brazil' },
  buenosaires: { lat: -34.6037, lng: -58.3816, city: 'Buenos Aires', country: 'Argentina' },
  argentina: { lat: -34.6037, lng: -58.3816, city: 'Buenos Aires', country: 'Argentina' },
  santiago: { lat: -33.4489, lng: -70.6693, city: 'Santiago', country: 'Chile' },
  bogota: { lat: 4.7110, lng: -74.0721, city: 'Bogotá', country: 'Colombia' },
  usa: { lat: 37.0902, lng: -95.7129, city: 'United States', country: 'USA' },

  // Europe
  london: { lat: 51.5074, lng: -0.1278, city: 'London', country: 'United Kingdom' },
  uk: { lat: 51.5074, lng: -0.1278, city: 'London', country: 'United Kingdom' },
  oxford: { lat: 51.7520, lng: -1.2577, city: 'Oxford', country: 'United Kingdom' },
  edinburgh: { lat: 55.9533, lng: -3.1883, city: 'Edinburgh', country: 'United Kingdom' },
  berlin: { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany' },
  germany: { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany' },
  munich: { lat: 48.1351, lng: 11.5820, city: 'Munich', country: 'Germany' },
  frankfurt: { lat: 50.1109, lng: 8.6821, city: 'Frankfurt', country: 'Germany' },
  paris: { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France' },
  france: { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France' },
  amsterdam: { lat: 52.3676, lng: 4.9041, city: 'Amsterdam', country: 'Netherlands' },
  netherlands: { lat: 52.3676, lng: 4.9041, city: 'Amsterdam', country: 'Netherlands' },
  stockholm: { lat: 59.3293, lng: 18.0686, city: 'Stockholm', country: 'Sweden' },
  sweden: { lat: 59.3293, lng: 18.0686, city: 'Stockholm', country: 'Sweden' },
  zurich: { lat: 47.3769, lng: 8.5417, city: 'Zurich', country: 'Switzerland' },
  switzerland: { lat: 46.9480, lng: 7.4474, city: 'Bern', country: 'Switzerland' },
  geneva: { lat: 46.2044, lng: 6.1432, city: 'Geneva', country: 'Switzerland' },
  dublin: { lat: 53.3498, lng: -6.2603, city: 'Dublin', country: 'Ireland' },
  ireland: { lat: 53.3498, lng: -6.2603, city: 'Dublin', country: 'Ireland' },
  copenhagen: { lat: 55.6761, lng: 12.5683, city: 'Copenhagen', country: 'Denmark' },
  denmark: { lat: 55.6761, lng: 12.5683, city: 'Copenhagen', country: 'Denmark' },
  helsinki: { lat: 60.1699, lng: 24.9384, city: 'Helsinki', country: 'Finland' },
  finland: { lat: 60.1699, lng: 24.9384, city: 'Helsinki', country: 'Finland' },
  oslo: { lat: 59.9139, lng: 10.7522, city: 'Oslo', country: 'Norway' },
  norway: { lat: 59.9139, lng: 10.7522, city: 'Oslo', country: 'Norway' },
  vienna: { lat: 48.2082, lng: 16.3738, city: 'Vienna', country: 'Austria' },
  madrid: { lat: 40.4168, lng: -3.7038, city: 'Madrid', country: 'Spain' },
  barcelona: { lat: 41.3879, lng: 2.1699, city: 'Barcelona', country: 'Spain' },
  spain: { lat: 40.4168, lng: -3.7038, city: 'Madrid', country: 'Spain' },
  milan: { lat: 45.4642, lng: 9.1900, city: 'Milan', country: 'Italy' },
  rome: { lat: 41.9028, lng: 12.4964, city: 'Rome', country: 'Italy' },
  italy: { lat: 41.9028, lng: 12.4964, city: 'Rome', country: 'Italy' },
  lisbon: { lat: 38.7223, lng: -9.1393, city: 'Lisbon', country: 'Portugal' },
  portugal: { lat: 38.7223, lng: -9.1393, city: 'Lisbon', country: 'Portugal' },
  warsaw: { lat: 52.2297, lng: 21.0122, city: 'Warsaw', country: 'Poland' },
  poland: { lat: 52.2297, lng: 21.0122, city: 'Warsaw', country: 'Poland' },
  prague: { lat: 50.0755, lng: 14.4378, city: 'Prague', country: 'Czech Republic' },
  tallinn: { lat: 59.4370, lng: 24.7535, city: 'Tallinn', country: 'Estonia' },
  athens: { lat: 37.9838, lng: 23.7275, city: 'Athens', country: 'Greece' },

  // Asia & Pacific
  tokyo: { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan' },
  kyoto: { lat: 35.0116, lng: 135.7681, city: 'Kyoto', country: 'Japan' },
  japan: { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan' },
  singapore: { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore' },
  seoul: { lat: 37.5665, lng: 126.9780, city: 'Seoul', country: 'South Korea' },
  korea: { lat: 37.5665, lng: 126.9780, city: 'Seoul', country: 'South Korea' },
  taipei: { lat: 25.0330, lng: 121.5654, city: 'Taipei', country: 'Taiwan' },
  taiwan: { lat: 25.0330, lng: 121.5654, city: 'Taipei', country: 'Taiwan' },
  hongkong: { lat: 22.3193, lng: 114.1694, city: 'Hong Kong', country: 'Hong Kong' },
  sydney: { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia' },
  melbourne: { lat: -37.8136, lng: 144.9631, city: 'Melbourne', country: 'Australia' },
  australia: { lat: -25.2744, lng: 133.7751, city: 'Canberra', country: 'Australia' },
  auckland: { lat: -36.8485, lng: 174.7633, city: 'Auckland', country: 'New Zealand' },
  newzealand: { lat: -41.2865, lng: 174.7762, city: 'Wellington', country: 'New Zealand' },
  bangkok: { lat: 13.7563, lng: 100.5018, city: 'Bangkok', country: 'Thailand' },
  thailand: { lat: 13.7563, lng: 100.5018, city: 'Bangkok', country: 'Thailand' },
  jakarta: { lat: -6.2088, lng: 106.8456, city: 'Jakarta', country: 'Indonesia' },
  manila: { lat: 14.5995, lng: 120.9842, city: 'Manila', country: 'Philippines' },
  dubai: { lat: 25.2048, lng: 55.2708, city: 'Dubai', country: 'UAE' },
  uae: { lat: 25.2048, lng: 55.2708, city: 'Dubai', country: 'UAE' },
  telaviv: { lat: 32.0853, lng: 34.7818, city: 'Tel Aviv', country: 'Israel' },
  doha: { lat: 25.2854, lng: 51.5310, city: 'Doha', country: 'Qatar' },
  riyadh: { lat: 24.7136, lng: 46.6753, city: 'Riyadh', country: 'Saudi Arabia' },

  // Africa
  lagos: { lat: 6.5244, lng: 3.3792, city: 'Lagos', country: 'Nigeria' },
  nigeria: { lat: 9.0820, lng: 8.6753, city: 'Abuja', country: 'Nigeria' },
  nairobi: { lat: -1.2921, lng: 36.8219, city: 'Nairobi', country: 'Kenya' },
  kenya: { lat: -1.2921, lng: 36.8219, city: 'Nairobi', country: 'Kenya' },
  capetown: { lat: -33.9249, lng: 18.4241, city: 'Cape Town', country: 'South Africa' },
  johannesburg: { lat: -26.2041, lng: 28.0473, city: 'Johannesburg', country: 'South Africa' },
  southafrica: { lat: -30.5595, lng: 22.9375, city: 'Cape Town', country: 'South Africa' },
  cairo: { lat: 30.0444, lng: 31.2357, city: 'Cairo', country: 'Egypt' },
  accra: { lat: 5.6037, lng: -0.1870, city: 'Accra', country: 'Ghana' },
  kigali: { lat: -1.9706, lng: 30.1044, city: 'Kigali', country: 'Rwanda' },
};

/**
 * Intelligently resolve coordinates, city, and country from a location string or explicit lat/lng.
 * Falls back deterministically if location is unspecified or unknown.
 */
export function resolveLocationCoordinates(
  locationStr?: string,
  explicitLat?: number,
  explicitLng?: number,
  fallbackSeed: string = 'misfit'
): { lat: number; lng: number; city: string; country: string } {
  // If explicit lat/lng provided, use them directly
  if (
    typeof explicitLat === 'number' &&
    !isNaN(explicitLat) &&
    typeof explicitLng === 'number' &&
    !isNaN(explicitLng) &&
    (explicitLat !== 0 || explicitLng !== 0)
  ) {
    const rawLoc = (locationStr || '').trim();
    const parts = rawLoc.split(',').map((p) => p.trim());
    return {
      lat: explicitLat,
      lng: explicitLng,
      city: parts[0] || 'Worldwide',
      country: parts[1] || 'Global',
    };
  }

  const clean = (locationStr || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Look for direct key or sub-key match in dictionary
  if (clean) {
    for (const [key, data] of Object.entries(KNOWN_COORDINATES)) {
      if (clean.includes(key) || key.includes(clean)) {
        return { ...data };
      }
    }
  }

  // Parse "City, Country" from original string
  const rawLoc = (locationStr || '').trim();
  if (rawLoc && rawLoc.toLowerCase() !== 'worldwide') {
    const parts = rawLoc.split(',').map((p) => p.trim());
    const city = parts[0] || 'Worldwide';
    const country = parts[1] || 'Global';

    // Hash fallback seed + location to get a consistent position across landmasses
    let hash = 0;
    const str = `${rawLoc}_${fallbackSeed}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const pseudoLat = 15 + (Math.abs(hash) % 45); // Latitudes 15° to 60°
    const pseudoLng = -120 + (Math.abs(hash >> 3) % 240); // Longitudes -120° to 120°

    return {
      lat: pseudoLat,
      lng: pseudoLng,
      city,
      country,
    };
  }

  // Default fallback
  return {
    lat: 13.0827,
    lng: 80.2707,
    city: 'Chennai',
    country: 'India',
  };
}
