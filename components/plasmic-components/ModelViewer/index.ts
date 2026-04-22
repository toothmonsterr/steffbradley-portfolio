import { ModelViewer } from './ModelViewer';

export { ModelViewer };

export const ModelViewerMeta = {
  name: 'ModelViewer',
  displayName: '3D Model Viewer',
  props: {
    modelUrl: {
      type: 'string',
      description: 'Absolute URL to a .glb or .gltf file. Host in /public or a CDN (e.g. /models/mymodel.glb).',
    },
    fallbackImageUrl: {
      type: 'imageUrl',
      description: 'Shown while the model loads. Also used as a static preview when no modelUrl is set.',
    },
    environment: {
      type: 'choice',
      options: ['apartment', 'city', 'dawn', 'forest', 'lobby', 'night', 'park', 'studio', 'sunset', 'warehouse'],
      defaultValueHint: 'studio',
      description: 'HDRI lighting environment',
    },
    interactionMode: {
      type: 'choice',
      options: ['auto-rotate', 'drag', 'cursor-tilt'],
      defaultValueHint: 'auto-rotate',
      description: 'auto-rotate: spins continuously. drag: user click-drags to orbit. cursor-tilt: model tilts to follow cursor on hover, no click needed.',
    },
    enableZoom: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Allow scroll/pinch to zoom',
    },
    cameraDistance: {
      type: 'number',
      defaultValueHint: 3,
      description: 'Initial camera distance. Increase to zoom out, decrease to zoom in.',
    },
    cameraX: {
      type: 'number',
      defaultValueHint: 0,
      description: 'Horizontal camera offset. Positive = camera right, model shifts left.',
    },
    cameraY: {
      type: 'number',
      defaultValueHint: 0,
      description: 'Vertical camera offset. Positive = camera up, model shifts down.',
    },
    minDistance: {
      type: 'number',
      defaultValueHint: 1,
      description: 'Closest zoom distance (enableZoom must be on)',
    },
    maxDistance: {
      type: 'number',
      defaultValueHint: 10,
      description: 'Furthest zoom distance (enableZoom must be on)',
    },
    maxTilt: {
      type: 'number',
      defaultValueHint: 20,
      description: 'Max tilt angle in degrees for cursor-tilt mode',
    },
    background: {
      type: 'color',
      defaultValueHint: 'transparent',
      description: 'Canvas background. Use transparent to show whatever is behind the component.',
    },
    height: {
      type: 'string',
      defaultValueHint: '480px',
      description: 'CSS height of the viewer',
    },
  },
  importPath: '@/components/plasmic-components/ModelViewer',
};
