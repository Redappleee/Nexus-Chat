import { getApiOrigin } from './api-url';

export function resolveMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = getApiOrigin();
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}
