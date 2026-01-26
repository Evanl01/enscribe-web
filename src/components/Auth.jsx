import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";

// Check auth with Tier 2 (reactive): validates JWT, attempts refresh on 401, then logs out if needed
async function checkAuthAndRedirect(navigate) {
  try {
    console.log("<Auth/> Tier 2: Validating session with reactive auth...");
    
    // Use checkAuthWithRefreshRetry: validates JWT, on 401 refreshes & retries
    const authCheck = await api.checkAuthWithRefreshRetry();
    if (!authCheck.valid) {
      console.error("<Auth/> Tier 2: Auth error:", authCheck.error);
      await api.handleSignOut();
      navigate("/login");
      return;
    }

    console.log("<Auth/> Tier 2: Session validation successful");
    return;
  } catch (err) {
    console.error("<Auth/> Tier 2: Unexpected error during session validation:", err);
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
