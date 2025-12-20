import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Required fields: Email and password.");
      return;
    }
    setLoading(true);
    try {
      // Call our centralized API function which wraps the backend endpoint
      const result = await api.signUp(email, password);

      if (!result.success) {
        // Real errors (validation/network/server) are surfaced to the user.
        setError(result.error || 'Signup failed. Please try again.');
        return;
      }

      // Persist email in sessionStorage so the confirm page can auto-fill the
      // resend flow without requiring the user to re-type their address.
      try {
        sessionStorage.setItem('confirm_email', email);
      } catch (e) {
        // ignore storage errors
      }

      // Always show a neutral message and route to a page that instructs the user
      // to check their email. This prevents leaking whether the email already
      // exists in the system.
      navigate('/confirm-email');
      return;
    } catch (err) {
      // Network or unexpected errors
      setError(err?.message || 'Network error during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <style>{`
        body { font-family: Arial, sans-serif; background: #f7f7f7; }
        .signup-container { max-width: 350px; margin: 80px auto; background: #fff; padding: 32px 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .signup-container h2 { margin-bottom: 18px; }
        .signup-container input { width: 100%; padding: 10px; margin: 8px 0 16px 0; border: 1px solid #ccc; border-radius: 4px; }
        .signup-container button { width: 100%; padding: 10px; background: #1976d2; color: #fff; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
        .signup-container button:disabled { background: #aaa; }
        .error { color: #d32f2f; margin-bottom: 10px; }
      `}</style>
      <div className="signup-container">
        <h2>EmScribe Sign Up</h2>
        <div className="error" id="error">
          {error}
        </div>
        <form onSubmit={handleSignup}>
          <input
            type="email"
            id="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            id="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button id="signupBtn" type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Signup"}
          </button>
        </form>
      </div>
    </main>
  );
}
