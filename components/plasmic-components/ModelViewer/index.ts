import { ModelViewer } from './ModelViewer';

export { ModelViewer };

export const ModelViewerMeta = {
  name: 'ModelViewer',
  displayName: '3D Model Viewer',
  props: {
    modelUrl: {
      type: 'imageUrl',
      description: 'URL or uploaded asset for a .glb / .gltf model. Use Plasmic’s asset picker or paste an absolute URL.',
    },
    fallbackImageUrl: {
      type: 'imageUrl',
      description: 'Image shown when no 3D model URL is set',
    },
    environment: {
      type: 'choice',
      options: ['apartment', 'city', 'dawn', 'forest', 'lobby', 'night', 'park', 'studio', 'sunset', 'warehouse'],
      defaultValueHint: 'studio',
    },
    autoRotate: { type: 'boolean', defaultValueHint: true },
    controls: {
      type: 'choice',
      options: ['orbit', 'presentation'],
      defaultValueHint: 'orbit',
      description: 'orbit = free drag rotation; presentation = constrained arc',
    },
    height: { type: 'string', defaultValueHint: '480px', description: 'CSS height of the canvas container' },
  },
  importPath: '@/components/plasmic-components/ModelViewer',
};
