// Simple utility for merging className strings (NativeWind/clsx style)
export function cn(...args: (string | undefined | null | false)[]) {
  return args.filter(Boolean).join(' ');
}


export function formatNumberWithCommas(value: number | string): string {
      const number = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(number)) return "0";
      return number.toLocaleString("en-NG", {
        style:'currency',
        currency:'NGN'
      });
  }