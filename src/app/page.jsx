// src/app/page.jsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return (
    <main>
      <title>Redirecting to Login</title>
      <noscript>
        <meta httpEquiv="refresh" content="0;url=/login" />
        <p>JavaScript is required for automatic redirection. <a href="/login">Go to Login</a></p>
      </noscript>
      <p>Redirecting to login...</p>
    </main>
  );
}
