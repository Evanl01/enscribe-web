import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";

// Check auth with retry: validates JWT, attempts refresh on 401, then logs out if needed
async function checkAuthAndRedirect(navigate) {
  try {
    const result = await api.checkAuthWithRetry();
    
    if (result.valid) {
      console.log("<Auth/>: Authentication successful", result.refreshed ? "(after refresh)" : "");
      return;
    }
    
    console.error("<Auth/>: Authentication failed:", result.error);
    if (result.requiresLogin) {
      // Sign out to revoke server-side session and clear tokens
      await api.handleSignOut();
      navigate("/login");
    }
  } catch (err) {
    console.error("<Auth/>: Unexpected error during auth check:", err);
    await api.handleSignOut();
    navigate("/login");
  }
}

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndRedirect(navigate);
  }, [navigate]);

  return null;
}
