import React from 'react';
import styles from './MockupFrame.module.css';

// ─── Device geometry ────────────────────────────────────────────────────────

type Device = 'phone' | 'laptop' | 'browser';

interface DeviceGeom {
  /** CSS aspect-ratio for the screen box. Unused by `browser`, which is content-sized. */
  aspect:       string;
  /** Bezel thickness in px. */
  bezel:        number;
  /** Outer body corner radius in px. */
  bodyRadius:   number;
  /** Inner screen corner radius in px. */
  screenRadius: number;
}

// Real hardware proportions, rounded to numbers a designer can read.
// A modern phone is 1179×2556 ≈ 9/19.5. A 14" laptop lid is 3024×1964, but the
// usable screen is 16/10 once the camera housing is excluded — and 16/10 is a
// ratio people recognise.
const DEVICES: Record<Device, DeviceGeom> = {
  phone:   { aspect: '9 / 19.5', bezel: 12, bodyRadius: 44, screenRadius: 34 },
  laptop:  { aspect: '16 / 10',  bezel: 10, bodyRadius: 12, screenRadius:  4 },
  browser: { aspect: 'auto',     bezel:  0, bodyRadius: 10, screenRadius:  0 },
};

// Notch dimensions as a fraction of device WIDTH so the cut-out stays
// proportional at any size — absolute px would look like a postage stamp at
// 600px wide and a manhole at 200px. A percentage `height` resolves against
// the containing block's *height*, not its width, so height is derived from
// the percentage width via aspect-ratio instead.
const NOTCH: Record<'notch' | 'dynamic-island', { w: string; ratio: string; inset: string }> = {
  'notch':          { w: '46%', ratio: '3.2 / 1', inset: '0'    },
  'dynamic-island': { w: '30%', ratio: '6 / 1',   inset: '2.6%' },
};

// Applied to the visible silhouette (.body / .lid / .window), never to .root,
// so the shadow traces the device's rounded outline rather than a square box.
const SHADOWS: Record<'none' | 'soft' | 'lifted', string | undefined> = {
  none:   undefined,
  soft:   '0 8px 24px rgba(32, 27, 42, 0.16)',
  lifted: '0 24px 60px -12px rgba(32, 27, 42, 0.38), 0 6px 14px rgba(32, 27, 42, 0.14)',
};

// ─── Props ──────────────────────────────────────────────────────────────────

export interface MockupFrameProps {
  /** The screenshot. Phone/laptop give the screen a sized positioned box (fill mode works); browser does not. */
  children?: React.ReactNode;
  /** phone and laptop are fixed-aspect; browser is chrome only and sized by its content */
  device?: Device;

  // Geometry — phone + laptop
  /** Override the built-in device shape, e.g. "16 / 10". Blank uses the real device ratio. */
  screenAspectRatio?: string;
  /** Bezel thickness in px. 0 means "use the device default". */
  bezel?: number;
  /** Device body colour — also tints the notch and the laptop hinge */
  bezelColor?: string;
  /** Outer body corner radius in px. 0 means "use the device default". */
  bodyRadius?: number;
  /** Inner screen corner radius in px. 0 means "use the device default". */
  screenRadius?: number;
  /** Drop shadow preset, traced to the device's rounded silhouette */
  shadow?: 'none' | 'soft' | 'lifted';

  // Phone only
  /** Front-camera treatment: a floating pill, the older wide cut-out, or nothing */
  notch?: 'none' | 'notch' | 'dynamic-island';
  /** The thin rounded bar at the bottom of the screen */
  showHomeIndicator?: boolean;
  /** Power and volume slivers on the body edges — these deliberately overhang the outline */
  showSideButtons?: boolean;

  // Laptop only
  /** The tapered deck below the lid, with a hinge notch. Adds height below the screen. */
  showBase?: boolean;
  /** Laptop deck colour — a gradient highlight is layered on top of this */
  baseColor?: string;

  // Browser only
  /** Title bar colour scheme */
  chromeTheme?: 'light' | 'dark';
  /** Title bar height in px. A tab strip, when shown, adds its own height on top. */
  chromeHeight?: number;
  /** Window corner radius in px */
  chromeRadius?: number;
  /** The three dots at the left of the bar */
  showTrafficLights?: boolean;
  /** The address pill */
  showUrlBar?: boolean;
  /** Address text. Blank renders an empty pill. */
  url?: string;
  /** Add a single tab above the address row */
  showTab?: boolean;
  /** Text on the tab */
  tabLabel?: string;

  className?: string;
}

