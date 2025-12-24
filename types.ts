import * as THREE from 'three';
import React from 'react';

export enum AppState {
  TREE = 0,
  SCATTER = 1,
  TEXT = 2,
}

export interface ParticleData {
  id: number;
  initialPos: THREE.Vector3; // Tree position
  scatterPos: THREE.Vector3; // Explosion position
  textPos: THREE.Vector3;    // Text formation position
  type: 'sphere' | 'cube';
  color: THREE.Color;
  scale: number;
  rotation: THREE.Euler;
}

export interface GlowParticleData {
  initialPos: THREE.Vector3;
  phaseX: number;
  phaseY: number;
  phaseZ: number;
  speed: number;
  amplitude: number;
  scale: number;
}

export const CONSTANTS = {
  PARTICLE_COUNT: 4000, // Increased for denser single-line text
  GLOW_COUNT: 2000,     // Independent floating glow particles
  SPHERE_RATIO: 0.7,    // 70% spheres, 30% cubes
  TREE_HEIGHT: 14,
  TREE_RADIUS: 5,
  TEXT_SCALE: 0.8,
  ANIMATION_SPEED: 0.08,
};

// Add global type definitions for React Three Fiber elements to satisfy TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      instancedMesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      boxGeometry: any;
      octahedronGeometry: any;
      pointLight: any;
      ambientLight: any;
      spotLight: any;
      primitive: any;
      tubeGeometry: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
    }
  }

  // MediaPipe Globals loaded via CDN
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}
