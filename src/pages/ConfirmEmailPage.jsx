import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";

export default function ConfirmEmailPage() {
  // Initialize resendEmail with sessionStorage value
  const [resendEmail, setResendEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('confirm_email') || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  });
  
  const [info, setInfo] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  
  // Initialize cooldownSeconds with localStorage value
  const [cooldownSeconds, setCooldownSeconds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const STORAGE_KEY = 'resend_confirmation_cooldown_ts';
        const ts = Number(localStorage.getItem(STORAGE_KEY) || 0);
        if (!ts) return 0;
        const rem = Math.ceil((ts - Date.now()) / 1000);
        return rem > 0 ? rem : 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  });
  
  const navigate = useNavigate();

  // Check if user should be redirected to signup
  useEffect(() => {
    if (!resendEmail) {
      navigate('/signup');
    }
  }, [resendEmail, navigate]);

  const maskEmail = (e) => {
    if (!e || !e.includes('@')) return '';
    const [local, domain] = e.split('@');
    if (!local) return '***@' + domain;
    if (local.length <= 2) return local[0] + '***@' + domain;
    return local.slice(0, 2) + '***@' + domain;
  };

  const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
  const STORAGE_KEY = 'resend_confirmation_cooldown_ts';

  const getRemainingSeconds = () => {
    try {
      const ts = Number(localStorage.getItem(STORAGE_KEY) || 0);
      if (!ts) return 0;
      const rem = Math.ceil((ts - Date.now()) / 1000);
      return rem > 0 ? rem : 0;
    } catch (e) {
      return 0;
    }
  };

  useEffect(() => {
    // tick every second while there's remaining time
    let timer = null;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        const rem = getRemainingSeconds();
        setCooldownSeconds(rem);
        if (rem <= 0 && timer) {
          clearInterval(timer);
        }
      }, 1000);
    }

    // sync across tabs
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setCooldownSeconds(getRemainingSeconds());
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('storage', onStorage);
    };
  }, [cooldownSeconds]); // Add cooldownSeconds as dependency

  const handleResend = async (e) => {
    e && e.preventDefault();
    setInfo("");
    // prevent resending if cooldown active
    if (getRemainingSeconds() > 0) {
      setInfo(`Please wait ${getRemainingSeconds()}s before requesting another confirmation.`);
      setCooldownSeconds(getRemainingSeconds());
      return;
    }
    if (!resendEmail || !resendEmail.includes('@')) {
      setInfo('Please enter a valid email to resend confirmation.');
      return;
    }
    setResendLoading(true);
    
    const result = await api.resendConfirmationEmail(resendEmail);
    
    if (result.success) {
      setInfo(result.message);
      
      // start cooldown and persist timestamp so reloads/tabs respect it
      try {
        const ts = Date.now() + COOLDOWN_MS;
        localStorage.setItem(STORAGE_KEY, String(ts));
        setCooldownSeconds(Math.ceil(COOLDOWN_MS / 1000));
        // start a short interval to update countdown immediately
        const interval = setInterval(() => {
          const rem = getRemainingSeconds();
          setCooldownSeconds(rem);
          if (rem <= 0) clearInterval(interval);
        }, 1000);
      } catch (e) {
        // ignore localStorage errors
      }
    } else {
      setInfo(result.error);
    }
    setResendLoading(false);
  };

  return (
    <main>
      <style>{`
        body { font-family: Arial, sans-serif; background: #f7f7f7; }
        .signup-container { max-width: 420px; margin: 80px auto; background: #fff; padding: 32px 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .signup-container h2 { margin-bottom: 12px; }
        .signup-container input { width: 100%; padding: 10px; margin: 8px 0 12px 0; border: 1px solid #ccc; border-radius: 4px; }
        .signup-container button { width: 100%; padding: 10px; background: #1976d2; color: #fff; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
        .signup-container button.secondary { background: #eee; color: #111; margin-top: 8px; }
        .signup-container button:disabled { background: #aaa; }
        .info { color: #333; margin-bottom: 12px; }
      `}</style>
      <div className="signup-container">
        <h2>Email Confirmation</h2>
        <p className="info">Confirmation email sent. Please check your inbox for an email from Supabase.</p>

        <form onSubmit={handleResend}>
          <div style={{ marginBottom: 12 }}>
            {resendEmail ? (
              <div style={{ color: '#333' }}>Confirmation will be sent to <strong>{maskEmail(resendEmail)}</strong></div>
            ) : (
              <div style={{ color: '#666' }}>No email detected — please go back to signup or login.</div>
            )}
          </div>
          <button
            type="submit"
            disabled={resendLoading || cooldownSeconds > 0 || !resendEmail}
            aria-disabled={resendLoading || cooldownSeconds > 0 || !resendEmail}
          >
            {resendLoading ? 'Sending...' : (cooldownSeconds > 0 ? `Resend available in ${cooldownSeconds}s` : 'Resend confirmation')}
          </button>
        </form>

        {info && <p style={{ marginTop: 12 }} className="info">{info}</p>}

        <button className="secondary" onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    </main>
  );
}
