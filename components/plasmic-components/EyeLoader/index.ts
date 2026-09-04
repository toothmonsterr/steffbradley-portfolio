import { EyeLoader } from './EyeLoader';

export { EyeLoader };

export const EyeLoaderMeta = {
  name: 'EyeLoader',
  displayName: 'EyeLoader',
  description:
    'Full-viewport loading overlay shown before the homepage has hydrated — two eyes with pupils that drift in a smooth circular look-around, staggered so the bottom eye follows the top. Set `hidden` once the page is ready to fade it out.',
  defaultStyles: {
    width:  '100%',
    height: '100%',
  },
  props: {
    backgroundColor: {
      type: 'color',
      defaultValueHint: '#EADBC2',
      description: 'Page background shown behind the mark',
    },
    eyeColor: {
      type: 'color',
      defaultValueHint: '#00427F',
      description: 'Eye fill color',
    },
    size: {
      type: 'number',
      defaultValueHint: 96,
      description: 'Mark size in px',
    },
    driftIntervalSec: {
      type: 'number',
      defaultValueHint: 4,
      description: 'Seconds for one full lap of the pupil\'s circular drift',
    },
    driftCascadeSec: {
      type: 'number',
      defaultValueHint: 0.35,
      description: 'Delay before the bottom eye\'s pupil starts drifting, so it follows the top eye rather than moving in lockstep',
    },
    fadeMs: {
      type: 'number',
      defaultValueHint: 320,
      description: 'Fade-out duration in ms once hidden becomes true',
    },
    hidden: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Fade the overlay out and stop blocking interaction',
    },
    grainIntensity: {
      type: 'number',
      defaultValueHint: 0.15,
      description: 'Print-grain texture over the whole splash, 0 to disable',
    },
    inkSpread: {
      type: 'number',
      defaultValueHint: 3,
      description: 'Rough ink-bleed halo dilating outward from the eye shapes, in px — 0 disables it',
    },
    inkTextureScale: {
      type: 'number',
      defaultValueHint: 0.9,
      description: 'Paper-fiber texture scale of the ink-bleed halo — lower is coarser/chunkier fiber, higher is finer grain',
    },
  },
  importPath: '@/components/plasmic-components/EyeLoader',
};
