import React from 'react';
import styles from './Footer.module.css';

export interface SocialLink {
  platform: string;
  url: string;
  label?: string;
}

export interface FooterProps {
  logoText?: string;
  tagline?: string;
  email?: string;
  socials?: SocialLink[];
  copyright?: string;
  className?: string;
}

const defaultSocials: SocialLink[] = [
  { platform: 'bluesky',   url: 'https://bsky.app',          label: 'bluesky'   },
  { platform: 'instagram', url: 'https://instagram.com',     label: 'instagram' },
  { platform: 'youtube',   url: 'https://youtube.com',       label: 'youtube'   },
  { platform: 'tumblr',    url: 'https://tumblr.com',        label: 'tumblr'    },
  { platform: 'itch',      url: 'https://itch.io',           label: 'itch.io'   },
  { platform: 'linkedin',  url: 'https://linkedin.com',      label: 'linkedin'  },
];

export function Footer({
  logoText = 'toothmonster',
  tagline = 'ui/ux developer & interaction designer',
  email = 'toothbops@gmail.com',
  socials = defaultSocials,
  copyright,
  className,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={[styles.footer, className ?? ''].filter(Boolean).join(' ')}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.logo}>{logoText}</span>
          {tagline && <span className={styles.tagline}>{tagline}</span>}
        </div>
        <nav className={styles.socials} aria-label="Social links">
          {socials.map((s) => (
            <a
              key={s.platform}
              href={s.url}
              className={styles.socialLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label ?? s.platform}
            >
              {s.label ?? s.platform}
            </a>
          ))}
        </nav>
      </div>
      <div className={styles.bottom}>
        <span className={styles.copy}>
          {copyright ?? `© ${year} steff bradley. all rights reserved.`}
        </span>
        {email && (
          <a href={`mailto:${email}`} className={styles.email}>
            {email}
          </a>
        )}
      </div>
    </footer>
  );
}
