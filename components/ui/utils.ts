// Simple utility for merging className strings (NativeWind/clsx style)
export function cn(...args: (string | undefined | null | false)[]) {
  return args.filter(Boolean).join(' ');
}
