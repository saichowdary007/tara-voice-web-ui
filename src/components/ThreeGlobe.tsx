
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeGlobeProps {
  status: 'idle' | 'connecting' | 'calibrating' | 'listening' | 'thinking' | 'speaking';
  isRecording: boolean;
}

const AnimatedGlobe = ({ status, isRecording }: ThreeGlobeProps) => {
  const globeRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Create particle system
  const particles = useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      const radius = 2 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (!globeRef.current || !wireframeRef.current || !particlesRef.current) return;

    const time = state.clock.getElapsedTime();
    
    // Base rotation
    globeRef.current.rotation.y = time * 0.2;
    wireframeRef.current.rotation.y = time * 0.15;
    wireframeRef.current.rotation.x = time * 0.1;

    // Status-based animations
    switch (status) {
      case 'listening':
        globeRef.current.scale.setScalar(1 + Math.sin(time * 4) * 0.1);
        particlesRef.current.rotation.y = time * 0.5;
        break;
      case 'thinking':
        globeRef.current.rotation.x = Math.sin(time * 2) * 0.2;
        wireframeRef.current.scale.setScalar(1 + Math.sin(time * 3) * 0.05);
        break;
      case 'speaking':
        globeRef.current.scale.setScalar(1 + Math.sin(time * 6) * 0.15);
        particlesRef.current.rotation.y = time * 1;
        particlesRef.current.rotation.x = time * 0.5;
        break;
      case 'connecting':
      case 'calibrating':
        globeRef.current.rotation.z = time * 0.3;
        break;
      default:
        globeRef.current.scale.setScalar(1);
        particlesRef.current.rotation.y = time * 0.1;
    }
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

  const getEmissionIntensity = () => {
    switch (status) {
      case 'listening': return 0.3;
      case 'thinking': return 0.2;
      case 'speaking': return 0.4;
      default: return 0.1;
    }
  };

  return (
    <>
      {/* Main Globe */}
      <Sphere ref={globeRef} args={[1.5, 64, 64]}>
        <meshPhysicalMaterial
          color={getGlobeColor()}
          transparent
          opacity={0.8}
          emissive={getGlobeColor()}
          emissiveIntensity={getEmissionIntensity()}
          roughness={0.1}
          metalness={0.1}
        />
      </Sphere>

      {/* Wireframe Overlay */}
      <Sphere ref={wireframeRef} args={[1.6, 32, 32]}>
        <meshBasicMaterial
          color={getGlobeColor()}
          wireframe
          transparent
          opacity={0.3}
        />
      </Sphere>

      {/* Particle System */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.length / 3}
            array={particles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={getGlobeColor()}
          size={0.02}
          transparent
          opacity={0.6}
        />
      </points>

      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
    </>
  );
};

const ThreeGlobe = ({ status, isRecording }: ThreeGlobeProps) => {
  return (
    <div className="w-64 h-64 mx-auto">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <Stars 
          radius={50} 
          depth={50} 
          count={1000} 
          factor={2} 
          saturation={0.5} 
          fade 
        />
        <AnimatedGlobe status={status} isRecording={isRecording} />
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
