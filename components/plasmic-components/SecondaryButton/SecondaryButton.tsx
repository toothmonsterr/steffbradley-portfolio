import React from 'react';
import styles from './SecondaryButton.module.css';

export interface SecondaryButtonProps {
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function SecondaryButton({
  children,
  size = 'md',
  disabled = false,
  href,
  onClick,
  className,
}: SecondaryButtonProps) {
  const classes = [
    styles.btn,
    size !== 'md' ? styles[size] : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
