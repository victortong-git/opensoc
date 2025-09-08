/**
 * localStorage utilities for persistent user preferences
 * Handles errors gracefully for incognito mode and storage limitations
 */

export interface UserPreferences {
  [key: string]: any;
}

export interface PaginationPreferences {
  pageSize: number;
  currentPage: number;
  filters: Record<string, any>;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Save user preference to localStorage
 */
export const saveUserPreference = (key: string, value: any): boolean => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.warn(`Failed to save preference "${key}" to localStorage:`, error);
    return false;
  }
};

/**
 * Get user preference from localStorage
 */
export const getUserPreference = <T = any>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to load preference "${key}" from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Remove specific user preference from localStorage
 */
export const clearUserPreference = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to clear preference "${key}" from localStorage:`, error);
    return false;
  }
};

/**
 * Clear all user preferences (useful for logout/reset)
 */
export const clearAllUserPreferences = (): boolean => {
  try {
    // Only clear app-specific preferences, not all localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('alerts_') || key.includes('incidents_') || key.includes('assets_') || key.includes('threatintel_') || key.includes('playbooks_'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.warn('Failed to clear user preferences from localStorage:', error);
    return false;
  }
};

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Specific preference keys for different pages
 */
export const PREFERENCE_KEYS = {
  ALERTS: 'alerts_preferences',
  INCIDENTS: 'incidents_preferences',
  ASSETS: 'assets_preferences',
  THREAT_INTEL: 'threatintel_preferences',
  PLAYBOOKS: 'playbooks_preferences',
} as const;

/**
 * Default pagination preferences
 */
export const DEFAULT_PAGINATION_PREFERENCES: PaginationPreferences = {
  pageSize: 25,
  currentPage: 1,
  filters: {},
  searchTerm: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Save pagination preferences for a specific page
 */
export const savePaginationPreferences = (
  pageKey: keyof typeof PREFERENCE_KEYS,
  preferences: Partial<PaginationPreferences>
): boolean => {
  const key = PREFERENCE_KEYS[pageKey];
  const currentPrefs = getUserPreference(key, DEFAULT_PAGINATION_PREFERENCES);
  const updatedPrefs = { ...currentPrefs, ...preferences };
  return saveUserPreference(key, updatedPrefs);
};

/**
 * Load pagination preferences for a specific page
 */
export const loadPaginationPreferences = (
  pageKey: keyof typeof PREFERENCE_KEYS
): PaginationPreferences => {
  const key = PREFERENCE_KEYS[pageKey];
  return getUserPreference(key, DEFAULT_PAGINATION_PREFERENCES);
};