import { SESSION_COOKIE_NAME } from ".";

/**
 * Retrieves the session token from storage
 */
export const getSessionToken = (): string | null => {
  return localStorage.getItem(SESSION_COOKIE_NAME);
};

/**
 * Stores the session token
 */
export const setSessionToken = (token: string): void => {
  localStorage.setItem(SESSION_COOKIE_NAME, token);
};

/**
 * Clears all session data
 * Removes all authentication-related items from storage
 */
export const clearSession = (): void => {
  // Clear the specific session token
  localStorage.removeItem(SESSION_COOKIE_NAME);

  // Clear any other auth-related items
  localStorage.clear();
  sessionStorage.clear();

  // Clear any cookies
  document.cookie.split(";").forEach((cookie) => {
    document.cookie = cookie
      .replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
  });
};