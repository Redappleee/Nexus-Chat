export function getApiOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

export function getGoogleAuthUrl(): string {
  return `${getApiOrigin()}/api/v1/auth/google`;
}
