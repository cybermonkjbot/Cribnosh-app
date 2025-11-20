import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface CustomChefEarningsIconProps {
  size?: number;
  color?: string;
}

export function CustomChefEarningsIcon({ size = 36, color = '#0B9E58' }: CustomChefEarningsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      {/* Dollar Sign Icon */}
      <Path 
        d="M18 2C9.71573 2 3 8.71573 3 17C3 25.2843 9.71573 32 18 32C26.2843 32 33 25.2843 33 17C33 8.71573 26.2843 2 18 2Z" 
        fill={color}
        opacity="0.1"
      />
      <Path 
        d="M18 2C9.71573 2 3 8.71573 3 17C3 25.2843 9.71573 32 18 32C26.2843 32 33 25.2843 33 17C33 8.71573 26.2843 2 18 2Z" 
        stroke={color}
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      {/* Dollar Sign */}
      <Path 
        d="M18 10V26M15 13H21C21.5523 13 22 13.4477 22 14C22 14.5523 21.5523 15 21 15H15M15 21H21C21.5523 21 22 21.4477 22 22C22 22.5523 21.5523 23 21 23H15" 
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path 
        d="M18 10C16.8954 10 16 10.8954 16 12C16 13.1046 16.8954 14 18 14C19.1046 14 20 14.8954 20 16C20 17.1046 19.1046 18 18 18" 
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

