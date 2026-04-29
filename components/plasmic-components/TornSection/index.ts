import { TornSection } from './TornSection';

export { TornSection };

export const TornSectionMeta = {
  name: 'TornSection',
  displayName: 'Torn Section',
  description:
    'Full-width section with a background color and optional torn-paper clip-path edges at the top and/or bottom. The tear is cut directly into the section\'s background so any color or content behind it shows through.',
  props: {
    children:   { type: 'slot', description: 'Section content' },
    background: {
      type: 'slot',
      description: 'Background layer — clipped to the torn shape. Add a solid color div, GradientBlob, NoiseOverlay, or any combination.',
    },

    // Top tear
    tornTop: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Torn paper edge at the top of the section',
    },
    tornTopRoughness: { type: 'number', defaultValueHint: 5,  description: 'Top tear vertical variation (higher = more jagged)' },
    tornTopStepSize:  { type: 'number', defaultValueHint: 4,  description: 'Top tear horizontal step (smaller = finer tear)' },
    tornTopDepthPx:   { type: 'number', defaultValueHint: 24, description: 'How deep the top tear cuts in, in px (constant regardless of section size)' },

    // Bottom tear
    tornBottom: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Torn paper edge at the bottom of the section',
    },
    tornBottomRoughness: { type: 'number', defaultValueHint: 5,  description: 'Bottom tear vertical variation' },
    tornBottomStepSize:  { type: 'number', defaultValueHint: 4,  description: 'Bottom tear horizontal step' },
    tornBottomDepthPx:   { type: 'number', defaultValueHint: 24, description: 'How deep the bottom tear cuts in, in px (constant regardless of section size)' },
  },
  importPath: '@/components/plasmic-components/TornSection',
};
