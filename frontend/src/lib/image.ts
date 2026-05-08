export function shouldBypassNextImageOptimization(
  src: string | null | undefined,
) {
  if (!src) {
    return false;
  }

  try {
    const parsed = new URL(src);
    const hostname = parsed.hostname.toLowerCase();

    return (
      (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]') &&
      parsed.pathname.startsWith('/uploads/')
    );
  } catch {
    return false;
  }
}
