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
