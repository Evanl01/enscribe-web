/**
 * Error detection and categorization utilities
 */

/**
 * Detect if an error is network-related
 * Checks for common network failure patterns (connection loss, timeouts, offline, etc.)
 * @param {Error} error - The error to check
 * @returns {boolean} True if error is network-related
 */
export const isNetworkError = (error) => {
  const errorMsg = error.message?.toLowerCase() || '';
  if (error.name === 'TypeError' && errorMsg.includes('fetch')) return true;
  return errorMsg.includes('failed to fetch') ||
         errorMsg.includes('networkerror') ||
         errorMsg.includes('network error') ||
         errorMsg.includes('load failed') ||
         errorMsg.includes('connection') ||
         errorMsg.includes('offline') ||
         errorMsg.includes('timeout') ||
         errorMsg.includes('aborted');
};
