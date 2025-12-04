// lib/validation.js - Validation functions

// Validate transcript data
export const validateTranscript = (transcript) => {
  if (!transcript || typeof transcript !== 'string') {
    return { valid: false, error: 'Transcript must be a non-empty string' };
  }

  if (transcript.length < 10) {
    return { valid: false, error: 'Transcript too short' };
  }

  return { valid: true };
};

// Validate SOAP note data
export const validateSoapNote = (soapNote) => {
  if (!soapNote || typeof soapNote !== 'object') {
    return { valid: false, error: 'SOAP note must be an object' };
  }

  const requiredSections = ['subjective', 'objective', 'assessment', 'plan'];

  for (const section of requiredSections) {
    if (!soapNote[section] || typeof soapNote[section] !== 'string') {
      return { valid: false, error: `Missing or invalid ${section} section` };
    }
  }

  return { valid: true };
};

// Validate audio file
export const validateAudioFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'video/webm', 'video/mp4', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
  if (!validTypes.some(type => file.type.includes(type))) {
    return { valid: false, error: 'File must be in a supported audio format (MP3, WAV, WebM, OGG, MP4, M4A)' };
  }

  const maxSize = 30 * 1024 * 1024; // 30MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 30MB' };
  }

  return { valid: true };
};

// Validate patient encounter name
export const validatePatientEncounterName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Patient encounter name is required' };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 1) {
    return { valid: false, error: 'Patient encounter name cannot be empty' };
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: 'Patient encounter name too long (max 100 characters)' };
  }

  return { valid: true };
};