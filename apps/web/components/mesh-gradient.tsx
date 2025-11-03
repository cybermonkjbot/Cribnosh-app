'use client'

import { MeshGradient, MeshGradientProps } from '@paper-design/shaders-react'
import { useEffect } from 'react'
import { useMobileDevice } from '@/hooks/use-mobile-device'

export function MeshGradientComponent({ speed, ...props }: MeshGradientProps) {
  const isMobile = useMobileDevice();

  useEffect(() => {
    document.body.classList.add('opacity-100')
  }, [])

  // Reduce animation speed on mobile to improve performance
  const adjustedSpeed = isMobile ? (speed ? speed / 20 : 0.125) : (speed ? speed / 10 : 0.25);

  // If on mobile, reduce the quality of the gradient
  const mobileProps = isMobile ? {
    quality: 0.5, // Reduce quality on mobile
    density: [0.8, 0.8], // Reduce density on mobile
  } : {};

  return <MeshGradient {...props} {...mobileProps} speed={adjustedSpeed} />
}
