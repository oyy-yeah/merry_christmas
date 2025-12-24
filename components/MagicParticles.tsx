import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { AppState, CONSTANTS, GlowParticleData, ParticleData } from '../types';

// Helper to generate random points in a volume
const randomSpherePoint = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

interface MagicParticlesProps {
  appState: AppState;
}

export const MagicParticles: React.FC<MagicParticlesProps> = ({ appState }) => {
  // Refs for InstancedMeshes
  const spheresRef = useRef<THREE.InstancedMesh>(null);
  const cubesRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null); 
  
  // Font loader for "MERRY CHRISTMAS" - Using jsdelivr CDN for better reliability than threejs.org direct link
  const font = useLoader(FontLoader, 'https://cdn.jsdelivr.net/npm/three/examples/fonts/gentilis_bold.typeface.json');

  // Generate all particle data once
  const { particles, sphereCount, cubeCount, glowParticles } = useMemo(() => {
    const tempParticles: ParticleData[] = [];
    const tempGlowParticles: GlowParticleData[] = [];
    const count = CONSTANTS.PARTICLE_COUNT;
    let sCount = 0;
    let cCount = 0;

    // 1. TEXT TARGETS (Single Line)
    const textGeo = new TextGeometry('MERRY CHRISTMAS', {
      font: font,
      size: 1.8, // Size for single line
      depth: 0.4,
      curveSegments: 3,
      bevelEnabled: false,
    });
    textGeo.center();
    textGeo.computeBoundingBox();
    
    const posAttribute = textGeo.attributes.position;
    const textPoints: THREE.Vector3[] = [];
    const triangleCount = posAttribute.count / 3;
    
    // Sample points on text surface
    for (let i = 0; i < count; i++) {
        const faceIndex = Math.floor(Math.random() * triangleCount);
        const i0 = faceIndex * 3;
        const i1 = faceIndex * 3 + 1;
        const i2 = faceIndex * 3 + 2;

        const a = new THREE.Vector3().fromBufferAttribute(posAttribute, i0);
        const b = new THREE.Vector3().fromBufferAttribute(posAttribute, i1);
        const c = new THREE.Vector3().fromBufferAttribute(posAttribute, i2);

        const r1 = Math.random();
        const r2 = Math.random();
        const sqrtR1 = Math.sqrt(r1);
        
        const point = new THREE.Vector3()
            .copy(a).multiplyScalar(1 - sqrtR1)
            .add(b.clone().multiplyScalar(sqrtR1 * (1 - r2)))
            .add(c.clone().multiplyScalar(sqrtR1 * r2));
            
        // Scale down to fit camera (Single line is wide)
        // Check aspect ratio roughly?
        // Spread it out but keep it readable
        point.multiplyScalar(0.65); 
        point.y += 1; // Center vertically roughly
        
        textPoints.push(point);
    }

    // 2. GENERATE MAIN PARTICLES
    for (let i = 0; i < count; i++) {
      const isSphere = Math.random() < CONSTANTS.SPHERE_RATIO;
      if (isSphere) sCount++; else cCount++;

      // TREE POSITION (Cone Spiral)
      const yNorm = i / count;
      const y = (yNorm * CONSTANTS.TREE_HEIGHT) - (CONSTANTS.TREE_HEIGHT / 2);
      const radiusAtHeight = (1 - yNorm) * CONSTANTS.TREE_RADIUS;
      const theta = i * 137.5 * (Math.PI / 180);
      
      const r = radiusAtHeight * (0.8 + Math.random() * 0.4);
      
      const treePos = new THREE.Vector3(
        r * Math.cos(theta),
        y - 2,
        r * Math.sin(theta)
      );

      const scatterPos = randomSpherePoint(30);
      const textPos = textPoints[i % textPoints.length];

      let color = new THREE.Color();
      if (isSphere) {
        // Gold and Red
        Math.random() > 0.3 ? color.setHex(0xFFD700) : color.setHex(0xC41E3A);
      } else {
        // Gold and Green
        Math.random() > 0.4 ? color.setHex(0xDAA520) : color.setHex(0x004d25);
      }
      color.offsetHSL(0, 0, Math.random() * 0.1);

      tempParticles.push({
        id: i,
        initialPos: treePos,
        scatterPos: scatterPos,
        textPos: textPos,
        type: isSphere ? 'sphere' : 'cube',
        color: color,
        scale: Math.random() * 0.25 + 0.1, 
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      });
    }

    // 3. GENERATE INDEPENDENT GLOW PARTICLES
    for (let i = 0; i < CONSTANTS.GLOW_COUNT; i++) {
      // Random cloud distribution, wider than the tree
      const pos = randomSpherePoint(18); 
      // Flatten y slightly
      pos.y *= 0.8;
      
      tempGlowParticles.push({
        initialPos: pos,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        speed: 0.1 + Math.random() * 0.2, // Slow movement
        amplitude: 2 + Math.random() * 3, // Wide drift
        scale: 0.05 + Math.random() * 0.15 // Small varying sizes
      });
    }

    return { particles: tempParticles, sphereCount: sCount, cubeCount: cCount, glowParticles: tempGlowParticles };
  }, [font]);

  // Initial Setup
  useEffect(() => {
    if (!spheresRef.current || !cubesRef.current || !glowRef.current) return;

    let sphereIdx = 0;
    let cubeIdx = 0;
    const dummy = new THREE.Object3D();
    const glowColor = new THREE.Color(0xffffcc); // Warm glow

    // Setup Main Particles
    particles.forEach((p) => {
      dummy.position.copy(p.initialPos);
      dummy.rotation.copy(p.rotation);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();

      if (p.type === 'sphere') {
        spheresRef.current!.setMatrixAt(sphereIdx, dummy.matrix);
        spheresRef.current!.setColorAt(sphereIdx, p.color);
        sphereIdx++;
      } else {
        cubesRef.current!.setMatrixAt(cubeIdx, dummy.matrix);
        cubesRef.current!.setColorAt(cubeIdx, p.color);
        cubeIdx++;
      }
    });

    // Setup Glow Particles
    glowParticles.forEach((p, i) => {
        dummy.position.copy(p.initialPos);
        dummy.scale.set(p.scale, p.scale, p.scale);
        dummy.updateMatrix();
        glowRef.current!.setMatrixAt(i, dummy.matrix);
        
        // Random golden/warm hues
        const c = glowColor.clone().offsetHSL(0.1 * (Math.random() - 0.5), 0, 0);
        glowRef.current!.setColorAt(i, c);
    });
    
    spheresRef.current.instanceMatrix.needsUpdate = true;
    spheresRef.current.instanceColor!.needsUpdate = true;
    cubesRef.current.instanceMatrix.needsUpdate = true;
    cubesRef.current.instanceColor!.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceColor!.needsUpdate = true;
  }, [particles, glowParticles]);


  // ANIMATION LOOP
  const currentPositions = useRef(particles.map(p => p.initialPos.clone()));
  const currentRotations = useRef(particles.map(p => p.rotation.clone()));

  useFrame((state) => {
    if (!spheresRef.current || !cubesRef.current || !glowRef.current) return;

    let sphereIdx = 0;
    let cubeIdx = 0;
    const dummy = new THREE.Object3D();
    const lerpFactor = CONSTANTS.ANIMATION_SPEED;
    const time = state.clock.getElapsedTime();

    // 1. ANIMATE MAIN GEOMETRIES
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let target: THREE.Vector3;

      switch (appState) {
        case AppState.SCATTER:
          target = p.scatterPos;
          break;
        case AppState.TEXT:
          target = p.textPos;
          break;
        case AppState.TREE:
        default:
          target = p.initialPos;
          break;
      }

      currentPositions.current[i].lerp(target, lerpFactor);

      if (appState === AppState.SCATTER) {
         dummy.rotation.set(
            currentRotations.current[i].x + Date.now() * 0.001,
            currentRotations.current[i].y + Date.now() * 0.001,
            currentRotations.current[i].z
         );
      } else {
         dummy.rotation.copy(currentRotations.current[i]);
      }

      dummy.position.copy(currentPositions.current[i]);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();

      if (p.type === 'sphere') {
        spheresRef.current.setMatrixAt(sphereIdx, dummy.matrix);
        sphereIdx++;
      } else {
        cubesRef.current.setMatrixAt(cubeIdx, dummy.matrix);
        cubeIdx++;
      }
    }

    // 2. ANIMATE GLOW PARTICLES (Drifting independently)
    const dummyGlow = new THREE.Object3D();
    for (let i = 0; i < glowParticles.length; i++) {
        const p = glowParticles[i];
        
        // Organic drifting motion
        // Base position + Sine wave offset based on time
        const x = p.initialPos.x + Math.sin(time * p.speed + p.phaseX) * p.amplitude;
        const y = p.initialPos.y + Math.cos(time * p.speed * 0.7 + p.phaseY) * p.amplitude * 0.5;
        const z = p.initialPos.z + Math.sin(time * p.speed * 0.5 + p.phaseZ) * p.amplitude;

        // If scattering, push them out a bit to fill the chaotic scene
        const expansion = appState === AppState.SCATTER ? 1.5 : 1.0;

        dummyGlow.position.set(x * expansion, y * expansion, z * expansion);
        
        // Twinkle/Pulse
        const pulse = 1 + Math.sin(time * 2 + p.phaseX) * 0.3;
        dummyGlow.scale.set(p.scale * pulse, p.scale * pulse, p.scale * pulse);
        
        dummyGlow.updateMatrix();
        glowRef.current.setMatrixAt(i, dummyGlow.matrix);
    }

    spheresRef.current.instanceMatrix.needsUpdate = true;
    cubesRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* SPHERES INSTANCES */}
      <instancedMesh
        ref={spheresRef}
        args={[undefined, undefined, sphereCount]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          metalness={0.9} 
          roughness={0.1} 
          envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* CUBES INSTANCES */}
      <instancedMesh
        ref={cubesRef}
        args={[undefined, undefined, cubeCount]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          metalness={0.8} 
          roughness={0.2}
          envMapIntensity={1.2}
        />
      </instancedMesh>

      {/* GLOW PARTICLE INSTANCES (Drifting) */}
      <instancedMesh
        ref={glowRef}
        args={[undefined, undefined, CONSTANTS.GLOW_COUNT]}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial 
          color="#FFFFE0" 
          toneMapped={false}
          transparent
          opacity={0.6}
        />
      </instancedMesh>
    </group>
  );
};