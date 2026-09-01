import React from 'react';
import styles from './CaseStudyMeta.module.css';

export interface CaseStudyMetaProps {
  platformsLabel?: string;
  platformsValue?: string;
  launchedLabel?: string;
  launchedValue?: string;
  rolesLabel?: string;
  rolesValue?: string;
  /** stacked — label above value; inline — label and value on one line */
  layout?: 'stacked' | 'inline';
  labelColor?: string;
  valueColor?: string;
  className?: string;
}

export function CaseStudyMeta({
  platformsLabel = 'Platforms:',
  platformsValue,
  launchedLabel = 'Launched:',
  launchedValue,
  rolesLabel = 'Roles:',
  rolesValue,
  layout = 'stacked',
  labelColor,
  valueColor,
  className,
}: CaseStudyMetaProps) {
  // Rows with no value are dropped entirely, so an unfilled CMS field never
  // leaves a dangling label behind.
  const rows = [
    { label: platformsLabel, value: platformsValue },
    { label: launchedLabel, value: launchedValue },
    { label: rolesLabel, value: rolesValue },
  ].filter(row => row.value && row.value.trim());

  if (rows.length === 0) {
    return null;
  }

  return (
    <dl className={[styles.meta, styles[layout], className ?? ''].filter(Boolean).join(' ')}>
      {rows.map(row => (
        <div className={styles.row} key={row.label}>
          <dt className={styles.label} style={{ color: labelColor }}>
            {row.label}
          </dt>
          <dd className={styles.value} style={{ color: valueColor }}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
