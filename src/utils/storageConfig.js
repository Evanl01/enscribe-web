/**
 * Centralized localStorage configuration for Enscribe
 * All keys follow the pattern: enscribe_<camelCaseKeyName>
 */

export const STORAGE_PREFIX = 'enscribe_';

export const STORAGE_KEYS = {
  // Auth & User (shared across app, originated from SignIn page)
  auth: {
    jwt: `${STORAGE_PREFIX}jwt`,
    userEmail: `${STORAGE_PREFIX}userEmail`,
    currentUserId: `${STORAGE_PREFIX}currentUserId`,
  },

  // New Patient Encounter (form data - page-specific)
  newPatientEncounter: {
    patientEncounterName: `${STORAGE_PREFIX}patientEncounterName`,
    transcript: `${STORAGE_PREFIX}transcript`,
    soapSubjective: `${STORAGE_PREFIX}soapSubjective`,
    soapObjective: `${STORAGE_PREFIX}soapObjective`,
    soapAssessment: `${STORAGE_PREFIX}soapAssessment`,
    soapPlan: `${STORAGE_PREFIX}soapPlan`,
    billingSuggestion: `${STORAGE_PREFIX}billingSuggestion`,
    recordingFileMetadata: `${STORAGE_PREFIX}recordingFileMetadata`,
    recordingFile: `${STORAGE_PREFIX}recordingFile`,
  },

  // UI State (page-specific)
  ui: {
    dashboardActiveTab: `${STORAGE_PREFIX}dashboardActiveTab`,
  },

  // Confirm Email (page-specific)
  confirmEmail: {
    resendConfirmationCooldownTs: `${STORAGE_PREFIX}resendConfirmationCooldownTs`,
  },

  // Job tracking (for async job operations)
  jobs: {
    promptLlmJobId: `${STORAGE_PREFIX}promptLlmJobId`,
    promptLlmJobStatus: `${STORAGE_PREFIX}promptLlmJobStatus`,
  },
};

/**
 * Get all app-specific storage keys (enscribe_* prefix)
 * Used for clearing user data on logout or user switch
 */
export const getAppStorageKeys = () => {
  const keys = [];
  Object.values(STORAGE_KEYS).forEach(scope => {
    if (typeof scope === 'object') {
      keys.push(...Object.values(scope));
    }
  });
  return keys;
};

/**
 * Clear all app-specific localStorage data
 * Preserves jwt for the case of logout (backend will invalidate it)
 */
export const clearAppStorage = (preserveKeys = []) => {
  const keysToDelete = getAppStorageKeys().filter(key => !preserveKeys.includes(key));
  keysToDelete.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to clear localStorage key ${key}:`, e);
    }
  });
};

/**
 * Check if current user matches stored user
 * Returns true if user changed (should clear storage)
 */
export const hasUserChanged = (currentUserId) => {
  try {
    const storedUserId = localStorage.getItem(STORAGE_KEYS.auth.currentUserId);
    return !!(storedUserId && storedUserId !== currentUserId);
  } catch (e) {
    return false;
  }
};

/**
 * Set current user ID in storage
 */
export const setCurrentUserId = (userId) => {
  try {
    localStorage.setItem(STORAGE_KEYS.auth.currentUserId, userId);
  } catch (e) {
    console.warn('Failed to set current user ID:', e);
  }
};

/**
 * Safely parse localStorage JSON values with fallback
 * Handles both stringified and legacy plain-text data
 * @param {string} key - The localStorage key
 * @returns {string} - Parsed value or empty string
 */
export const parseStorageValue = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : "";
  } catch (e) {
    console.warn(`Failed to parse ${key}:`, e);
    // Fallback to raw value if parse fails (for legacy data)
    return localStorage.getItem(key) || "";
  }
};
