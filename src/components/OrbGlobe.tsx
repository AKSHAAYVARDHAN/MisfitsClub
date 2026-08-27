import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { UserProfile, ConnectionIntent, OrbLocation } from '../types';
import { latLngToVector3, createGreatCircleArc, generateEarthCanvasTexture, getIntentVisual } from '../utils/geo';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface OrbGlobeRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetToHome: () => void;
}

export interface OrbGlobeProps {
  userLocation: { lat: number; lng: number; name: string; city: string };
  connections: OrbLocation[];
  selectedLocation: OrbLocation | null;
  onSelectLocation: (loc: OrbLocation | null) => void;
  activeIntentFilter: ConnectionIntent | 'All';
  showLines?: boolean;
  autoRotate?: boolean;
  emptyState?: boolean;
  showRecenterButton?: boolean;
  initialDistance?: number;
  className?: string;
  onHoverLocation?: (loc: OrbLocation | null, screenPos?: { x: number; y: number }) => void;
  onUserInteraction?: () => void;
}

export const OrbGlobe = forwardRef<OrbGlobeRef, OrbGlobeProps>(({
  userLocation,
  connections,
  selectedLocation,
  onSelectLocation,
  activeIntentFilter,
  showLines = true,
  autoRotate = true,
  emptyState = false,
  showRecenterButton = true,
  initialDistance = 7.2,
  className = '',
  onHoverLocation,
  onUserInteraction,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    globeGroup: THREE.Group;
    earthMesh: THREE.Mesh;
    linesGroup: THREE.Group;
    markersGroup: THREE.Group;
    userMarkerGroup: THREE.Group;
    glowMesh: THREE.Mesh;
    animId: number | null;
    isDragging: boolean;
    prevMousePos: { x: number; y: number };
    rotationVelocity: { x: number; y: number };
    targetRotation: { x: number; y: number } | null;
    cameraTargetDistance: number;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    interactiveObjects: { mesh: THREE.Object3D; data: OrbLocation }[];
    userMesh: THREE.Object3D | null;
    hoveredMesh: THREE.Object3D | null;
  } | null>(null);

  const [isInteracting, setIsInteracting] = useState(false);
  const [touchDistance, setTouchDistance] = useState<number | null>(null);

  const GLOBE_RADIUS = 2.2;

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0B0B0C);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, initialDistance);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Groups
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const linesGroup = new THREE.Group();
    const markersGroup = new THREE.Group();
    const userMarkerGroup = new THREE.Group();
    globeGroup.add(linesGroup);
    globeGroup.add(markersGroup);
    globeGroup.add(userMarkerGroup);

    // Earth Sphere Geometry & Canvas Texture
    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthTexture = generateEarthCanvasTexture();
    
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.88,
      metalness: 0.12,
      bumpScale: 0.05,
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Subtle atmospheric glow shell
    const glowGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 48, 48);
    const glowMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.83, 1.0, 0.25, intensity * 0.45);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    globeGroup.add(glowMesh);

    // Outer subtle mist glow
    const outerGlowGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.12, 32, 32);
    const outerGlowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          gl_FragColor = vec4(0.95, 0.95, 0.92, intensity * 0.22);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const outerGlowMesh = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    globeGroup.add(outerGlowMesh);

    // Subtle Equator & Meridian Wireframe Rings
    const ringGeo = new THREE.RingGeometry(GLOBE_RADIUS * 1.002, GLOBE_RADIUS * 1.004, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xF5F5F0,
      opacity: 0.05,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const equator = new THREE.Mesh(ringGeo, ringMat);
    equator.rotation.x = Math.PI / 2;
    globeGroup.add(equator);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x222228, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xF5F5F0, 1.8);
    dirLight1.position.set(4, 3, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xD4FF3F, 0.8);
    dirLight2.position.set(-5, -2, -3);
    scene.add(dirLight2);

    // Set initial rotation so user location (Chennai, India: lat 13, lng 80) is facing forward
    const initialPhi = (90 - userLocation.lat) * (Math.PI / 180);
    const initialTheta = (userLocation.lng + 180) * (Math.PI / 180);
    globeGroup.rotation.y = -initialTheta + Math.PI / 2 + 0.3;
    globeGroup.rotation.x = (initialPhi - Math.PI / 2) * 0.5;

    threeRef.current = {
      scene,
      camera,
      renderer,
      globeGroup,
      earthMesh,
      linesGroup,
      markersGroup,
      userMarkerGroup,
      glowMesh,
      animId: null,
      isDragging: false,
      prevMousePos: { x: 0, y: 0 },
      rotationVelocity: { x: 0, y: 0.0015 },
      targetRotation: null,
      cameraTargetDistance: initialDistance,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(-100, -100),
      interactiveObjects: [],
      userMesh: null,
      hoveredMesh: null,
    };

    // Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const state = threeRef.current;
      if (!state) return;

      // Handle Target Rotation Slerp / Lerp if navigating to connection
      if (state.targetRotation) {
        state.globeGroup.rotation.y += (state.targetRotation.y - state.globeGroup.rotation.y) * 0.08;
        state.globeGroup.rotation.x += (state.targetRotation.x - state.globeGroup.rotation.x) * 0.08;

        if (
          Math.abs(state.targetRotation.y - state.globeGroup.rotation.y) < 0.002 &&
          Math.abs(state.targetRotation.x - state.globeGroup.rotation.x) < 0.002
        ) {
          state.targetRotation = null;
        }
      } else {
        // Apply inertia & auto-rotation
        if (!state.isDragging) {
          if (autoRotate) {
            state.globeGroup.rotation.y += (state.rotationVelocity.y + 0.0012);
          } else {
            state.globeGroup.rotation.y += state.rotationVelocity.y;
          }
          state.globeGroup.rotation.x += state.rotationVelocity.x;

          // Velocity Damping
          state.rotationVelocity.x *= 0.94;
          state.rotationVelocity.y *= 0.94;

          // Clamp X tilt
          state.globeGroup.rotation.x = Math.max(-0.8, Math.min(0.8, state.globeGroup.rotation.x));
        }
      }

      // Smooth Camera Zoom Distance
      state.camera.position.z += (state.cameraTargetDistance - state.camera.position.z) * 0.1;

      // Animated beacon pulse for markers
      const pulse = Math.sin(time * 0.0035) * 0.5 + 0.5;
      const pulseFast = Math.sin(time * 0.006) * 0.5 + 0.5;

      state.markersGroup.children.forEach((child) => {
        if (child.userData?.isBeaconRing) {
          const scale = 1 + pulse * 0.45;
          child.scale.set(scale, scale, scale);
          if ((child as THREE.Mesh).material) {
            ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.8 - pulse * 0.6;
          }
        }
      });

      if (state.userMarkerGroup.children.length > 0) {
        state.userMarkerGroup.children.forEach((child) => {
          if (child.userData?.isUserPulse) {
            const scale = 1 + pulseFast * 0.7;
            child.scale.set(scale, scale, scale);
            if ((child as THREE.Mesh).material) {
              ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 - pulseFast * 0.7;
            }
          }
        });
      }

      // Animated dash progression on connection lines
      state.linesGroup.children.forEach((line) => {
        const mat = (line as THREE.Line).material as THREE.LineDashedMaterial;
        if (mat && mat.dashSize !== undefined) {
          // Pulse the opacity subtly
          mat.opacity = 0.35 + Math.sin(time * 0.002 + (line.id % 5)) * 0.18;
        }
      });

      state.renderer.render(state.scene, state.camera);
      state.animId = requestAnimationFrame(animate);
    };

    if (threeRef.current) {
      threeRef.current.animId = requestAnimationFrame(animate);
    }

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      threeRef.current.camera.aspect = newWidth / newHeight;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    return () => {
      if (threeRef.current?.animId) {
        cancelAnimationFrame(threeRef.current.animId);
      }
      resizeObserver.disconnect();
      renderer.dispose();
      earthTexture.dispose();
      earthGeometry.dispose();
      glowGeometry.dispose();
      outerGlowGeo.dispose();
    };
  }, [autoRotate, userLocation.lat, userLocation.lng]);

  // Update Markers & Connection Lines when data/filters change
  useEffect(() => {
    const state = threeRef.current;
    if (!state) return;

    // Clear previous dynamic groups
    while (state.markersGroup.children.length > 0) {
      const obj = state.markersGroup.children[0];
      state.markersGroup.remove(obj);
    }
    while (state.linesGroup.children.length > 0) {
      const obj = state.linesGroup.children[0];
      state.linesGroup.remove(obj);
    }
    while (state.userMarkerGroup.children.length > 0) {
      const obj = state.userMarkerGroup.children[0];
      state.userMarkerGroup.remove(obj);
    }

    state.interactiveObjects = [];

    // 1. User Home Node (YOU)
    const userVec = latLngToVector3(userLocation.lat, userLocation.lng, GLOBE_RADIUS);
    const userNormal = userVec.clone().normalize();

    // User center point (Bright Lime #D4FF3F)
    const userPointGeo = new THREE.SphereGeometry(0.042, 16, 16);
    const userPointMat = new THREE.MeshBasicMaterial({ color: 0xD4FF3F });
    const userPointMesh = new THREE.Mesh(userPointGeo, userPointMat);
    userPointMesh.position.copy(userVec.clone().add(userNormal.clone().multiplyScalar(0.01)));
    state.userMarkerGroup.add(userPointMesh);

    // User pulsing waves
    const userRingGeo = new THREE.RingGeometry(0.05, 0.09, 32);
    const userRingMat = new THREE.MeshBasicMaterial({
      color: 0xD4FF3F,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const userRingMesh = new THREE.Mesh(userRingGeo, userRingMat);
    userRingMesh.position.copy(userVec.clone().add(userNormal.clone().multiplyScalar(0.015)));
    userRingMesh.lookAt(userVec.clone().add(userNormal));
    userRingMesh.userData = { isUserPulse: true };
    state.userMarkerGroup.add(userRingMesh);

    // User Interactive Target
    const userHitGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const userHitMat = new THREE.MeshBasicMaterial({ visible: false });
    const userHitMesh = new THREE.Mesh(userHitGeo, userHitMat);
    userHitMesh.position.copy(userVec);
    const userLocationData: OrbLocation = {
      id: 'you',
      name: userLocation.name,
      city: userLocation.city,
      country: 'India',
      lat: userLocation.lat,
      lng: userLocation.lng,
      isUser: true,
    };
    userHitMesh.userData = { data: userLocationData };
    state.userMarkerGroup.add(userHitMesh);
    state.interactiveObjects.push({ mesh: userHitMesh, data: userLocationData });

    if (emptyState) {
      return;
    }

    // Filter connections based on active intent tab
    const filteredConnections = connections.filter((conn) => {
      if (activeIntentFilter === 'All') return true;
      return conn.intents?.includes(activeIntentFilter);
    });

    // 2. Render Connection Nodes & Curved Arcs
    filteredConnections.forEach((conn) => {
      const connVec = latLngToVector3(conn.lat, conn.lng, GLOBE_RADIUS);
      const connNormal = connVec.clone().normalize();
      const visual = getIntentVisual(conn.intents?.[0]);

      const isSelected = selectedLocation?.id === conn.id;

      // Marker Point
      const markerSize = isSelected ? 0.038 : 0.028;
      const markerGeo = new THREE.SphereGeometry(markerSize, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xD4FF3F : visual.hex,
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(connVec.clone().add(connNormal.clone().multiplyScalar(0.01)));
      state.markersGroup.add(markerMesh);

      // Beacon Ring around connection
      const ringGeo = new THREE.RingGeometry(0.035, 0.065, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xD4FF3F : visual.hex,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.45,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(connVec.clone().add(connNormal.clone().multiplyScalar(0.012)));
      ringMesh.lookAt(connVec.clone().add(connNormal));
      ringMesh.userData = { isBeaconRing: true };
      state.markersGroup.add(ringMesh);

      // Hit Target for Raycasting
      const hitGeo = new THREE.SphereGeometry(0.13, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(connVec);
      hitMesh.userData = { data: conn };
      state.markersGroup.add(hitMesh);
      state.interactiveObjects.push({ mesh: hitMesh, data: conn });

      // 3. Great-Circle Curved Arcs from User to Connection
      if (showLines) {
        const arcPoints = createGreatCircleArc(userVec, connVec, GLOBE_RADIUS, 50);
        const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);

        const arcMaterial = new THREE.LineBasicMaterial({
          color: isSelected ? 0xD4FF3F : (conn.intents?.[0] === 'Build Together' ? 0xD4FF3F : 0xF5F5F0),
          transparent: true,
          opacity: isSelected ? 0.95 : 0.35,
          linewidth: isSelected ? 2 : 1,
        });

        const arcLine = new THREE.Line(arcGeometry, arcMaterial);
        state.linesGroup.add(arcLine);
      }
    });
  }, [connections, selectedLocation, activeIntentFilter, showLines, emptyState, userLocation]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const state = threeRef.current;
    if (!state) return;

    state.isDragging = true;
    state.targetRotation = null;
    state.prevMousePos = { x: e.clientX, y: e.clientY };
    setIsInteracting(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = threeRef.current;
    if (!state || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    state.mouse.set(mouseX, mouseY);

    if (state.isDragging) {
      const deltaX = e.clientX - state.prevMousePos.x;
      const deltaY = e.clientY - state.prevMousePos.y;

      state.rotationVelocity = {
        x: deltaY * 0.003,
        y: deltaX * 0.003,
      };

      state.globeGroup.rotation.y += deltaX * 0.005;
      state.globeGroup.rotation.x += deltaY * 0.005;

      state.globeGroup.rotation.x = Math.max(-0.8, Math.min(0.8, state.globeGroup.rotation.x));
      state.prevMousePos = { x: e.clientX, y: e.clientY };
    } else {
      // Hover Raycasting
      state.raycaster.setFromCamera(state.mouse, state.camera);
      const meshesToTest = state.interactiveObjects.map((item) => item.mesh);
      const intersects = state.raycaster.intersectObjects(meshesToTest);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const data = hit.userData.data as OrbLocation;
        if (containerRef.current) {
          containerRef.current.style.cursor = 'pointer';
        }
        if (onHoverLocation) {
          onHoverLocation(data, { x: e.clientX, y: e.clientY });
        }
      } else {
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab';
        }
        if (onHoverLocation) {
          onHoverLocation(null);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const state = threeRef.current;
    if (!state) return;

    if (state.isDragging) {
      state.isDragging = false;
      setIsInteracting(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe capture release
      }
    }
  };

  // Click / Tap on Marker to Select
  const handleClick = (e: React.MouseEvent) => {
    const state = threeRef.current;
    if (!state || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    state.mouse.set(mouseX, mouseY);
    state.raycaster.setFromCamera(state.mouse, state.camera);

    const meshesToTest = state.interactiveObjects.map((item) => item.mesh);
    const intersects = state.raycaster.intersectObjects(meshesToTest);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const data = hit.userData.data as OrbLocation;

      onSelectLocation(data);

      // Smoothly rotate globe so clicked point faces the camera
      const targetPhi = (90 - data.lat) * (Math.PI / 180);
      const targetTheta = (data.lng + 180) * (Math.PI / 180);

      state.targetRotation = {
        y: -targetTheta + Math.PI / 2,
        x: (targetPhi - Math.PI / 2) * 0.4,
      };
    }
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const state = threeRef.current;
    if (!state) return;

    const zoomSpeed = 0.003;
    state.cameraTargetDistance = Math.max(
      4.2,
      Math.min(11.0, state.cameraTargetDistance + e.deltaY * zoomSpeed)
    );
  };

  // Touch Support for mobile pinch-to-zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    const state = threeRef.current;
    if (!state) return;

    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (touchDistance !== null) {
        const delta = touchDistance - dist;
        state.cameraTargetDistance = Math.max(
          4.2,
          Math.min(11.0, state.cameraTargetDistance + delta * 0.015)
        );
      }
      setTouchDistance(dist);
    }
  };

  const handleTouchEnd = () => {
    setTouchDistance(null);
  };

  // External Control Functions
  const zoomIn = () => {
    const state = threeRef.current;
    if (!state) return;
    state.cameraTargetDistance = Math.max(4.2, state.cameraTargetDistance - 0.8);
  };

  const zoomOut = () => {
    const state = threeRef.current;
    if (!state) return;
    state.cameraTargetDistance = Math.min(11.0, state.cameraTargetDistance + 0.8);
  };

  const resetToHome = useCallback(() => {
    const state = threeRef.current;
    if (!state) return;

    const initialPhi = (90 - userLocation.lat) * (Math.PI / 180);
    const initialTheta = (userLocation.lng + 180) * (Math.PI / 180);

    state.targetRotation = {
      y: -initialTheta + Math.PI / 2 + 0.3,
      x: (initialPhi - Math.PI / 2) * 0.5,
    };
    state.cameraTargetDistance = initialDistance;
  }, [userLocation, initialDistance]);

  // Expose ref functions for external navigation control cluster
  useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut,
    resetToHome,
  }), [zoomIn, zoomOut, resetToHome]);

  return (
    <div
      ref={containerRef}
      id="misfits-orb-canvas-container"
      className={`relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden ${className}`}
      onPointerDown={(e) => {
        if (onUserInteraction) onUserInteraction();
        handlePointerDown(e);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => {
        if (onUserInteraction) onUserInteraction();
        handleClick(e);
      }}
      onWheel={(e) => {
        if (onUserInteraction) onUserInteraction();
        handleWheel(e);
      }}
      onTouchMove={(e) => {
        if (onUserInteraction) onUserInteraction();
        handleTouchMove(e);
      }}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
      />

      {/* Floating Canvas UI Controls (if enabled) */}
      {showRecenterButton && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 z-10 pointer-events-auto">
          <div className="flex items-center border border-[#1E1E24] bg-[#0E0E12]/95 backdrop-blur-md">
            <button
              id="orb-zoom-out-btn"
              onClick={(e) => {
                e.stopPropagation();
                zoomOut();
              }}
              title="Zoom out"
              aria-label="Zoom out"
              className="p-2 text-[#8E8E93] hover:text-[#D4FF3F] hover:bg-[#141418] transition-colors border-r border-[#1E1E24]"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              id="orb-zoom-in-btn"
              onClick={(e) => {
                e.stopPropagation();
                zoomIn();
              }}
              title="Zoom in"
              aria-label="Zoom in"
              className="p-2 text-[#8E8E93] hover:text-[#D4FF3F] hover:bg-[#141418] transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="orb-recenter-home-btn"
            onClick={(e) => {
              e.stopPropagation();
              resetToHome();
            }}
            title={`Recenter on ${userLocation.city}`}
            aria-label={`Recenter on ${userLocation.city}`}
            className="bg-[#0E0E12]/95 backdrop-blur-md border border-[#1E1E24] hover:border-[#D4FF3F]/50 text-[#F5F5F0] hover:text-[#D4FF3F] px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl flex items-center gap-1.5 font-mono-code"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] animate-pulse" />
            <span>Recenter • {userLocation.city}</span>
          </button>
        </div>
      )}
    </div>
  );
});

OrbGlobe.displayName = 'OrbGlobe';
