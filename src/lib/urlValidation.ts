/**
 * Validates that a URL uses a safe scheme (http or https).
 * Prevents javascript: and other dangerous URI schemes.
 */
export const isSafeUrl = (url: string): boolean => {
  return /^https?:\/\//i.test(url.trim());
};
