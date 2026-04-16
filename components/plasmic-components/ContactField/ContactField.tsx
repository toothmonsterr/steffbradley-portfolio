import React from 'react';
import styles from './ContactField.module.css';

export interface ContactFieldProps {
  label?: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  name?: string;
  className?: string;
}

export function ContactField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  name,
  className,
}: ContactFieldProps) {
  const id = name ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}{required && ' *'}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          className={styles.textarea}
          placeholder={placeholder}
          value={value}
          required={required}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          className={styles.input}
          placeholder={placeholder}
          value={value}
          required={required}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
