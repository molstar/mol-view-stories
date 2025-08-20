// Get version from environment variable or fallback to default
const getVersion = (): string => {
  const envVersion = process.env.NEXT_PUBLIC_RELEASE_VERSION;

  // If environment variable is set and not empty, use it
  if (envVersion && envVersion.trim() !== '') {
    return envVersion.trim();
  }

  // Fallback to default version
  return '1.0.0-beta.10';
};

export const APP_VERSION = getVersion();
