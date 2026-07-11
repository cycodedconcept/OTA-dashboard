export const DEFAULT_PAGE = 'devices';

export const pageRoutes = Object.freeze({
  adminAccess: '/settings',
  devices: '/devices',
  firmware: '/firmware',
  imei: '/imei',
  projects: '/projects',
});

function isBrowser() {
  return typeof window !== 'undefined';
}

function normalizePathname(pathname) {
  const normalizedPath = String(pathname || '/')
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '');

  return normalizedPath || '/';
}

export function getPagePath(pageKey) {
  return pageRoutes[pageKey] ?? pageRoutes[DEFAULT_PAGE];
}

export function getPageFromLocation(locationObject = isBrowser() ? window.location : null) {
  const pathname = normalizePathname(locationObject?.pathname ?? '/');

  return (
    Object.entries(pageRoutes).find(([, routePath]) => routePath === pathname)?.[0] ??
    DEFAULT_PAGE
  );
}

export function buildPageUrl(pageKey, searchParams = null) {
  const pathname = getPagePath(pageKey);
  const normalizedSearchParams = searchParams
    ? new URLSearchParams(searchParams)
    : new URLSearchParams();
  const searchString = normalizedSearchParams.toString();

  return searchString ? `${pathname}?${searchString}` : pathname;
}

export function navigateToPage(pageKey, options = {}) {
  if (!isBrowser()) {
    return;
  }

  const { replace = false, searchParams = null } = options;
  const nextUrl = buildPageUrl(pageKey, searchParams);
  const currentUrl = `${normalizePathname(window.location.pathname)}${window.location.search}`;

  if (nextUrl === currentUrl) {
    return;
  }

  window.history[replace ? 'replaceState' : 'pushState']({}, '', nextUrl);
}
