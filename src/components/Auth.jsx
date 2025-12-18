import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";

// Directly define checkAuthAndRedirect here
async function checkAuthAndRedirect(navigate) {
  const jwt = api.getJWT();
  if (!jwt) {
    api.deleteJWT();
    navigate("/login");
    return;
  }
  
  try {
    const result = await api.checkJWTValidity();
    
    if (!result.valid) {
      console.error("<Auth/>: JWT validation failed:", result.error || result.data);
      api.deleteJWT();
      navigate("/login");
      return;
    }
    
    console.log("<Auth/>: JWT is valid:", result.data);
  } catch (err) {
    console.error("<Auth/>: Error during JWT validation:", err);
    api.deleteJWT();
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
