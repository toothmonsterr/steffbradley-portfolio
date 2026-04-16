import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls, PresentationControls, Html } from '@react-three/drei';

type EnvironmentPreset =
  | 'apartment' | 'city' | 'dawn' | 'forest' | 'lobby'
  | 'night' | 'park' | 'studio' | 'sunset' | 'warehouse';

interface ModelProps {
  url: string;
}

function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function Loader() {
  return (
    <Html center>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-neutral-50)' }}>
        loading…
      </span>
    </Html>
  );
}

export interface ModelViewerSceneProps {
  modelUrl: string;
  environment?: EnvironmentPreset;
  autoRotate?: boolean;
  controls?: 'orbit' | 'presentation';
}

// This component renders the actual R3F canvas.
// It is dynamically imported by ModelViewer.tsx with ssr: false.
export function ModelViewerScene({
  modelUrl,
  environment = 'studio',
  autoRotate = true,
  controls = 'orbit',
}: ModelViewerSceneProps) {
  return (
    <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <Suspense fallback={<Loader />}>
        <Model url={modelUrl} />
        <Environment preset={environment} background={false} />
        {controls === 'orbit' ? (
          <OrbitControls autoRotate={autoRotate} autoRotateSpeed={1.5} enableZoom={false} />
        ) : (
          <PresentationControls global polar={[-0.4, 0.2]} azimuth={[-1, 1]} />
        )}
      </Suspense>
    </Canvas>
  );
}
