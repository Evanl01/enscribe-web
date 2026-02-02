// lib/api.js - API-related functions

import { STORAGE_KEYS } from '@/utils/storageConfig';

export const API_BASE = import.meta.env.VITE_API_URL || '';

// Global mutex lock for preventing concurrent session refresh attempts
let refreshPromise = null;

// Acquire mutex lock for session refresh - ensures only one refresh happens at a time
// Multiple concurrent callers will wait for the first refresh to complete
const acquireRefreshLock = async () => {
  while (refreshPromise) {
    await refreshPromise;
  }
  let releaseLock;
  refreshPromise = new Promise(resolve => {
    releaseLock = () => {
      refreshPromise = null;  // Clear the promise so next caller doesn't wait forever
      resolve();
    };
  });
  return releaseLock;
};

// Helper to get JWT from localStorage (client-side only)
export const getJWT = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.auth.jwt);
};

// Set or clear JWT in localStorage (client-side only)
export const setJWT = (token) => {
  if (typeof window === 'undefined') throw new Error('setJWT failed. Can only be called in the browser');
  localStorage.setItem(STORAGE_KEYS.auth.jwt, token);
};
export const deleteJWT = () => {
  if (typeof window === 'undefined') throw new Error('deleteJWT failed. Can only be called in the browser');
  localStorage.removeItem(STORAGE_KEYS.auth.jwt);
};

// Sign-in helper: calls server to authenticate user and set session
export const signIn = async (email, password) => {
  try {
    const resp = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/html' },
      body: JSON.stringify({ action: 'sign-in', email, password }),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body?.error || `Sign-in failed (${resp.status})`);
    }

    const body = await resp.json().catch(() => ({}));

    // Server may return token as a plain string or as an object { access_token }
    const jwt =
      typeof body?.token === 'string'
        ? body.token
        : body?.access_token || body?.token?.access_token || body?.token?.accessToken || null;

    if (!jwt) {
      throw new Error('No access token returned from server sign-in');
    }

    // Store JWT and user email
    setJWT(jwt);
    localStorage.setItem(STORAGE_KEYS.auth.userEmail, email);

    // Post message for any listeners
    window.postMessage({ type: 'EMSCRIBE_LOGIN', jwt, userEmail: email }, '*');

    return { success: true, jwt, email };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign-up helper: calls server to create new user account
export const signUp = async (email, password) => {
  try {
    const resp = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sign-up', email, password }),
    });

    const body = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      throw new Error(body?.error || `Sign-up failed (${resp.status})`);
    }

    return { success: true, message: body?.message || 'Account created successfully. Please check your email for confirmation.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resend confirmation email helper
export const resendConfirmationEmail = async (email) => {
  try {
    const resp = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend', email }),
    });

    // Always return success for security (avoid email enumeration)
    // The server should handle the actual logic and return neutral responses
    return {
      success: true,
      message: 'If an account exists for that email, a confirmation email was sent. Check your inbox and spam.'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to send confirmation now — please try again later.'
    };
  }
};

// Sign-out helper: calls server to revoke session + clear httpOnly cookie (server-side),
// then clears local client token and tries to clear any non-httpOnly cookie named "refresh_token".
// By default this helper will NOT perform a redirect; pass { redirectTo: '/login' }
// or another URL if you want the function to navigate after sign-out.
// Name chosen as `handleSignOut` to match React event-handler naming conventions.
export const handleSignOut = async ({ redirectTo } = {}) => {
  if (typeof window === 'undefined') throw new Error('handleSignOut must be called in the browser');
  const jwt = getJWT();
  const headers = { 'Content-Type': 'application/json' };
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

  try {
    // POST to server endpoint which will revoke server-side refresh token and clear the httpOnly cookie
    const res = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      credentials: 'include', // send cookie so server can revoke and clear it
      headers,
      body: JSON.stringify({ action: 'sign-out' }),
    });

    // Always clear local JWT storage regardless of server response
    try { deleteJWT(); } catch (e) { /* ignore */ }

    // Best-effort: clear non-httpOnly cookie named refresh_token (if any)
    try {
      document.cookie = 'refresh_token=; Path=/; Max-Age=0; SameSite=Lax;';
    } catch (e) { /* ignore */ }

    // If caller wants a redirect (default to /login), perform it now.
    if (redirectTo) {
      // use assign so back button behavior is normal
      try { window.location.assign(redirectTo); } catch (e) { window.location.href = redirectTo; }
      // return after initiating redirect
      return { success: res.ok, status: res.status };
    }

    if (res.ok) {
      return { success: true };
    }

    const body = await res.json().catch(() => null);
    return { success: false, status: res.status, error: body?.error || res.statusText };
  } catch (error) {
    // Network failure — still clear local state
    try { deleteJWT(); } catch (e) { /* ignore */ }
    try { document.cookie = 'refresh_token=; Path=/; Max-Age=0; SameSite=Lax;'; } catch (e) { }
    if (redirectTo) {
      try { window.location.assign(redirectTo); } catch (e) { window.location.href = redirectTo; }
      return { success: false, error: error?.message || String(error) };
    }
    return { success: false, error: error?.message || String(error) };
  }
};

