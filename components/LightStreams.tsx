import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AppState, CONSTANTS } from '../types';

// Helper to create a spiral curve
class SpiralCurve extends THREE.Curve<THREE.Vector3> {
  scale: number;
  height: number;
  radius: number;
  turns: number;
  offset: number;

  constructor(scale = 1, height = 10, radius = 5, turns = 3, offset = 0) {
    super();
    this.scale = scale;
    this.height = height;
    this.radius = radius;
    this.turns = turns;
    this.offset = offset;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const angle = t * Math.PI * 2 * this.turns + this.offset;
    // Taper radius at top
    const currentRadius = this.radius * (1 - t * 0.8);
    
    const x = Math.cos(angle) * currentRadius;
    const z = Math.sin(angle) * currentRadius;
    const y = (t - 0.5) * this.height;

    return optionalTarget.set(x, y, z).multiplyScalar(this.scale);
  }
}

interface LightStreamsProps {
  appState: AppState;
}

export const LightStreams: React.FC<LightStreamsProps> = ({ appState }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Generate 3 curves with different offsets
  const curves = useMemo(() => {
    return [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((offset) => 
      new SpiralCurve(1, CONSTANTS.TREE_HEIGHT + 4, CONSTANTS.TREE_RADIUS + 2, 2.5, offset)
    );
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Rotate the streams continuously, slightly faster than tree
    groupRef.current.rotation.y -= 0.01;
    
    // Pulse intensity or scale slightly
    const time = state.clock.getElapsedTime();
    const scale = 1 + Math.sin(time * 2) * 0.05;
    
    // Expand streams when scattering
    const targetExpansion = appState === AppState.SCATTER ? 2.5 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetExpansion, targetExpansion, targetExpansion), 0.05);
  });

  return (
    <group ref={groupRef}>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 64, 0.1, 8, false]} />
          <meshStandardMaterial 
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
            roughness={0}
            metalness={1}
          />
        </mesh>
      ))}
      
      {/* Add some floating particles for extra "Radiance" */}
      <points>
        <bufferGeometry>
           <bufferAttribute
             attach="attributes-position"
             count={50}
             array={new Float32Array(Array.from({length: 150}, () => (Math.random() - 0.5) * 20))}
             itemSize={3}
           />
        </bufferGeometry>
        <pointsMaterial 
          size={0.2} 
          color="#FFFF00" 
          transparent 
          opacity={0.8} 
          blending={THREE.AdditiveBlending} 
        />
      </points>
    </group>
  );
};
