import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AppState, CONSTANTS } from '../types';

export const TreeTopper: React.FC<{ appState: AppState }> = ({ appState }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Rotate the topper
    meshRef.current.rotation.y = time;
    meshRef.current.rotation.z = Math.sin(time * 2) * 0.1;

    // Scale down if not in tree mode
    const targetScale = appState === AppState.TREE ? 1.5 : 0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  // Calculate top position based on tree height
  const topY = (CONSTANTS.TREE_HEIGHT / 2) - 1.5;

  return (
    <mesh ref={meshRef} position={[0, topY, 0]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color="#FFFF00" 
        emissive="#FFD700"
        emissiveIntensity={0.5}
        metalness={1} 
        roughness={0} 
      />
      <pointLight distance={10} intensity={2} color="#ffaa00" />
    </mesh>
  );
};
