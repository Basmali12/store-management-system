export const CURRENT_APP_VERSION = __APP_VERSION__;

export const isValidAppVersion = (value: string) => /^\d+(?:\.\d+){0,2}$/.test(value.trim());

export const fetchPublishedAppVersion = async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json?check=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json() as { version?: unknown };
    return typeof data.version === 'string' && isValidAppVersion(data.version) ? data.version : null;
  } catch {
    return null;
  }
};

export const hasNewAppVersion = (available: string | null | undefined) =>
  Boolean(available && isValidAppVersion(available) && available !== CURRENT_APP_VERSION);
