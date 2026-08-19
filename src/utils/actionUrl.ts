const INTERNAL_ROUTE_PREFIXES = [
  '/spec',
  '/notification',
  '/dashboard',
  '/agent',
  '/workflow',
  '/artifacts',
  '/context',
  '/project',
  '/quality',
  '/monitor',
  '/cost',
  '/security-compliance',
  '/integration',
  '/system',
  '/approval-center',
];

const isInternalRoute = (pathname: string) => INTERNAL_ROUTE_PREFIXES.some(
  (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
);

export const normalizeActionUrl = (value?: string) => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//.test(value)) {
    try {
      const parsed = new URL(value);
      if (isInternalRoute(parsed.pathname)) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return value;
    }
    return value;
  }

  return value.startsWith('/') ? value : `/${value}`;
};

export const isExternalActionUrl = (value?: string) => {
  if (!value) {
    return false;
  }
  const normalized = normalizeActionUrl(value);
  return /^https?:\/\//.test(normalized);
};
