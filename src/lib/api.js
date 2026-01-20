// lib/api.js - API-related functions
export const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper to get JWT from localStorage (client-side only)
export const getJWT = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt');
};

// Set or clear JWT in localStorage (client-side only)
export const setJWT = (token) => {
  if (typeof window === 'undefined') throw new Error('setJWT failed. Can only be called in the browser');
  localStorage.setItem('jwt', token);
};
export const deleteJWT = () => {
  if (typeof window === 'undefined') throw new Error('deleteJWT failed. Can only be called in the browser');
  localStorage.removeItem('jwt');
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
    localStorage.setItem('userEmail', email);
    
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
  const refreshResult = await refreshJWT();
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
export const getAllTranscripts = async () => {
  const jwt = getJWT();
  try {
    const res = await fetch(`${API_BASE}/api/transcripts`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });

    if (!res.ok) {
      console.error('Failed to fetch transcripts:', res.status, res.statusText);
      return {};
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return {};
  }
};

// Fetch all SOAP notes from backend
export const getAllSoapNotes = async () => {
  const jwt = getJWT();
  try {
    const res = await fetch(`${API_BASE}/api/soap-notes`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });

    if (!res.ok) {
      console.error('Failed to fetch SOAP notes:', res.status, res.statusText);
      return {};
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching SOAP notes:', error);
    return {};
  }
};

// Fetch single SOAP note by ID
export const getSoapNoteById = async (id) => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const response = await fetch(`${API_BASE}/api/soap-notes/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch SOAP note: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching SOAP note:', error);
    throw error;
  }
};

// Fetch all patient encounters from backend
export const getAllPatientEncounters = async () => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const response = await fetch(`${API_BASE}/api/patient-encounters`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching patient encounters:', error);
    throw error;
  }
};

// Fetch complete patient encounter data (encounter + transcript + soap notes + recording)
export const getPatientEncounterComplete = async (id) => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const response = await fetch(`${API_BASE}/api/patient-encounters/complete/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch patient encounter: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching complete patient encounter:', error);
    throw error;
  }
};

// Update patient encounter (name and transcript)
export const updatePatientEncounterAndTranscript = async (id, { name, transcript_text }) => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const response = await fetch(`${API_BASE}/api/patient-encounters/${id}/update-with-transcript`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        transcript_text,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      let detailedError = `Failed to save patient encounter: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          detailedError += `\nServer response: ${errorText}`;
        }
      } catch (e) {
        // ignore error parsing response
      }
      throw new Error(detailedError);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating patient encounter:', error);
    throw error;
  }
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

// Centralized JWT refresh function
export const refreshJWT = async () => {
  try {
    const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, { 
      method: 'POST', 
      credentials: 'include' 
    });
    
    if (!refreshResponse.ok) {
      return { success: false, error: `Refresh failed: ${refreshResponse.status} ${refreshResponse.statusText}` };
    }
    
    const refreshData = await refreshResponse.json();
    const newToken = refreshData?.accessToken || refreshData?.token || null;
    
    if (!newToken) {
      return { success: false, error: 'No token returned from refresh' };
    }
    
    // Store the new token
    setJWT(newToken);
    return { success: true, token: newToken };
  } catch (error) {
    return { success: false, error: error.message };
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
      const refreshResult = await refreshJWT();
      
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
      const refreshResult = await refreshJWT();
      
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

// Fetch all dot phrases from backend
export const getAllDotPhrases = async () => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const response = await fetch(`${API_BASE}/api/dot-phrases`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dot phrases:', error);
    throw error;
  }
};

// Save transcript to backend
export const saveTranscript = async (transcriptObj) => {
  const jwt = getJWT();
  try {
    const res = await fetch(`${API_BASE}/api/transcripts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(transcriptObj)
    });

    return await res.json();
  } catch (error) {
    console.error('Error saving transcript:', error);
    return { success: false, error: error.message };
  }
};

// Save SOAP note to backend
export const saveSoapNote = async (soapNoteObj) => {
  const jwt = getJWT();
  try {
    const res = await fetch(`${API_BASE}/api/soap-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(soapNoteObj)
    });

    return await res.json();
  } catch (error) {
    console.error('Error saving SOAP note:', error);
    return { success: false, error: error.message };
  }
};

// Update SOAP note (including billing suggestion)
export const patchSoapNote = async (id, { soapNote_text }) => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const response = await fetch(`${API_BASE}/api/soap-notes/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        soapNote_text,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to save SOAP note: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating SOAP note:', error);
    throw error;
  }
};

// Create new dot phrase
export const createDotPhrase = async (dotPhraseObj) => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const response = await fetch(`${API_BASE}/api/dot-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(dotPhraseObj),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating dot phrase:', error);
    throw error;
  }
};

// Update existing dot phrase (ID in URL path)
export const updateDotPhrase = async (id, dotPhraseObj) => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const response = await fetch(`${API_BASE}/api/dot-phrases/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(dotPhraseObj),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating dot phrase:', error);
    throw error;
  }
};

// Delete transcript by ID
export const deleteTranscript = async (id) => {
  const jwt = getJWT();
  try {
    const res = await fetch(`${API_BASE}/api/transcripts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });

    return await res.json();
  } catch (error) {
    console.error('Error deleting transcript:', error);
    return { success: false, error: error.message };
  }
};

// Delete SOAP note by ID
export const deleteSoapNote = async (id) => {
  const jwt = getJWT();
  try {
    const res = await fetch(`${API_BASE}/api/soap-notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });

    return await res.json();
  } catch (error) {
    console.error('Error deleting SOAP note:', error);
    return { success: false, error: error.message };
  }
};

// Delete dot phrase by ID
export const deleteDotPhrase = async (id) => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const response = await fetch(`${API_BASE}/api/dot-phrases/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting dot phrase:', error);
    throw error;
  }
};

// Fetch recordings with attachment status filter
export const getRecordings = async ({ attached, limit = 100, offset = 0, sortBy = 'name', order = 'asc' }) => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const queryParams = new URLSearchParams({
      attached: attached.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
      sortBy,
      order
    });

    const response = await fetch(`${API_BASE}/api/recordings/attachments?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recordings:', error);
    throw error;
  }
};

// Fetch single recording by ID
export const getRecordingById = async (id) => {
  const jwt = getJWT();
  if (!jwt) {
    throw new Error('User not logged in');
  }

  try {
    const response = await fetch(`${API_BASE}/api/recordings/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recording:', error);
    throw error;
  }
};

// Search transcripts by text (client-side after fetching all)
export const searchTranscripts = async (query) => {
  const transcripts = await getAllTranscripts();
  const results = [];

  for (const [id, transcript] of Object.entries(transcripts)) {
    if (transcript.text?.toLowerCase().includes(query.toLowerCase()) ||
      transcript.chiefComplaint?.toLowerCase().includes(query.toLowerCase())) {
      results.push(transcript);
    }
  }

  return results.sort((a, b) => b.timestamp - a.timestamp);
};