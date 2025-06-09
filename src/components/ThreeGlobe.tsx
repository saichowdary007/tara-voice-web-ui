
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeGlobeProps {
  status: 'idle' | 'connecting' | 'calibrating' | 'listening' | 'thinking' | 'speaking';
  isRecording: boolean;
}

const AudioVisualizer = ({ status, isRecording }: ThreeGlobeProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create audio visualizer bars
  const bars = useMemo(() => {
    const barCount = 64;
    const positions: number[] = [];
    const colors: number[] = [];
    
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const radius = 3;
      
      // Position bars in a circle
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 0;
      
      positions.push(x, y, z);
      
      // Color based on status
      if (status === 'listening') {
        colors.push(0.13, 0.77, 0.37); // Green
      } else if (status === 'thinking') {
        colors.push(0.98, 0.75, 0.15); // Yellow
      } else if (status === 'speaking') {
        colors.push(0.54, 0.36, 0.96); // Purple
      } else {
        colors.push(0.54, 0.36, 0.96); // Default purple
      }
    }
    
    return { positions, colors, count: barCount };
  }, [status]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();
    
    // Animate the visualizer based on status
    if (status === 'listening' || status === 'speaking') {
      // Simulate audio data with sine waves
      const children = groupRef.current.children;
      children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const frequency = 0.5 + (i * 0.1);
          const amplitude = status === 'speaking' ? 2 : 1;
          const height = Math.abs(Math.sin(time * frequency)) * amplitude + 0.1;
          child.scale.y = height;
          child.position.y = (height - 1) / 2;
        }
      });
    } else if (status === 'thinking') {
      // Gentle pulsing animation
      const children = groupRef.current.children;
      children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const offset = i * 0.1;
          const height = 0.5 + Math.sin(time * 2 + offset) * 0.3;
          child.scale.y = height;
          child.position.y = (height - 1) / 2;
        }
      });
    } else {
      // Reset to default state
      const children = groupRef.current.children;
      children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.scale.y = 0.1;
          child.position.y = -0.45;
        }
      });
    }

    // Rotate the entire visualizer
    groupRef.current.rotation.y = time * 0.2;
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: bars.count }).map((_, i) => {
        const angle = (i / bars.count) * Math.PI * 2;
        const radius = 3;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <mesh key={i} position={[x, 0, z]}>
            <boxGeometry args={[0.1, 1, 0.1]} />
            <meshPhongMaterial 
              color={new THREE.Color(
                bars.colors[i * 3],
                bars.colors[i * 3 + 1],
                bars.colors[i * 3 + 2]
              )}
              emissive={new THREE.Color(
                bars.colors[i * 3] * 0.2,
                bars.colors[i * 3 + 1] * 0.2,
                bars.colors[i * 3 + 2] * 0.2
              )}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const CentralGlobe = ({ status }: { status: string }) => {
  const globeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!globeRef.current) return;

    const time = state.clock.getElapsedTime();
    
    // Rotate the globe
    globeRef.current.rotation.y = time * 0.3;
    globeRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;

    // Scale based on status
    const targetScale = status === 'speaking' ? 1.2 : status === 'listening' ? 1.1 : 1;
    const currentScale = globeRef.current.scale;
    currentScale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  const getGlobeColor = () => {
    switch (status) {
      case 'listening': return '#22c55e';
      case 'thinking': return '#fbbf24';
      case 'speaking': return '#8b5cf6';
      case 'connecting':
      case 'calibrating': return '#3b82f6';
      default: return '#8b5cf6';
    }
  };

  return (
    <Sphere ref={globeRef} args={[1, 32, 32]}>
      <meshPhongMaterial
        color={getGlobeColor()}
        transparent
        opacity={0.8}
        emissive={getGlobeColor()}
        emissiveIntensity={0.2}
      />
    </Sphere>
  );
};

const ThreeGlobe = ({ status, isRecording }: ThreeGlobeProps) => {
  return (
    <div className="w-64 h-64 mx-auto">
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
        <Stars 
          radius={50} 
          depth={50} 
          count={1000} 
          factor={2} 
          saturation={0.5} 
          fade 
        />
        
        {/* Central Globe */}
        <CentralGlobe status={status} />
        
        {/* Audio Visualizer */}
        <AudioVisualizer status={status} isRecording={isRecording} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={status === 'idle'}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default ThreeGlobe;
