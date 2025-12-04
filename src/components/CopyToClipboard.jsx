import React, { useState } from 'react';

// placement: 'inline' | 'right'
export default function CopyToClipboard({ text, label = 'Copy', className = '', placement = 'inline' }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const doCopy = async () => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('copy failed', e);
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('clipboard fallback failed', err);
      }
    }
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: placement === 'right' ? '6px 10px' : '6px 8px',
    fontSize: 13,
    cursor: 'pointer',
    border: '1px solid #ddd',
    borderRadius: 6,
  background: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    transition: 'transform 140ms ease, background 140ms ease, box-shadow 140ms ease',
    transform: hovered ? 'scale(1.02)' : 'none'
  };

  const displayLabel = copied ? 'Copied' : (placement === 'right' ? 'Copy' : label);

  // Tooltip text
  const tooltipText = copied ? 'Copied!' : 'Copy to clipboard';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={doCopy}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={className}
        style={baseStyle}
        aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      >
        {/* icon: clipboard normally, checkmark after copy */}
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ display: 'block' }}
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
        <span>{displayLabel}</span>
      </button>

      {/* tooltip */}
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          marginBottom: 8,
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '6px 8px',
          borderRadius: 6,
          fontSize: 12,
          whiteSpace: 'nowrap',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 120ms ease, transform 120ms ease',
          pointerEvents: 'none',
          zIndex: 50,
        }}
        role="status"
        aria-hidden={!hovered}
      >
        {tooltipText}
      </div>
    </div>
  );
}
