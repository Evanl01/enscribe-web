"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export default function useWakeLock() {
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState(null);

    const sentinelRef = useRef(null);
    const desiredRef = useRef(false); // whether we currently want the wake lock
    const attemptRef = useRef(0);
    const retryTimerRef = useRef(null);

    // detect support once on mount (guards SSR)
    useEffect(() => {
        setIsSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
    }, []);

    const clearRetry = () => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
    };

    // --- Fallback using a tiny looping media element (NoSleep-style) ---
    const fallbackVideoRef = useRef(null);
    const [isFallbackActive, setIsFallbackActive] = useState(false);

    // A very small silent WebM data URI can be used; fall back to empty blob if unsupported.
    const createSilentVideo = () => {
        try {
            // Create a small silent WebM via Blob — some browsers will still allow playing it after user gesture
            const blob = new Blob([], { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            const video = document.createElement("video");
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.src = url;
            video.style.width = "1px";
            video.style.height = "1px";
            video.style.position = "fixed";
            video.style.bottom = "0";
            video.style.right = "0";
            video.style.opacity = "0";
            video.setAttribute("aria-hidden", "true");
            return { video, url };
        } catch (e) {
            console.warn("createSilentVideo failed:", e);
            return null;
        }
    };

    const acquireFallback = useCallback(async () => {
        try {
            if (typeof document === "undefined") return false;
            if (fallbackVideoRef.current) return true;
            const created = createSilentVideo();
            if (!created) return false;
            const { video, url } = created;
            // Append to body
            document.body.appendChild(video);
            // Try to play - requires user gesture in many browsers
            await video.play();
            fallbackVideoRef.current = { video, url };
            setIsFallbackActive(true);
            console.debug("fallback keep-awake active");
            return true;
        } catch (e) {
            console.warn("fallback acquire failed:", e);
            setIsFallbackActive(false);
            return false;
        }
    }, []);

    const releaseFallback = useCallback(async () => {
        try {
            if (!fallbackVideoRef.current) return;
            const { video, url } = fallbackVideoRef.current;
            try {
                video.pause();
            } catch (e) { }
            try {
                if (video.parentNode) video.parentNode.removeChild(video);
            } catch (e) { }
            try {
                URL.revokeObjectURL(url);
            } catch (e) { }
        } finally {
            fallbackVideoRef.current = null;
            setIsFallbackActive(false);
        }
    }, []);

    const acquire = useCallback(async () => {
        if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
            setIsSupported(false);
            setError("Wake Lock API not supported");
            setIsActive(false);
            setIsPending(false);
            // Try fallback when API unsupported
            const fbOk = await acquireFallback().catch(() => false);
            return fbOk;
        }

        setIsPending(true);
        attemptRef.current = 0;

        try {
            desiredRef.current = true;
            const sentinel = await navigator.wakeLock.request("screen");
            sentinelRef.current = sentinel;
            setIsActive(true);
            setIsPending(false);
            setError(null);
            console.debug("wakeLock acquired", sentinel);

            // When the lock is released (by OS or browser), update state and try to re-acquire if desired
            const onRelease = () => {
                console.warn("wakeLock release event fired");
                setIsActive(false);
                // Try to re-acquire if desired (best-effort)
                if (desiredRef.current) {
                    // schedule a retry with backoff
                    attemptRef.current = 0;
                    clearRetry();
                    retryTimerRef.current = setTimeout(async function retry() {
                        attemptRef.current++;
                        const backoff = Math.min(5000 * attemptRef.current, 30000);
                        console.debug(`wakeLock retry #${attemptRef.current}, backoff=${backoff}ms`);
                        try {
                            const ok = await acquire();
                            if (!ok && attemptRef.current < 5) {
                                retryTimerRef.current = setTimeout(retry, backoff);
                            }
                        } catch (e) {
                            console.error("wakeLock retry failed:", e);
                            if (attemptRef.current < 5) retryTimerRef.current = setTimeout(retry, backoff);
                        }
                    }, 1000);
                }
            };

            sentinel.addEventListener("release", onRelease);

            return true;
        } catch (e) {
            console.error("Failed to acquire wake lock:", e);
            setError(e?.message || "Failed to acquire wake lock");
            setIsActive(false);
            setIsPending(false);
            // Try fallback before giving up
            const fbOk = await acquireFallback().catch(() => false);
            return fbOk;
        }
    }, [acquireFallback]);

    const release = useCallback(async () => {
        try {
            desiredRef.current = false;
            clearRetry();
            if (sentinelRef.current && typeof sentinelRef.current.release === "function") {
                await sentinelRef.current.release();
            }
        } catch (e) {
            console.warn("Error releasing wake lock:", e);
        } finally {
            sentinelRef.current = null;
            setIsActive(false);
            setIsPending(false);
        }
    }, []);

    useEffect(() => {
        // Try to reactivate the lock when page becomes visible again
        const onVisibilityChange = () => {
            console.debug("visibilitychange ->", document.visibilityState);
            if (document.visibilityState === "visible" && desiredRef.current && !sentinelRef.current) {
                // Re-acquire when user expects it (best-effort)
                acquire().catch((e) => console.warn("re-acquire on visibility failed:", e));
            }
        };

        const onFocus = () => {
            if (desiredRef.current && !sentinelRef.current) {
                acquire().catch((e) => console.warn("re-acquire on focus failed:", e));
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("focus", onFocus);

        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("focus", onFocus);
            // On unmount, release if we held it
            release().catch(() => { });
        };
    }, [acquire, release]);

    return {
        isSupportedWakeLock: isSupported,
        isWakeLockActive: isActive,
        isWakeLockPending: isPending,
        wakeLockError: error,
        acquireWakeLock: acquire,
        releaseWakeLock: release,
        // Fallback controls
        isFallbackWakeLockActive: isFallbackActive,
        acquireFallbackWakeLock: acquireFallback,
        releaseFallbackWakeLock: releaseFallback,
    };
}
