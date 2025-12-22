// lib/ui.js - UI utility functions

// Debounce function for search/input
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Show toast notification (client-side only)
export const showToast = (message, type = 'info') => {
  if (typeof window === 'undefined') return;
  
  // Create toast element if it doesn't exist
  let toast = document.getElementById('enscribe-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'enscribe-toast';
    toast.className = 'enscribe-toast';
    
    // Add basic styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
  }

  // Set colors based on type
  const colors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  toast.textContent = message;
  toast.style.backgroundColor = colors[type] || colors.info;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(0)';

  // Hide after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
  }, 3000);
};

// Copy text to clipboard
export const copyToClipboard = async (text) => {
  if (typeof window === 'undefined') return false;
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'absolute';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
};

// Download text as file
export const downloadAsFile = (content, filename, mimeType = 'text/plain') => {
  if (typeof window === 'undefined') return;
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Confirm dialog helper
export const confirmDialog = (message) => {
  if (typeof window === 'undefined') return false;
  return window.confirm(message);
};