import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidImageSrc(
  src: string | { src: string } | undefined
): boolean {
  if (src == null) return false;
  if (typeof src === 'string') return src.length > 0;
  return (
    typeof (src as { src: string }).src === 'string' &&
    (src as { src: string }).src.length > 0
  );
}
