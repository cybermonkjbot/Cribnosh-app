import React from 'react';

interface CustomProfileIconProps {
  size?: number;
  color?: string;
}

export function CustomProfileIcon({ size = 36, color = '#0B9E58' }: CustomProfileIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 31 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M15.5287 14.4C19.7981 14.4 23.2592 11.1764 23.2592 7.2C23.2592 3.22355 19.7981 0 15.5287 0C11.2594 0 7.79834 3.22355 7.79834 7.2C7.79834 11.1764 11.2594 14.4 15.5287 14.4Z" 
        fill={color}
      />
      <path 
        opacity="0.5" 
        d="M30.9895 27.8998C30.9895 32.3733 30.9895 35.9998 15.5287 35.9998C0.0678711 35.9998 0.0678711 32.3733 0.0678711 27.8998C0.0678711 23.4263 6.98991 19.7998 15.5287 19.7998C24.0675 19.7998 30.9895 23.4263 30.9895 27.8998Z" 
        fill={color}
      />
    </svg>
  );
}