export function MockupFrame({
  children,
  device = 'phone',
  // The three px geometry props default to 0, which is the "use the device
  // default" sentinel resolved just below — so the effective default for a
  // phone is 12/44/34, which is what the Studio hints advertise. The apparent
  // mismatch between these defaults and those hints is deliberate; don't
  // "fix" it by hardcoding the phone values here, or switching device would
  // stop picking up the right geometry.
  screenAspectRatio = '',
  bezel = 0,
  bezelColor = 'var(--color-neutral-100)',
  bodyRadius = 0,
  screenRadius = 0,
  shadow = 'soft',
  notch = 'dynamic-island',
  showHomeIndicator = true,
  showSideButtons = true,
  showBase = true,
  baseColor = 'var(--color-neutral-50)',
  chromeTheme = 'light',
  chromeHeight = 36,
  chromeRadius = 10,
  showTrafficLights = true,
  showUrlBar = true,
  url = '',
  showTab = false,
  tabLabel = '',
  className,
}: MockupFrameProps) {
  const geom = DEVICES[device] ?? DEVICES.phone;

  const bezelPx        = bezel        > 0 ? bezel        : geom.bezel;
  const bodyRadiusPx   = bodyRadius   > 0 ? bodyRadius   : geom.bodyRadius;
  const screenRadiusPx = screenRadius > 0 ? screenRadius : geom.screenRadius;
  const aspect         = screenAspectRatio.trim() || geom.aspect;

  // Empty slot gets a labelled placeholder, mirroring NextImage's grey "No
  // image" box. In the browser variant it also supplies a height the window
  // would otherwise not have, so the frame stays visible and draggable in
  // Studio before anything is dropped in.
  const isEmpty = React.Children.count(children) === 0;
  const content = isEmpty
    ? <div className={styles.placeholder}>{device}</div>
    : children;

  // Every visual value travels as a custom property so the CSS module owns the
  // rules and Studio can override any single one on the instance.
  const vars = {
    ['--mf-bezel']:         `${bezelPx}px`,
    ['--mf-bezel-color']:   bezelColor,
    ['--mf-body-radius']:   `${bodyRadiusPx}px`,
    ['--mf-screen-radius']: `${screenRadiusPx}px`,
    ['--mf-shadow']:        SHADOWS[shadow] ?? 'none',
    // --mf-aspect is set only for the aspect-driven devices. The browser
    // variant never declares aspect-ratio, so leaving it unset is belt and
    // braces: a stray selector would resolve to `auto`, which is correct.
    ...(device === 'browser' ? {} : { ['--mf-aspect']: aspect }),
  } as React.CSSProperties;

  // className lands on .root so Studio's width drives the device size and its
  // box-shadow/margin/transform compose with the device. .root paints nothing
  // and never clips — the side buttons and the lifted shadow deliberately
  // extend past the body box.
  const rootClass = [styles.root, styles[device], className ?? ''].filter(Boolean).join(' ');

  // ── Browser: chrome only, sized by its content ──
  if (device === 'browser') {
    const browserVars = {
      ...vars,
      ['--mf-chrome-h']:      `${chromeHeight}px`,
      ['--mf-chrome-radius']: `${chromeRadius}px`,
    } as React.CSSProperties;

    return (
      <div className={rootClass} style={browserVars}>
        <div className={[styles.window, chromeTheme === 'dark' ? styles.dark : styles.light].join(' ')}>
          <div className={styles.chromeStack}>
            {showTab && (
              <div className={styles.tabStrip}>
                <div className={styles.tab}>{tabLabel}</div>
              </div>
            )}
            <div className={styles.chrome}>
              {showTrafficLights && (
                <div className={styles.lights}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              )}
              {showUrlBar && <div className={styles.urlBar}>{url}</div>}
            </div>
          </div>
          <div className={styles.viewport}>
            {content}
          </div>
        </div>
      </div>
    );
  }

  // ── Laptop: aspect on the lid, base adds height below it ──
  if (device === 'laptop') {
    return (
      <div className={rootClass} style={vars}>
        <div className={styles.lid}>
          <div className={styles.screen}>
            {content}
          </div>
        </div>
        {showBase && (
          <div
            className={styles.base}
            style={{ ...({ ['--mf-base-color']: baseColor } as React.CSSProperties) }}
          >
            <span className={styles.hinge} />
          </div>
        )}
      </div>
    );
  }

  // ── Phone ──
  const notchCfg = notch === 'none' ? null : NOTCH[notch];

  return (
    <div className={rootClass} style={vars}>
      <div className={styles.body}>
        {showSideButtons && (
          <>
            <span className={[styles.sideBtn, styles.sideBtnLeftTop].join(' ')} />
            <span className={[styles.sideBtn, styles.sideBtnLeftMid].join(' ')} />
            <span className={[styles.sideBtn, styles.sideBtnRight].join(' ')} />
          </>
        )}
        <div className={styles.screen}>
          {content}
        </div>
        {notchCfg && (
          <span
            className={[styles.notch, notch === 'notch' ? styles.notchWide : styles.notchIsland].join(' ')}
            style={{ ...({
              ['--mf-notch-w']:     notchCfg.w,
              ['--mf-notch-ratio']: notchCfg.ratio,
              ['--mf-notch-inset']: notchCfg.inset,
            } as React.CSSProperties) }}
          />
        )}
        {showHomeIndicator && <span className={styles.homeIndicator} />}
      </div>
    </div>
  );
}
