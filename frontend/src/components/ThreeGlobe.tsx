
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
    const barData: Array<{ color: THREE.Color; emissive: THREE.Color }> = [];
    
    for (let i = 0; i < barCount; i++) {
      // Color based on status
      if (status === 'listening') {
        barData.push({ 
          color: new THREE.Color('#22c55e'), 
          emissive: new THREE.Color('#0a4d1a') 
        }); // Green
      } else if (status === 'thinking') {
        barData.push({ 
          color: new THREE.Color('#fbbf24'), 
          emissive: new THREE.Color('#7c2d12') 
        }); // Yellow
      } else if (status === 'speaking') {
        barData.push({ 
          color: new THREE.Color('#8b5cf6'), 
          emissive: new THREE.Color('#3730a3') 
        }); // Purple
      } else {
        barData.push({ 
          color: new THREE.Color('#8b5cf6'), 
          emissive: new THREE.Color('#3730a3') 
        }); // Default purple
      }
    }
    
    return { data: barData, count: barCount };
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
        const barInfo = bars.data[i];
        
        return (
          <mesh key={i} position={[x, 0, z]}>
            <boxGeometry args={[0.1, 1, 0.1]} />
            <meshPhongMaterial 
              color={barInfo.color}
              emissive={barInfo.emissive}
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
      case 'listening': return new THREE.Color('#22c55e');
      case 'thinking': return new THREE.Color('#fbbf24');
      case 'speaking': return new THREE.Color('#8b5cf6');
      case 'connecting':
      case 'calibrating': return new THREE.Color('#3b82f6');
      default: return new THREE.Color('#8b5cf6');
    }
  };

  const getEmissiveColor = () => {
    switch (status) {
      case 'listening': return new THREE.Color('#0a4d1a');
      case 'thinking': return new THREE.Color('#7c2d12');
      case 'speaking': return new THREE.Color('#3730a3');
      case 'connecting':
      case 'calibrating': return new THREE.Color('#1e3a8a');
      default: return new THREE.Color('#3730a3');
    }
  };

  return (
    <Sphere ref={globeRef} args={[1, 32, 32]}>
      <meshPhongMaterial
        color={getGlobeColor()}
        transparent
        opacity={0.8}
        emissive={getEmissiveColor()}
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
