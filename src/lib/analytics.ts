export const trackEvent = (action: string, params?: Record<string, string>) => {
  window.gtag?.('event', action, params);
};
