/**
 * Token storage uses localStorage for remembered logins and sessionStorage otherwise.
 *
 * Note: Since ssr: false is configured, client checks are not needed.
 * Error handling is still included for localStorage quota errors and other edge cases.
 */

/**
 * Storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
} as const;

/**
 * Get a value from localStorage
 * @param key - The storage key
 * @returns The stored value or null if not found
 */
export function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  }
  catch (error) {
    console.error(`Error getting storage item "${key}":`, error);
    return null;
  }
}

/**
 * Set a value in localStorage
 * @param key - The storage key
 * @param value - The value to store
 * @returns true if successful, false otherwise
 */
export function setStorageItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  }
  catch (error) {
    console.error(`Error setting storage item "${key}":`, error);
    return false;
  }
}

/**
 * Remove a value from localStorage
 * @param key - The storage key
 * @returns true if successful, false otherwise
 */
export function removeStorageItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  }
  catch (error) {
    console.error(`Error removing storage item "${key}":`, error);
    return false;
  }
}

/**
 * Clear all items from localStorage
 * @returns true if successful, false otherwise
 */
export function clearStorage(): boolean {
  try {
    localStorage.clear();
    return true;
  }
  catch (error) {
    console.error("Error clearing storage:", error);
    return false;
  }
}

/**
 * Composable for token management
 * Provides convenient methods for access and refresh tokens
 */
export function useStorage() {
  const getToken = (key: string): string | null => {
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    }
    catch (error) {
      console.error(`Error getting token "${key}":`, error);
      return null;
    }
  };

  const currentTokenStorage = (): Storage => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        || sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
        ? sessionStorage
        : localStorage;
    }
    catch {
      return localStorage;
    }
  };

  const writeToken = (key: string, token: string, rememberMe?: boolean): boolean => {
    const target = rememberMe === undefined
      ? currentTokenStorage()
      : rememberMe ? localStorage : sessionStorage;
    try {
      const other = target === localStorage ? sessionStorage : localStorage;
      other.removeItem(key);
      target.setItem(key, token);
      return true;
    }
    catch (error) {
      console.error(`Error setting token "${key}":`, error);
      return false;
    }
  };

  const removeToken = (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      return true;
    }
    catch (error) {
      console.error(`Error removing token "${key}":`, error);
      return false;
    }
  };
  /**
   * Get the access token
   */
  const getAccessToken = (): string | null => {
    return getToken(STORAGE_KEYS.ACCESS_TOKEN);
  };

  /**
   * Get the refresh token
   */
  const getRefreshToken = (): string | null => {
    return getToken(STORAGE_KEYS.REFRESH_TOKEN);
  };

  /**
   * Set the access token
   */
  const setAccessToken = (token: string, rememberMe?: boolean): boolean => {
    return writeToken(STORAGE_KEYS.ACCESS_TOKEN, token, rememberMe);
  };

  /**
   * Set the refresh token
   */
  const setRefreshToken = (token: string, rememberMe?: boolean): boolean => {
    return writeToken(STORAGE_KEYS.REFRESH_TOKEN, token, rememberMe);
  };

  /**
   * Set both access and refresh tokens
   */
  const setTokens = (accessToken: string, refreshToken: string, rememberMe?: boolean): boolean => {
    const accessSuccess = setAccessToken(accessToken, rememberMe);
    const refreshSuccess = setRefreshToken(refreshToken, rememberMe);
    return accessSuccess && refreshSuccess;
  };

  /**
   * Remove the access token
   */
  const removeAccessToken = (): boolean => {
    return removeToken(STORAGE_KEYS.ACCESS_TOKEN);
  };

  /**
   * Remove the refresh token
   */
  const removeRefreshToken = (): boolean => {
    return removeToken(STORAGE_KEYS.REFRESH_TOKEN);
  };

  /**
   * Remove both access and refresh tokens
   */
  const removeTokens = (): boolean => {
    const accessSuccess = removeAccessToken();
    const refreshSuccess = removeRefreshToken();
    return accessSuccess && refreshSuccess;
  };

  /**
   * Check if tokens exist
   */
  const hasTokens = (): boolean => {
    return getAccessToken() !== null && getRefreshToken() !== null;
  };

  return {
    // Generic storage methods
    getItem: getStorageItem,
    setItem: setStorageItem,
    removeItem: removeStorageItem,
    clear: clearStorage,
    // Token-specific methods
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    setTokens,
    removeAccessToken,
    removeRefreshToken,
    removeTokens,
    hasTokens,
  };
}
