import React from 'react';
import styles from './PrimaryButton.module.css';

export interface PrimaryButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  bgColor?: string;
  textColor?: string;
  dotColorA?: string;
  dotColorB?: string;
}

export function PrimaryButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  href,
  onClick,
  className,
  bgColor,
  textColor,
  dotColorA,
  dotColorB,
}: PrimaryButtonProps) {
  const classes = [
    styles.btn,
    variant === 'danger' ? styles.danger : '',
    size !== 'md' ? styles[size] : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  const colorVars = {
    ...(bgColor    && { '--btn-bg':    bgColor }),
    ...(textColor  && { '--btn-text':  textColor }),
    ...(dotColorA  && { '--btn-dot-a': dotColorA }),
    ...(dotColorB  && { '--btn-dot-b': dotColorB }),
  } as React.CSSProperties;

  if (href) {
    return (
      <a href={href} className={classes} style={colorVars}>
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
      style={colorVars}
    >
      {children}
    </button>
  );
}
