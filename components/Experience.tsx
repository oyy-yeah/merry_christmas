import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MagicParticles } from './MagicParticles';
import { TreeTopper } from './TreeTopper';
import { AppState } from '../types';

interface ExperienceProps {
  appState: AppState;
  handleInteraction: () => void;
}

// Scene wrapper to handle global rotation
const SceneContent: React.FC<ExperienceProps> = ({ appState, handleInteraction }) => {
  const groupRef = useRef<THREE.Group>(null);
  const clickStartRef = useRef<number>(0);
  const isDragRef = useRef<boolean>(false);

  useFrame((state) => {
    if (groupRef.current) {
        // Slowly rotate the entire tree group automatically
        groupRef.current.rotation.y += 0.002;
    }
  });

  const handlePointerDown = () => {
    clickStartRef.current = Date.now();
    isDragRef.current = false;
  };

  const handlePointerMove = () => {
    // If moved significantly, it's a drag
    isDragRef.current = true;
  };

  const handlePointerUp = (e: any) => {
    // Simple drag detection based on time and a flag
    // Standard OrbitControls might consume events, so we need to be careful.
    const timeDiff = Date.now() - clickStartRef.current;
    
    // If it was a quick click (less than 250ms), treat as interaction
    if (timeDiff < 250) {
      handleInteraction();
    }
  };

  return (
    <group 
      ref={groupRef} 
      onPointerDown={handlePointerDown} 
      onPointerUp={handlePointerUp}
    >
      <MagicParticles appState={appState} />
      <TreeTopper appState={appState} />
    </group>
  );
};

export const Experience: React.FC<ExperienceProps> = ({ appState, handleInteraction }) => {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={50} />
      
      {/* Lighting Setup */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffddaa" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ccffcc" />
      <spotLight 
        position={[0, 20, 0]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024}
      />

      {/* Environment for PBR Reflections */}
      {/* "city" preset gives good metallic reflections */}
      <Environment preset="city" />
      
      {/* Background Stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <Suspense fallback={null}>
        <SceneContent appState={appState} handleInteraction={handleInteraction} />
      </Suspense>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.5}
        minDistance={10}
        maxDistance={40}
      />
    </Canvas>
  );
};