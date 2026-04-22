import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './ModelViewer.module.css';

const ModelViewerScene = dynamic(
  () => import('./ModelViewerScene').then((m) => m.ModelViewerScene),
  { ssr: false, loading: () => null }
);

export interface ModelViewerProps {
  modelUrl?: string;
  fallbackImageUrl?: string;
  environment?: 'apartment' | 'city' | 'dawn' | 'forest' | 'lobby' | 'night' | 'park' | 'studio' | 'sunset' | 'warehouse';
  interactionMode?: 'auto-rotate' | 'drag' | 'cursor-tilt';
  enableZoom?: boolean;
  cameraDistance?: number;
  cameraX?: number;
  cameraY?: number;
  minDistance?: number;
  maxDistance?: number;
  maxTilt?: number;
  background?: string;
  height?: string;
  className?: string;
}

export function ModelViewer({
  modelUrl,
  fallbackImageUrl,
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
  height = '480px',
  className,
}: ModelViewerProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={[styles.container, className ?? ''].filter(Boolean).join(' ')}
      style={{ '--viewer-height': height, background } as React.CSSProperties}
    >
      {modelUrl ? (
        <>
          {fallbackImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fallbackImageUrl}
              alt=""
              className={styles.fallback}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                opacity: loaded ? 0 : 1,
                transition: 'opacity 0.4s ease',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
          )}
          <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
            <ModelViewerScene
              modelUrl={modelUrl}
              environment={environment}
              interactionMode={interactionMode}
              enableZoom={enableZoom}
              cameraDistance={cameraDistance}
              cameraX={cameraX}
              cameraY={cameraY}
              minDistance={minDistance}
              maxDistance={maxDistance}
              maxTilt={maxTilt}
              background={background}
              onLoaded={() => setLoaded(true)}
            />
          </div>
        </>
      ) : fallbackImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fallbackImageUrl} alt="" className={styles.fallback} draggable={false} />
      ) : (
        <div className={styles.placeholder}>
          set a modelUrl prop to load a 3d model
        </div>
      )}
    </div>
  );
}
