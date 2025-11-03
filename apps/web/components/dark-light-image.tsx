import clsx from 'clsx'
import Image, { ImageProps } from 'next/image'

type DarkLightImageProps = {
  dark: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  light?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  withPlaceholder?: boolean;
}

export function DarkLightImage({
  alt,
  dark,
  light,
  className,
  width,
  height,
  priority,
  ...props
}: DarkLightImageProps & Omit<ImageProps, 'src' | 'alt'>) {
  return (
    <>
      <Image
        alt={dark.alt ?? alt ?? ''}
        className={clsx('hidden ', className)}
        height={height ?? dark.height}
        src={dark.src}
        width={width ?? dark.width}
        priority={priority}
        {...props}
      />
      {light ? (
        <Image
          alt={light.alt ?? alt ?? ''}
          className={clsx(dark && '', className)}
          height={height ?? light.height}
          src={light.src}
          width={width ?? light.width}
          priority={priority}
          {...props}
        />
      ) : null}
    </>
  )
}

export function DarkLightImageAutoscale(props: DarkLightImageProps) {
  // Simple aspect ratio calculation based on width/height
  const aspectRatio = props.dark.width && props.dark.height 
    ? props.dark.width / props.dark.height 
    : 1;
    
  let logoStyle;

  switch (true) {
    case aspectRatio <= 1.2:
      logoStyle = 'square';
      break;
    case aspectRatio < 1.4:
      logoStyle = '4/3';
      break;
    case aspectRatio < 4:
      logoStyle = 'portrait';
      break;
    default:
      logoStyle = 'landscape';
      break;
  }

  return (
    <DarkLightImage
      priority
      alt="logo"
      className={clsx('w-auto max-w-[200px] object-contain', {
        'h-10': logoStyle === 'square',
        'h-9': logoStyle === '4/3',
        'h-8': logoStyle === 'portrait',
        'h-6': logoStyle === 'landscape',
      })}
      style={{
        aspectRatio: props.dark.width && props.dark.height 
          ? `${props.dark.width}/${props.dark.height}`
          : undefined,
      }}
      {...props}
    />
  )
}
