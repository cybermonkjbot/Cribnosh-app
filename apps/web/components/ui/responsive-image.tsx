import { useMobileDevice } from '@/hooks/use-mobile-device';
import { cn } from '@/lib/utils';
import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

interface ResponsiveImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  mobileSrc?: string;
  tabletSrc?: string;
  desktopSrc?: string;
  fallbackSrc?: string;
  loadingQuality?: 'low' | 'medium' | 'high';
}

export function ResponsiveImage({
  src,
  mobileSrc,
  tabletSrc,
  desktopSrc,
  fallbackSrc,
  loadingQuality = 'medium',
  alt,
  width,
  height,
  className = '',
  priority = false,
  ...props
}: ResponsiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(!priority);
  const { isMobile, isTablet } = useMobileDevice();

  useEffect(() => {
    // Determine appropriate source based on device
    if (isMobile && mobileSrc) {
      setCurrentSrc(mobileSrc);
    } else if (isTablet && tabletSrc) {
      setCurrentSrc(tabletSrc);
    } else if (!isMobile && !isTablet && desktopSrc) {
      setCurrentSrc(desktopSrc);
    } else {
      setCurrentSrc(src);
    }
  }, [isMobile, isTablet, mobileSrc, tabletSrc, desktopSrc, src]);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  const qualityMap = {
    low: { quality: 60, sizes: '100vw' },
    medium: {
      quality: 75,
      sizes: '(max-width: 480px) 95vw, (max-width: 768px) 85vw, (max-width: 1024px) 50vw, 33vw'
    },
    high: {
      quality: 85,
      sizes: '(max-width: 480px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 50vw, 33vw'
    },
  };

  const { quality, sizes } = qualityMap[loadingQuality];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100  animate-pulse rounded-lg" />
      )}

      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300 rounded-lg",
          isLoading ? "opacity-0" : "opacity-100",
          isMobile ? "blur-0" : "hover:blur-0",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        quality={quality}
        sizes={sizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        {...props}
      />
    </div>
  );
} 