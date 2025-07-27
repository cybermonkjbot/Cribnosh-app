import React from 'react';

export function LiveIndicator() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 0,
      width: 32,
      height: 18,
      background: '#FF3B30',
      borderRadius: '9px',
      marginLeft: 5,
    }}>
      <span style={{
        color: '#fff',
        fontWeight: 700,
        fontSize: 11,
        lineHeight: '15px',
        fontFamily: 'inherit',
      }}>
        Live
      </span>
    </div>
  );
}
