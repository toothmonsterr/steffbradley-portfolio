import React from 'react';
import dynamic from 'next/dynamic';
import styles from './ModelViewer.module.css';

// Dynamic import with ssr: false — R3F cannot run server-side.
// The ModelViewerScene component imports Three.js which requires a browser context.
const ModelViewerScene = dynamic(
  () => import('./ModelViewerScene').then((m) => m.ModelViewerScene),
  {
    ssr: false,
    loading: () => (
      <div className={styles.placeholder}>loading 3d model…</div>
    ),
  }
);

export interface ModelViewerProps {
  modelUrl?: string;
  fallbackImageUrl?: string;
  environment?: 'apartment' | 'city' | 'dawn' | 'forest' | 'lobby' | 'night' | 'park' | 'studio' | 'sunset' | 'warehouse';
  autoRotate?: boolean;
  controls?: 'orbit' | 'presentation';
  height?: string;
  className?: string;
}

export function ModelViewer({
  modelUrl,
  fallbackImageUrl,
  environment = 'studio',
  autoRotate = true,
  controls = 'orbit',
  height = '480px',
  className,
}: ModelViewerProps) {
  return (
    <div
      className={[styles.container, className ?? ''].filter(Boolean).join(' ')}
      style={{ '--viewer-height': height } as React.CSSProperties}
    >
      {modelUrl ? (
        <ModelViewerScene
          modelUrl={modelUrl}
          environment={environment}
          autoRotate={autoRotate}
          controls={controls}
        />
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
