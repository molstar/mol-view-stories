// Get version from environment variable or fallback to default
export const APP_VERSION = process.env.NEXT_PUBLIC_RELEASE_VERSION?.trim() || 'dev';
