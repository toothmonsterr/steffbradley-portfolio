import React, { Suspense, useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

type EnvironmentPreset =
  | 'apartment' | 'city' | 'dawn' | 'forest' | 'lobby'
  | 'night' | 'park' | 'studio' | 'sunset' | 'warehouse';

type InteractionMode = 'auto-rotate' | 'drag' | 'cursor-tilt';

const Model = React.memo(function Model({ url, onLoaded }: { url: string; onLoaded: () => void }) {
  const { scene } = useGLTF(url);
  useEffect(() => { onLoaded(); }, [onLoaded]);
  return <primitive object={scene} />;
});

function TransparentBackground() {
  const { scene } = useThree();
  scene.background = null;
  return null;
}

function CameraOffset({ x, y }: { x: number; y: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.x = x;
    camera.position.y = y;
    camera.updateProjectionMatrix();
  }, [camera, x, y]);
  return null;
}


const TiltScene = React.memo(function TiltScene({
  url,
  onLoaded,
  environment,
  targetRef,
  maxTilt,
}: {
  url: string;
  onLoaded: () => void;
  environment: EnvironmentPreset;
  targetRef: React.RefObject<{ x: number; y: number }>;
  maxTilt: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const tx = (-targetRef.current.y * maxTilt * Math.PI) / 180;
    const ty = (targetRef.current.x * maxTilt * Math.PI) / 180;
    const dx = tx - groupRef.current.rotation.x;
    const dy = ty - groupRef.current.rotation.y;
    if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return;
    groupRef.current.rotation.x += dx * 0.08;
    groupRef.current.rotation.y += dy * 0.08;
  });

  const { scene } = useGLTF(url);
  useEffect(() => { onLoaded(); }, [onLoaded]);

  return (
    <>
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
      <Environment preset={environment} background={false} />
    </>
  );
});

export interface ModelViewerSceneProps {
  modelUrl: string;
  environment?: EnvironmentPreset;
  interactionMode?: InteractionMode;
  enableZoom?: boolean;
  cameraDistance?: number;
  cameraX?: number;
  cameraY?: number;
  minDistance?: number;
  maxDistance?: number;
  maxTilt?: number;
  background?: string;
  onLoaded?: () => void;
}

export function ModelViewerScene({
  modelUrl,
  environment = 'studio',
  interactionMode = 'auto-rotate',
  enableZoom = false,
  cameraDistance = 3,
  cameraX = 0,
  cameraY = 0,
  minDistance = 1,
  maxDistance = 10,
  maxTilt = 20,
  background = 'transparent',
  onLoaded,
}: ModelViewerSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isTransparent = !background || background === 'transparent';

  const stableOnLoaded = useCallback(() => { onLoaded?.(); }, [onLoaded]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode !== 'cursor-tilt' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    cursorRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
    };
  }, [interactionMode]);

  const handleMouseLeave = useCallback(() => {
    if (interactionMode !== 'cursor-tilt') return;
    cursorRef.current = { x: 0, y: 0 };
  }, [interactionMode]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Canvas
        camera={{ position: [cameraX, cameraY, cameraDistance], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, isTransparent ? 0 : 1);
        }}
        style={{ background: isTransparent ? 'transparent' : background }}
      >
        {isTransparent && <TransparentBackground />}
        <CameraOffset x={cameraX} y={cameraY} />
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          {interactionMode === 'cursor-tilt' ? (
            <TiltScene
              url={modelUrl}
              onLoaded={stableOnLoaded}
              environment={environment}
              targetRef={cursorRef}
              maxTilt={maxTilt}
            />
          ) : (
            <>
              <Model url={modelUrl} onLoaded={stableOnLoaded} />
              <Environment preset={environment} background={false} />
              <OrbitControls
                ref={controlsRef}
                autoRotate={interactionMode === 'auto-rotate'}
                autoRotateSpeed={1.5}
                enableZoom={enableZoom}
                enablePan={false}
                enableRotate={interactionMode === 'drag'}
                minDistance={minDistance}
                maxDistance={maxDistance}
              />
            </>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
