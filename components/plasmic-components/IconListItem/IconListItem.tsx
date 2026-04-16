import React from 'react';
import styles from './IconListItem.module.css';

export interface IconListItemProps {
  icon?: React.ReactNode;
  heading?: string;
  body?: string;
  className?: string;
}

export function IconListItem({ icon, heading, body, className }: IconListItemProps) {
  return (
    <div className={[styles.item, className ?? ''].filter(Boolean).join(' ')}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        {heading && <p className={styles.heading}>{heading}</p>}
        {body && <p className={styles.body}>{body}</p>}
      </div>
    </div>
  );
}
