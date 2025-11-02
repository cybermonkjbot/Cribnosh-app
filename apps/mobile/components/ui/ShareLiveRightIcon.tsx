import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export function ShareLiveRightIcon(props: { color?: string; size?: number }) {
  const { color = '#E6FFE8', size = 24 } = props;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 17L20 12M20 12L15 7M20 12H8C6.93913 12 5.92172 12.4214 5.17157 13.1716C4.42143 13.9217 4 14.9391 4 16V18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
