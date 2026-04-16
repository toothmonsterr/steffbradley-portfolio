import { ModelViewer } from './ModelViewer';

export { ModelViewer };

export const ModelViewerMeta = {
  name: 'ModelViewer',
  displayName: '3D Model Viewer',
  props: {
    modelUrl: {
      type: 'string',
      description: 'Path to a .glb file (e.g. /models/tooth.glb)',
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
