import { useEffect } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/src/lib/api";

// Directly define checkAuthAndRedirect here
async function checkAuthAndRedirect(router) {
  const jwt = api.getJWT();
  if (!jwt) {
    api.deleteJWT();
    router.push("/login");
    return;
  }
  
  try {
    const result = await api.checkJWTValidity();
    
    if (!result.valid) {
      console.error("<Auth/>: JWT validation failed:", result.error || result.data);
      api.deleteJWT();
      router.push("/login");
      return;
    }
    
    console.log("<Auth/>: JWT is valid:", result.data);
  } catch (err) {
    console.error("<Auth/>: Error during JWT validation:", err);
    api.deleteJWT();
    router.push("/login");
  }
}

export default function Auth() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect(router);
  }, [router]);

  return null;
}