// Generic fetch helper that will try the request, and on 401 attempt a single
// refresh via /api/auth/refresh (credentials included) and retry once using
// the refreshed access token. Returns the original response if refresh fails.
export const fetchWithRefresh = async (input, init = {}) => {
  // Ensure input URL has API_BASE prefix if it's a relative path starting with /api
  const url = input.startsWith('/api') ? `${API_BASE}${input}` : input;

  const makeRequest = async (token) => {
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    // default content-type if body present and not set
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const opts = { ...init, headers };
    return fetch(url, opts);
  };

  // try with existing client token if available
  let currentToken = getJWT();
  let resp = await makeRequest(currentToken);
  if (resp.status !== 401) return resp;

  // try refresh endpoint once
  const refreshResult = await refreshSession();
  if (!refreshResult.success) {
    return resp; // return original 401 response if refresh fails
  }

  // retry with new token
  try {
    resp = await makeRequest(refreshResult.token);
    return resp;
  } catch (e) {
    return resp;
  }
};

// Fetch all transcripts from backend
// Returns: { success: true, data: object } or { success: false, error: string }
export const getAllTranscripts = async () => {
  const result = await fetchWithRefreshRetry('/api/transcripts', {
    method: 'GET',
  });
  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Fetch all SOAP notes from backend
// Returns: { success: true, data: object } or { success: false, error: string }
// Fetch all SOAP notes from backend
// Returns: { success: true, data: object } or { success: false, error: string, status?: number }
export const getAllSoapNotes = async () => {
  const result = await fetchWithRefreshRetry('/api/soap-notes', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Fetch single SOAP note by ID
// Returns: { success: true, data: object } or { success: false, error: string, status?: number }
export const getSoapNoteById = async (id) => {
  const result = await fetchWithRefreshRetry(`/api/soap-notes/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Fetch single patient encounter by ID
// Returns: { success: true, data: object } or { success: false, error: string, status?: number }
export const getPatientEncounterById = async (id) => {
  const result = await fetchWithRefreshRetry(`/api/patient-encounters/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};
// Fetch all patient encounters from backend
// Returns: { success: true, data: object } or { success: false, error: string, status?: number }
export const getAllPatientEncounters = async () => {
  const result = await fetchWithRefreshRetry('/api/patient-encounters', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Fetch complete patient encounter data (encounter + transcript + soap notes + recording)
// Returns: { success: true, data: object } or { success: false, error: string, status?: number }
export const getPatientEncounterComplete = async (id) => {
  const result = await fetchWithRefreshRetry(`/api/patient-encounters/complete/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Update patient encounter (name and transcript)
// Returns: { success: true, data: object, status?: number } or { success: false, error: string, status?: number }
export const updatePatientEncounterAndTranscript = async (id, { name, transcript_text }) => {
  const result = await fetchWithRefreshRetry(`/api/patient-encounters/${id}/update-with-transcript`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      transcript_text,
    }),
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

export const checkRefreshCookie = async () => {
  try {
    const resp = await fetch(`${API_BASE}/api/auth/cookie-status`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!resp.ok) return false;
    const body = await resp.json();
    return !!body?.cookiePresent;
  } catch (e) {
    console.warn("checkRefreshCookie failed:", e);
    return false;
  }
};

// Centralized session refresh function with mutex lock
// Rotates refresh token (httpOnly cookie) and returns fresh access token (JWT)
// Ensures only one refresh happens at a time, protecting against race conditions
export const refreshSession = async () => {
  const releaseLock = await acquireRefreshLock();

  try {
    const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.json().catch(() => ({}));
      return { success: false, error: errorData?.error || `Refresh failed: ${refreshResponse.status}` };
    }

    const refreshData = await refreshResponse.json();
    const newToken = refreshData?.accessToken || null;

    if (!newToken) {
      return { success: false, error: 'No token returned from refresh' };
    }

    // Store the new token
    setJWT(newToken);
    return { success: true, token: newToken };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    releaseLock();
  }
};

// Check JWT validity with automatic refresh attempt
export const checkJWTValidity = async () => {
  const jwt = getJWT();
  if (!jwt) {
    return { valid: false, error: 'No JWT found' };
  }

  const makeValidityRequest = async (token) => {
    return fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'check-validity' }),
    });
  };

  try {
    // First attempt with current JWT
    let response = await makeValidityRequest(jwt);

    // If unauthorized (401), try to refresh the token
    if (response.status === 401) {
      console.log('JWT invalid, attempting refresh...');
      const refreshResult = await refreshSession();

      if (refreshResult.success) {
        // No need to re-check validity - refresh success means token is valid
        console.log('Token refreshed successfully');
        return {
          valid: true,
          refreshed: true,
          data: { valid: true, message: 'Token refreshed successfully' }
        };
      }

      // Refresh failed, return original error with refresh attempt info
      console.warn('Token refresh failed:', refreshResult.error);
      return {
        valid: false,
        error: `Token invalid and refresh failed: ${refreshResult.error}`,
        refreshAttempted: true
      };
    }

    // Token was valid on first try
    if (!response.ok) {
      return {
        valid: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    return { valid: data.valid || false, data };

  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Check auth with retry: validates JWT, on 401 attempts refresh, returns whether user is authenticated
// This is a pre-validation approach (validates before making the actual request)
export const checkAuthWithRetry = async () => {
  const jwt = getJWT();
  if (!jwt) {
    return { valid: false, requiresLogin: true, error: 'No JWT found' };
  }
  
  const makeValidityRequest = async (token) => {
    return fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'check-validity' }),
    });
  };

  try {
    // First attempt with current JWT
    let response = await makeValidityRequest(jwt);
    
    // If unauthorized (401), try to refresh the token
    if (response.status === 401) {
      console.log('[Auth] JWT invalid, attempting refresh...');
      const refreshResult = await refreshSession();
      
      if (refreshResult.success) {
        console.log('[Auth] Token refreshed successfully');
        return { 
          valid: true, 
          refreshed: true,
          data: { valid: true, message: 'Token refreshed successfully' }
        };
      }
      
      // Refresh failed, user needs to login
      console.warn('[Auth] Token refresh failed:', refreshResult.error);
      return { 
        valid: false, 
        requiresLogin: true,
        error: `Token invalid and refresh failed: ${refreshResult.error}`,
        refreshAttempted: true
      };
    }
    
    // Token was valid on first try
    if (!response.ok) {
      return { 
        valid: false, 
        requiresLogin: true,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    return { valid: data.valid || false, data };
    
  } catch (error) {
    return { valid: false, requiresLogin: true, error: error.message };
  }
};

// Check auth with refresh retry: validates JWT via fetchWithRefreshRetry (Tier 3)
// On 401: automatically refreshes token and retries
// Returns: { valid: boolean, data?: object, requiresLogin?: boolean, error?: string, status?: number }
export const checkAuthWithRefreshRetry = async () => {
  const jwt = getJWT();
  if (!jwt) {
    return { valid: false, requiresLogin: true, error: 'No JWT found' };
  }

  try {
    // Use Tier 3 (fetchWithRefreshRetry): try request, on 401 refresh & retry
    const result = await fetchWithRefreshRetry('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check-validity' }),
    });

    if (!result.success) {
      return {
        valid: false,
        requiresLogin: true,
        error: result.error,
        status: result.status
      };
    }

    const resp = result.response;
    if (!resp.ok) {
      return {
        valid: false,
        requiresLogin: true,
        error: `HTTP ${resp.status}: ${resp.statusText}`,
        status: resp.status
      };
    }

    const data = await resp.json();
    return { valid: data.valid || false, data };

  } catch (error) {
    return { valid: false, requiresLogin: true, error: error.message };
  }
};

// Fetch with automatic auth validation: pre-validates JWT, refreshes if needed, then makes request
export const fetchWithAuthValidation = async (input, init = {}) => {
  // First, validate and refresh auth if necessary
  const authCheck = await checkAuthWithRetry();

  if (!authCheck.valid) {
    throw new Error(authCheck.error || 'Authentication failed. Please log in again.');
  }

  // Auth is valid, get the current (possibly refreshed) JWT
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('No valid JWT available after auth check');
  }

  // Ensure input URL has API_BASE prefix if it's a relative path starting with /api
  const url = input.startsWith('/api') ? `${API_BASE}${input}` : input;

  // Make the actual request with validated token
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${jwt}`);

  // Set default content-type if body present and not set
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const opts = { ...init, headers };
  return fetch(url, opts);
};

// Helper: Decode JWT locally to extract expiry without async call
const getJWTExpiry = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    const expiryMs = decoded.exp * 1000; // Convert to milliseconds
    const timeLeft = expiryMs - Date.now();
    console.log('[getJWTExpiry] Token expiry decoded:', {
      expiryTime: new Date(expiryMs).toISOString(),
      timeLeftMs: timeLeft,
      isExpired: Date.now() >= expiryMs,
    });
    return expiryMs;
  } catch (error) {
    console.error('[getJWTExpiry] Failed to decode JWT:', error);
    return null; // Invalid token
  }
};

/**
 * Tier 3: Simple fetch with 401 refresh-retry (lightweight alternative)
 * Use for: Lightweight data fetches where proactive checks aren't needed
 * Minimizes: Complexity, only refreshes on actual 401
 * Returns: { success: true, response, status } or { success: false, error, status? }
 */
export const fetchWithRefreshRetry = async (url, options = {}) => {
  try {
    // Normalize URL
    const normalizedUrl = url.startsWith('/api') ? `${API_BASE}${url}` : url;

    // Step 1: Initial fetch attempt
    const jwt = getJWT();
    const headers = new Headers(options.headers || {});
    if (jwt) headers.set('Authorization', `Bearer ${jwt}`);
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    let response = await fetch(normalizedUrl, {
      ...options,
      headers,
    });

    // Step 1 result: non-401 error or success
    if (response.status !== 401) {
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }
      return { success: true, response, status: response.status };
    }

    // Step 2a: 401 received, attempt refresh
    const refreshResult = await refreshSession();

    if (!refreshResult.success) {
      return {
        success: false,
        error: refreshResult.error,
        status: 401,
      };
    }

    // Step 3: Refresh successful, retry fetch
    const newHeaders = new Headers(options.headers || {});
    newHeaders.set('Authorization', `Bearer ${refreshResult.token}`);
    if (options.body && !newHeaders.has('Content-Type')) {
      newHeaders.set('Content-Type', 'application/json');
    }

    response = await fetch(normalizedUrl, {
      ...options,
      headers: newHeaders,
    });

    // Step 3: Return response with status (caller checks .ok)
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    return { success: true, response, status: response.status };
  } catch (error) {
    // Network error - no HTTP status available
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      // status is undefined for network errors
    };
  }
};

// Fetch all dot phrases from backend
// Returns: { success: true, data: object } or { success: false, error: string, status?: number }
export const getAllDotPhrases = async () => {
  const result = await fetchWithRefreshRetry('/api/dot-phrases', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Save transcript to backend
// Returns: { success: true, data: object, status?: number } or { success: false, error: string, status?: number }
export const saveTranscript = async (transcriptObj) => {
  const result = await fetchWithRefreshRetry('/api/transcripts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transcriptObj)
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Save SOAP note to backend
// Returns: { success: true, data: object, status?: number } or { success: false, error: string, status?: number }
export const saveSoapNote = async (soapNoteObj) => {
  const result = await fetchWithRefreshRetry('/api/soap-notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(soapNoteObj)
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Update SOAP note (including billing suggestion)
// Update SOAP note (including billing suggestion)
// Returns: { success: true, data: object, status?: number } or { success: false, error: string, status?: number }
export const patchSoapNote = async (id, { soapNote_text }) => {
  const result = await fetchWithRefreshRetry(`/api/soap-notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ soapNote_text }),
    cache: 'no-store',
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Create new dot phrase
// Returns: { success: true, data: object, status?: number } or { success: false, error: string, status?: number }
export const createDotPhrase = async (dotPhraseObj) => {
  const result = await fetchWithRefreshRetry('/api/dot-phrases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dotPhraseObj),
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Update existing dot phrase (ID in URL path)
// Returns: { success: true, data: object } or { success: false, error: string, status?: number }
export const updateDotPhrase = async (id, dotPhraseObj) => {
  const result = await fetchWithRefreshRetry(`/api/dot-phrases/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dotPhraseObj),
  });
  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Delete transcript by ID
// Returns: { success: true, data: object, status?: number } or { success: false, error: string, status?: number }
export const deleteTranscript = async (id) => {
  const result = await fetchWithRefreshRetry(`/api/transcripts/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Delete SOAP note by ID
// Returns: { success: true, data: object, status?: number } or { success: false, error: string, status?: number }
export const deleteSoapNote = async (id) => {
  const result = await fetchWithRefreshRetry(`/api/soap-notes/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Delete dot phrase by ID
// Returns: { success: true, data: object, status?: number } or { success: false, error: string, status?: number }
export const deleteDotPhrase = async (id) => {
  const result = await fetchWithRefreshRetry(`/api/dot-phrases/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Fetch recordings with attachment status filter
export const getRecordingsByAttached = async ({ attached, limit = 100, offset = 0, sortBy = 'name', order = 'asc' }) => {
  const queryParams = new URLSearchParams({
    attached: attached.toString(),
    limit: limit.toString(),
    offset: offset.toString(),
    sortBy,
    order
  });

  const result = await fetchWithRefreshRetry(`/api/recordings/attachments?${queryParams}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Fetch single recording by ID
// Fetch single recording by ID
// Returns: { success: true, data: object, status?: number } or { success: false, error: string, status?: number }
export const getRecordingById = async (id) => {
  const result = await fetchWithRefreshRetry(`/api/recordings/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!result.success) {
    return result;
  }

  const data = await result.response.json();
  return { success: true, data, status: result.status };
};

// Search transcripts by text (client-side after fetching all)
export const searchTranscripts = async (query) => {
  const result = await getAllTranscripts();
  if (!result.success) {
    console.error('Failed to search transcripts:', result.error);
    return [];
  }
  const transcripts = result.data;
  const results = [];

  for (const [id, transcript] of Object.entries(transcripts)) {
    if (transcript.text?.toLowerCase().includes(query.toLowerCase()) ||
      transcript.chiefComplaint?.toLowerCase().includes(query.toLowerCase())) {
      results.push(transcript);
    }
  }

  return results.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Step 2: Upload file to signed URL using XHR with progress tracking
 * 
 * Use case: After obtaining a signed URL from backend, upload file directly to it
 * 
 * Why XHR:
 * - Native progress events for real-time tracking
 * - Simpler error handling than fetch streams
 * - Works with all browsers
 * 
 * Note: Signed URL is self-authenticating (no JWT needed for this operation)
 */
export const xhrUploadToSignedUrl = async (signedUrl, file, onProgress) => {
  console.log('[xhrUploadToSignedUrl] Starting XHR upload to signed URL:', {
    fileName: file.name,
    fileSize: file.size
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = {
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          };
          console.log('[xhrUploadToSignedUrl] Progress:', progress);
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('[xhrUploadToSignedUrl] Upload successful:', {
          status: xhr.status,
        });
        resolve({ status: xhr.status });
      } else {
        console.error('[xhrUploadToSignedUrl] Upload returned non-2xx status:', xhr.status);
        reject(new Error(`Upload failed: HTTP ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      console.error('[xhrUploadToSignedUrl] XHR network error');
      reject(new Error('Upload failed: network error'));
    });

    xhr.addEventListener('abort', () => {
      console.warn('[xhrUploadToSignedUrl] Upload aborted by user');
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
};

