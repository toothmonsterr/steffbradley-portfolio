import React from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import styles from './StickyNav.module.css';

export interface StickyNavProps {
  logo?: React.ReactNode;
  links?: React.ReactNode;
  scrollThreshold?: number;
  blurAmount?: string;
  className?: string;
}

export function StickyNav({
  logo,
  links,
  scrollThreshold = 80,
  blurAmount = '16px',
  className,
}: StickyNavProps) {
  const { scrollY } = useScroll();

  // Derive animated style values at the top level — not inside JSX
  const bgOpacity     = useTransform(scrollY, [0, scrollThreshold], [0, 0.75]);
  const shadowOpacity = useTransform(scrollY, [0, scrollThreshold], [0, 0.15]);
  const backgroundColor = useTransform(bgOpacity, (v) => `rgba(234, 219, 194, ${v})`);
  const boxShadow       = useTransform(shadowOpacity, (v) => `0 2px 24px rgba(32, 27, 42, ${v})`);

  const [scrolled, setScrolled] = React.useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > scrollThreshold / 2));

  return (
    <motion.nav
      className={[
        styles.nav,
        scrolled ? styles.navScrolled : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={{
        '--blur-amount': blurAmount,
        backgroundColor: backgroundColor as unknown as string,
        boxShadow: boxShadow as unknown as string,
      } as React.CSSProperties}
    >
      <div className={styles.logo}>
        {logo ?? <Link href="/">toothmonster</Link>}
      </div>
      <div className={styles.links}>
        {links}
      </div>
    </motion.nav>
  );
}
