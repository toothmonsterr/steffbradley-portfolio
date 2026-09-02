import { MockupFrame } from './MockupFrame';

export { MockupFrame };

export const MockupFrameMeta = {
  name:        'MockupFrame',
  displayName: 'Mockup Frame',
  description:
    'Wraps a screenshot in a device mockup drawn entirely in CSS — no bezel images, so it stays crisp at any size and every part is restyleable. ' +
    'Set the WIDTH in the Design tab. Phone and laptop derive their own height from the real device aspect ratio, so the frame never distorts and an over-tall screenshot crops instead. ' +
    'The browser variant works differently: it is chrome only. The bar stretches across the top and the content below drives the height, so there is no fixed shape. ' +
    'Because of that, an Image inside the browser variant must NOT use fill mode — fill has no height to resolve against and the window collapses to a bare bar. Use a normal Image (width 100%, height auto) there. ' +
    'Phone and laptop DO give the screen a sized, positioned, clipping box, so fill mode with objectFit "cover" is the right choice inside those two. ' +
    'Set object-fit on the Image itself rather than here — its own prop wins over anything this component could apply. ' +
    'Bezel thickness, radii and colours all default to the real device proportions; leave the px values at 0 to keep those defaults. ' +
    'No caption prop — stack a Scotch Tape or a text block underneath instead.',
  defaultStyles: {
    width: '320px',
  },
  props: {
    children: {
      type: 'slot',
      description:
        'The screenshot. For phone and laptop use an Image in fill mode with objectFit "cover" — the screen is a sized, positioned, clipping box. ' +
        'For browser use a normal (non-fill) Image, because the window height comes from this content. Leave empty and the frame shows a grey placeholder so you can still position it.',
    },
    device: {
      type: 'choice',
      options: ['phone', 'laptop', 'browser'],
      defaultValueHint: 'phone',
      description:
        'phone and laptop are fixed-aspect: you set the width, they compute their height. browser is chrome only — bar on top, your content sets the height.',
    },

    // ─── Geometry — phone + laptop ──────────────────────────────────────────
    screenAspectRatio: {
      type: 'string',
      defaultValueHint: '9 / 19.5',
      description:
        'Override the built-in device shape — e.g. "16 / 10", "4 / 3". Leave blank to use the real device ratio (phone 9 / 19.5, laptop 16 / 10). No effect on browser, which has no fixed shape.',
      hidden: (props: { device?: string }) => props.device === 'browser',
    },
    bezel: {
      type: 'number',
      defaultValueHint: 12,
      description:
        'Bezel thickness in px. 0 means "use the device default" (phone 12, laptop 10) — for a genuinely edge-to-edge screen use 0.5.',
      hidden: (props: { device?: string }) => props.device === 'browser',
    },
    bezelColor: {
      type: 'color',
      defaultValueHint: 'var(--color-neutral-100)',
      description: 'Device body colour. Also tints the notch and the laptop hinge.',
      hidden: (props: { device?: string }) => props.device === 'browser',
    },
    bodyRadius: {
      type: 'number',
      defaultValueHint: 44,
      description:
        'Outer corner radius of the device body in px. 0 means "use the device default" (phone 44, laptop 12).',
      hidden: (props: { device?: string }) => props.device === 'browser',
    },
    screenRadius: {
      type: 'number',
      defaultValueHint: 34,
      description:
        'Inner screen corner radius in px, applied to the screenshot itself. 0 means "use the device default". Keep it roughly bodyRadius minus bezel or the corners look wrong.',
      hidden: (props: { device?: string }) => props.device === 'browser',
    },
    shadow: {
      type: 'choice',
      options: ['none', 'soft', 'lifted'],
      defaultValueHint: 'soft',
      description:
        'Drop shadow under the device, traced to its rounded silhouette. Choose none to add your own box-shadow in the Design tab instead.',
    },

    // ─── Phone only ─────────────────────────────────────────────────────────
    notch: {
      type: 'choice',
      options: ['none', 'notch', 'dynamic-island'],
      defaultValueHint: 'dynamic-island',
      description:
        'dynamic-island — floating pill. notch — the older wide cut-out hanging off the top bezel. none — a clean slab, for Android or a generic device. Scales with the frame width.',
      hidden: (props: { device?: string }) => props.device !== 'phone',
    },
    showHomeIndicator: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'The thin rounded bar at the bottom of the screen.',
      hidden: (props: { device?: string }) => props.device !== 'phone',
    },
    showSideButtons: {
      type: 'boolean',
      defaultValueHint: true,
      description:
        'Power and volume slivers on the body edges. They deliberately overhang the body outline, which is what makes it read as a phone rather than a rounded card.',
      hidden: (props: { device?: string }) => props.device !== 'phone',
    },

    // ─── Laptop only ────────────────────────────────────────────────────────
    showBase: {
      type: 'boolean',
      defaultValueHint: true,
      description:
        'The tapered deck below the lid, with a hinge notch. Turn off for a lid-only, monitor-like frame. The base adds height BELOW the screen — it never squashes the screen aspect.',
      hidden: (props: { device?: string }) => props.device !== 'laptop',
    },
    baseColor: {
      type: 'color',
      defaultValueHint: 'var(--color-neutral-50)',
      description: 'Laptop deck colour. A gradient highlight is added on top of this automatically.',
      hidden: (props: { device?: string; showBase?: boolean }) =>
        props.device !== 'laptop' || props.showBase === false,
    },

    // ─── Browser only ───────────────────────────────────────────────────────
    chromeTheme: {
      type: 'choice',
      options: ['light', 'dark'],
      defaultValueHint: 'light',
      description: 'Title bar colour scheme. Sets the bar, hairline, tab, URL pill and text together.',
      hidden: (props: { device?: string }) => props.device !== 'browser',
    },
    chromeHeight: {
      type: 'number',
      defaultValueHint: 36,
      description: 'Title bar height in px. The tab strip, when shown, adds its own height on top of this.',
      hidden: (props: { device?: string }) => props.device !== 'browser',
    },
    chromeRadius: {
      type: 'number',
      defaultValueHint: 10,
      description: 'Window corner radius in px. Applies to the bar at the top and the screenshot at the bottom.',
      hidden: (props: { device?: string }) => props.device !== 'browser',
    },
    showTrafficLights: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'The three dots at the left of the bar.',
      hidden: (props: { device?: string }) => props.device !== 'browser',
    },
    showUrlBar: {
      type: 'boolean',
      defaultValueHint: true,
      description: 'The address pill. Leave the URL text blank for an empty pill.',
      hidden: (props: { device?: string }) => props.device !== 'browser',
    },
    url: {
      type: 'string',
      defaultValue: '',
      description: 'Address text, e.g. "toothmonster.studio/work". Truncates with an ellipsis when the frame is narrow.',
      hidden: (props: { device?: string; showUrlBar?: boolean }) =>
        props.device !== 'browser' || props.showUrlBar === false,
    },
    showTab: {
      type: 'boolean',
      defaultValueHint: false,
      description: 'Add a single tab above the address row. Off by default — it adds to the chrome height.',
      hidden: (props: { device?: string }) => props.device !== 'browser',
    },
    tabLabel: {
      type: 'string',
      defaultValue: '',
      description: 'Text on the tab. Truncates when narrow.',
      hidden: (props: { device?: string; showTab?: boolean }) =>
        props.device !== 'browser' || props.showTab === false,
    },
  },
  importPath: '@/components/plasmic-components/MockupFrame',
};
