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
    tornTopSeed:      { type: 'number', defaultValueHint: 1,  description: 'Top tear seed — different integers give different profiles' },
    tornTopRoughness: { type: 'number', defaultValueHint: 5,  description: 'Top tear vertical variation (higher = more jagged)' },
    tornTopStepSize:  { type: 'number', defaultValueHint: 4,  description: 'Top tear horizontal step (smaller = finer tear)' },
    tornTopDepth:     { type: 'number', defaultValueHint: 4,  description: 'How deep the top tear cuts in as % of section height' },

    // Bottom tear
    tornBottom: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Torn paper edge at the bottom of the section',
    },
    tornBottomSeed:      { type: 'number', defaultValueHint: 2,  description: 'Bottom tear seed' },
    tornBottomRoughness: { type: 'number', defaultValueHint: 5,  description: 'Bottom tear vertical variation' },
    tornBottomStepSize:  { type: 'number', defaultValueHint: 4,  description: 'Bottom tear horizontal step' },
    tornBottomDepth:     { type: 'number', defaultValueHint: 4,  description: 'How deep the bottom tear cuts in as % of section height' },
  },
  importPath: '@/components/plasmic-components/TornSection',
};
