import React from 'react';

export interface PrintColorbarProps {
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  color5?: string;
  color6?: string;
  swatchWidth?: number;
  swatchHeight?: number;
  className?: string;
}

export function PrintColorbar({
  color1      = '#00AEEF',
  color2      = '#EC008C',
  color3      = '#FFF200',
  color4      = '#000000',
  color5      = '#FFFFFF',
  color6      = '#000000',
  swatchWidth  = 16,
  swatchHeight = 16,
  className,
}: PrintColorbarProps) {
  const colors = [color1, color2, color3, color4, color5, color6];
  const totalW = swatchWidth * colors.length;

  return (
    <svg
      width={totalW}
      height={swatchHeight}
      viewBox={`0 0 ${totalW} ${swatchHeight}`}
      className={className}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {colors.map((c, i) => (
        <rect
          key={i}
          x={i * swatchWidth}
          y={0}
          width={swatchWidth}
          height={swatchHeight}
          fill={c}
          stroke={c.toLowerCase() === '#ffffff' || c.toLowerCase() === 'white' ? '#cccccc' : 'none'}
          strokeWidth={c.toLowerCase() === '#ffffff' || c.toLowerCase() === 'white' ? 0.5 : 0}
        />
      ))}
    </svg>
  );
}
