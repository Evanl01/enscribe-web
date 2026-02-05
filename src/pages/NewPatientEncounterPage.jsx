import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useWakeLock from "@/hooks/useWakeLock";
import * as api from "@/lib/api";
import * as ui from "@/utils/ui.js";
import * as format from "@/utils/format.js";
import * as validation from "@/utils/validation.js";
import * as background from "@/utils/background.js";
import { isNetworkError } from "@/utils/errors.js";
import { STORAGE_KEYS, parseStorageValue } from "@/utils/storageConfig.js";
import PatientEncounterPreviewOverlay from "@/components/PatientEncounterPreviewOverlay";
import AudioPlayer from "@/components/AudioPlayer.jsx";
import { record, set } from "zod";
import ExportDataAsFileMenu from "@/components/ExportDataAsFileMenu.jsx";
import Auth from "@/components/Auth.jsx";
import CopyToClipboard from "@/components/CopyToClipboard.jsx";

export default function NewPatientEncounterPage() {
  const navigate = useNavigate();

  // Check for recordingPath URL parameter (from query string)
  const urlParams = new URLSearchParams(window.location.search);
  const urlRecordingPath = urlParams.get("recordingPath");

  // State for URL-loaded recording
  const [urlRecordingData, setUrlRecordingData] = useState(null);
  const [loadingUrlRecording, setLoadingUrlRecording] = useState(false);

  // Wake lock hook - keep screen on during on-page recording
  const {
    isSupportedWakeLock,
    isWakeLockActive,
    isWakeLockPending,
    wakeLockError,
    acquireWakeLock,
    releaseWakeLock,
  } = useWakeLock();

  // State management
  const [activeSection, setActiveSection] = useState("upload");
  const [recordingFile, setRecordingFile] = useState(null);
  const [recordingFileMetadata, setRecordingFileMetadata] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const isUploading = currentStatus?.status === "uploading-recording";

  // Persistent fields
  const [transcript, setTranscript] = useState("");
  const [soapSubjective, setSoapSubjective] = useState("");
  const [soapObjective, setSoapObjective] = useState("");
  const [soapAssessment, setSoapAssessment] = useState("");
  const [soapPlan, setSoapPlan] = useState("");
  const [billingSuggestion, setBillingSuggestion] = useState("");
  const [patientEncounterName, setPatientEncounterName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewSection, setPreviewSection] = useState("transcript");
  const [reviewedSections, setReviewedSections] = useState({
    transcript: false,
    soapNote: false,
    billingSuggestion: false,
  });

  // Flag to prevent auto-save useEffects from running before initial restoration
  const [restorationComplete, setRestorationComplete] = useState(false);

  // For rich text editing
  const handleEditableChange = (setter) => (e) => {
    setter(e.target.innerHTML);
  };

  // LocalStorage keys now use centralized config from storageConfig.js
  // Load recording file from localStorage on page mount only
  useEffect(() => {
    // Only load from localStorage if there's no URL recording being processed
    if (!urlRecordingPath && !loadingUrlRecording) {
      getLocalStorageRecordingFile().then(setRecordingFileMetadata);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore from localStorage on mount and enable Section 2 if any field exists
  useEffect(() => {
    console.log(
      "[NewPatientEncounterPage] Restoring form data from localStorage...",
    );

    const name = parseStorageValue(
      STORAGE_KEYS.newPatientEncounter.patientEncounterName,
    );
    const transcript = parseStorageValue(
      STORAGE_KEYS.newPatientEncounter.transcript,
    );
    const subjective = parseStorageValue(
      STORAGE_KEYS.newPatientEncounter.soapSubjective,
    );
    const objective = parseStorageValue(
      STORAGE_KEYS.newPatientEncounter.soapObjective,
    );
    const assessment = parseStorageValue(
      STORAGE_KEYS.newPatientEncounter.soapAssessment,
    );
    const plan = parseStorageValue(STORAGE_KEYS.newPatientEncounter.soapPlan);
    const billing = parseStorageValue(
      STORAGE_KEYS.newPatientEncounter.billingSuggestion,
    );

    console.log("[NewPatientEncounterPage] Raw localStorage values:", {
      patientEncounterName: name ? `"${name.substring(0, 50)}..."` : "empty",
      transcript: transcript ? `"${transcript.substring(0, 50)}..."` : "empty",
      soapSubjective: subjective
        ? `"${subjective.substring(0, 50)}..."`
        : "empty",
      soapObjective: objective ? `"${objective.substring(0, 50)}..."` : "empty",
      soapAssessment: assessment
        ? `"${assessment.substring(0, 50)}..."`
        : "empty",
      soapPlan: plan ? `"${plan.substring(0, 50)}..."` : "empty",
      billingSuggestion: billing ? `"${billing.substring(0, 50)}..."` : "empty",
    });

    console.log("[NewPatientEncounterPage] Restored fields (has content):", {
      patientEncounterName: name.length > 0,
      transcript: transcript.length > 0,
      soapSubjective: subjective.length > 0,
      soapObjective: objective.length > 0,
      soapAssessment: assessment.length > 0,
      soapPlan: plan.length > 0,
      billingSuggestion: billing.length > 0,
    });

    console.log(
      "[NewPatientEncounterPage] About to set state with parsed values:",
      {
        name: name.substring(0, 50),
        transcript: transcript.substring(0, 50),
        subjective: subjective.substring(0, 50),
        objective: objective.substring(0, 50),
        assessment: assessment.substring(0, 50),
        plan: plan.substring(0, 50),
        billing: billing.substring(0, 50),
      },
    );

    setPatientEncounterName(name);
    setTranscript(transcript);
    setSoapSubjective(subjective);
    setSoapObjective(objective);
    setSoapAssessment(assessment);
    setSoapPlan(plan);
    setBillingSuggestion(billing);

    console.log("[NewPatientEncounterPage] State setters called");

    // If any field has data, enable section 2
    const hasData =
      name.trim() ||
      transcript.trim() ||
      subjective.trim() ||
      objective.trim() ||
      assessment.trim() ||
      plan.trim() ||
      billing.trim();

    if (hasData) {
      console.log(
        "[NewPatientEncounterPage] Found restored data, expanding Section 2",
      );
      setSoapNoteRequested(true);
    } else {
      console.log(
        "[NewPatientEncounterPage] No saved form data found in localStorage",
      );
    }

    // Mark restoration as complete - NOW auto-save useEffects can run
    setRestorationComplete(true);
    console.log(
      "[NewPatientEncounterPage] Restoration complete, auto-save effects enabled",
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle URL recording parameter
  useEffect(() => {
    const loadRecordingFromUrl = async () => {
      if (!urlRecordingPath) {
        // No URL recording, allow localStorage loading
        setLoadingUrlRecording(false);
        return;
      }

      setLoadingUrlRecording(true);
      try {
        // Create signed URL for the recording using api singleton
        const result = await api.fetchWithRefreshRetry(
          "/api/recordings/create-signed-url",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: urlRecordingPath }),
          },
        );

        if (!result.success) {
          console.error(
            "Error creating signed URL for URL recording:",
            result.error,
          );
          alert(
            "Failed to load recording from URL. Please try again or upload the file manually.",
          );
          setLoadingUrlRecording(false);
          return;
        }

        const response = result.response;
        if (!response.ok) {
          console.error(
            "Error creating signed URL for URL recording:",
            response.statusText,
          );
          alert(
            "Failed to load recording from URL. Please try again or upload the file manually.",
          );
          setLoadingUrlRecording(false);
          return;
        }

        const signedUrlData = await response.json();
        if (!signedUrlData?.signedUrl) {
          console.error(
            "Error creating signed URL for URL recording: no signedUrl in response",
          );
          alert(
            "Failed to load recording from URL. Please try again or upload the file manually.",
          );
          setLoadingUrlRecording(false);
          return;
        }
        // Extract filename from path
        const fileName =
          format.extractRecordingFilenameFromPath(urlRecordingPath);

        // Create metadata object similar to upload flow
        const metadata = {
          path: urlRecordingPath,
          signedUrl: signedUrlData.signedUrl,
          name: fileName,
          // Note: size and duration not available from URL, but path is most important
          fromUrl: true, // Flag to indicate this came from URL
        };

        // Store in localStorage like the upload flow does
        localStorage.setItem(
          STORAGE_KEYS.newPatientEncounter.recordingFileMetadata,
          JSON.stringify(metadata),
        );

        // Set both URL recording data and recordingFileMetadata for consistency
        setUrlRecordingData(metadata);
        setRecordingFileMetadata(metadata);

        // Note: We enable the SOAP note section but don't automatically open it
        // User should stay on section 1 to see the loaded recording and click "Generate SOAP Note"
        setSoapNoteRequested(true);
        // Keep user on section 1 (upload) to see the loaded recording

        console.log("Loaded recording from URL and saved to localStorage:", {
          path: urlRecordingPath,
          fileName,
          signedUrl: signedUrlData.signedUrl,
          metadata,
        });
      } catch (error) {
        console.error("Error loading recording from URL:", error);
        alert(
          "Failed to load recording from URL. Please try again or upload the file manually.",
        );
      } finally {
        setLoadingUrlRecording(false);
      }
    };

    loadRecordingFromUrl();
  }, [
    urlRecordingPath,
    STORAGE_KEYS.newPatientEncounter.recordingFileMetadata,
  ]); // Remove supabase from dependency array since it's stable

  // Save to localStorage on change (with JSON stringify for proper serialization)
  // Only run AFTER restoration is complete to avoid overwriting with empty initial state
  useEffect(() => {
    if (!restorationComplete) return;
    localStorage.setItem(
      STORAGE_KEYS.newPatientEncounter.patientEncounterName,
      JSON.stringify(patientEncounterName),
    );
  }, [
    patientEncounterName,
    STORAGE_KEYS.newPatientEncounter.patientEncounterName,
    restorationComplete,
  ]);
  useEffect(() => {
    if (!restorationComplete) return;
    localStorage.setItem(
      STORAGE_KEYS.newPatientEncounter.transcript,
      JSON.stringify(transcript),
    );
  }, [
    transcript,
    STORAGE_KEYS.newPatientEncounter.transcript,
    restorationComplete,
  ]);
  useEffect(() => {
    if (!restorationComplete) return;
    localStorage.setItem(
      STORAGE_KEYS.newPatientEncounter.soapSubjective,
      JSON.stringify(soapSubjective),
    );
  }, [
    soapSubjective,
    STORAGE_KEYS.newPatientEncounter.soapSubjective,
    restorationComplete,
  ]);
  useEffect(() => {
    if (!restorationComplete) return;
    localStorage.setItem(
      STORAGE_KEYS.newPatientEncounter.soapObjective,
      JSON.stringify(soapObjective),
    );
  }, [
    soapObjective,
    STORAGE_KEYS.newPatientEncounter.soapObjective,
    restorationComplete,
  ]);
  useEffect(() => {
    if (!restorationComplete) return;
    localStorage.setItem(
      STORAGE_KEYS.newPatientEncounter.soapAssessment,
      JSON.stringify(soapAssessment),
    );
  }, [
    soapAssessment,
    STORAGE_KEYS.newPatientEncounter.soapAssessment,
    restorationComplete,
  ]);
  useEffect(() => {
    if (!restorationComplete) return;
    localStorage.setItem(
      STORAGE_KEYS.newPatientEncounter.soapPlan,
      JSON.stringify(soapPlan),
    );
  }, [
    soapPlan,
    STORAGE_KEYS.newPatientEncounter.soapPlan,
    restorationComplete,
  ]);
  useEffect(() => {
    if (!restorationComplete) return;
    localStorage.setItem(
      STORAGE_KEYS.newPatientEncounter.billingSuggestion,
      JSON.stringify(billingSuggestion),
    );
  }, [
    billingSuggestion,
    STORAGE_KEYS.newPatientEncounter.billingSuggestion,
    restorationComplete,
  ]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingDurationRef = useRef(0);
  const [isSaving, setIsSaving] = useState(false);

  // New: Track if save was attempted
  const [saveAttempted, setSaveAttempted] = useState(false);

  // Track if SOAP note generation has started
  const [soapNoteRequested, setSoapNoteRequested] = useState(false);

  // Error message for missing fields
  const [errorMessage, setErrorMessage] = useState("");

  // Cache incognito/localStorage/cookie checks to run once on mount
  const [incognitoStatus, setIncognitoStatus] = useState(null);
  const [storageQuotaInfo, setStorageQuotaInfo] = useState(null);
  const [cookiesWork, setCookiesWork] = useState(null);
  const [localStorageAccessible, setLocalStorageAccessible] = useState(null);
  // Cache Supabase auth/session info on mount to avoid "split-brain" later
  const [
    refreshTokenCookieAvailableOnMount,
    setRefreshTokenCookieAvailableOnMount,
  ] = useState(null);
  const [jwtOnMount, setJwtOnMount] = useState(null);

  // Run storage/cookie/incognito checks once when the page mounts so
  // subsequent flows can use cached results (helps with incognito detection)
  const isMountedRef = useRef(true);

  const runStartupChecks = useCallback(async () => {
    try {
      const inc = await detectIncognitoMode();
      const storage = await getStorageQuota();
      // Check for server-visible refresh cookie (HttpOnly cookies not visible to JS)
      const refreshCookieExists = await api.checkRefreshCookie();

      let lsOk = true;
      try {
        localStorage.setItem("enscribe_localstorage_test", "1");
        localStorage.removeItem("enscribe_localstorage_test");
        lsOk = true;
      } catch (e) {
        lsOk = false;
      }

      // JWT and refresh token checks for incognito detection
      let jwt = null;
      let refreshTokenCookieAvailable = false;
      let effectiveCookies = false;

      try {
        jwt = api.getJWT();
        refreshTokenCookieAvailable = !!refreshCookieExists;
        // effectiveCookies represents whether cookies generally worked and the refresh cookie is present
        effectiveCookies = refreshCookieExists;
      } catch (e) {
        console.warn("JWT/refreshCookie checks failed:", e);
        jwt = null;
        refreshTokenCookieAvailable = false;
        effectiveCookies = false;
      }

      const result = {
        incognitoStatus: inc,
        storageQuotaInfo: storage,
        cookiesWork: effectiveCookies,
        localStorageAccessible: lsOk,
        refreshTokenCookieAvailable,
        jwtPresent: !!jwt,
      };

      if (isMountedRef.current) {
        setRefreshTokenCookieAvailableOnMount(refreshTokenCookieAvailable);
        setJwtOnMount(jwt || null);
        setCookiesWork(effectiveCookies);
        setIncognitoStatus(inc);
        setStorageQuotaInfo(storage);
        setLocalStorageAccessible(lsOk);
      }

      console.log("Startup checks:", result);
      return result;
    } catch (e) {
      const errorResult = {
        incognitoStatus: null,
        storageQuotaInfo: null,
        cookiesWork: false,
        localStorageAccessible: false,
        refreshTokenCookieAvailable: false,
        jwtPresent: false,
      };

      if (isMountedRef.current) {
        setIncognitoStatus(null);
        setStorageQuotaInfo(null);
        setCookiesWork(false);
        setLocalStorageAccessible(false);
        setRefreshTokenCookieAvailableOnMount(false);
        setJwtOnMount(null);
      }

      return errorResult;
    }
  }, []);

  const handleAuthError = useCallback(
    (diagnosticData) => {
      console.error(
        "[handleAuthError] Authentication failed - diagnostic analysis:",
        diagnosticData,
      );

      let errorMessage = "You must be logged in to upload recordings.";

      if (diagnosticData.isIncognito === "localhost-incognito") {
        errorMessage =
          "Your session has expired in incognito/private mode on localhost.\n\n" +
          "Note: Localhost has relaxed incognito restrictions, but session tokens may still expire. " +
          "Please log in again.";
      } else if (
        diagnosticData.isIncognito === true &&
        diagnosticData.jwtPresent
      ) {
        errorMessage =
          "Your session has expired in incognito/private mode.\n\n" +
          "Incognito mode blocks refresh token cookies needed to maintain long sessions. " +
          "Please log in again or use normal browsing mode for better session persistence.";
      } else if (diagnosticData.isIncognito === true) {
        errorMessage +=
          "\n\nIncognito/Private mode detected. This may cause authentication issues due to restricted cookies and storage.";
      } else if (diagnosticData.isIncognito === "localhost-normal") {
        errorMessage +=
          "\n\nRunning on localhost with relaxed incognito restrictions.";
      } else if (!diagnosticData.jwtPresent) {
        errorMessage += "\n\nPlease log in to continue.";
      }

      alert(errorMessage);
      api.handleSignOut();
      navigate("/login");
      return;
    },
    [navigate],
  );
  useEffect(() => {
    isMountedRef.current = true;

    runStartupChecks().then((diagnosticData) => {
      console.log(
        "[NewPatientEncounter] Startup checks complete:",
        diagnosticData,
      );

      // Only show error if incognito mode is detected (storage actually restricted)
      // Don't block on other checks - they're just informational
      if (diagnosticData.isIncognito === true) {
        console.warn("[NewPatientEncounter] Actual incognito mode detected");
        handleAuthError(diagnosticData);
        return;
      }

      // Log other conditions for debugging but don't block
      if (diagnosticData.isIncognito === "localhost-incognito") {
        console.warn("[NewPatientEncounter] Localhost incognito detected");
      }
      if (diagnosticData.localStorageAccessible === false) {
        console.warn("[NewPatientEncounter] localStorage not accessible");
      }
      if (diagnosticData.jwtPresent === false) {
        console.warn("[NewPatientEncounter] JWT not present");
      }
    });

    return () => {
      isMountedRef.current = false;
    };
  }, [navigate, runStartupChecks, handleAuthError]);

  // Recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  const getLocalStorageRecordingFile = async () => {
    const metadataStr = localStorage.getItem(
      STORAGE_KEYS.newPatientEncounter.recordingFileMetadata,
    );
    if (!metadataStr) return null;

    try {
      const metadata = JSON.parse(metadataStr);

      // Get a signed URL from backend using refresh-retry auth
      try {
        console.log("localStorage Metadata:", metadata);
        console.log(
          "[getLocalStorageRecordingFile] Fetching signed URL for stored recording:",
          metadata.path,
        );
        const result = await api.fetchWithRefreshRetry(
          "/api/recordings/create-signed-url",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: metadata.path }),
          },
        );

        if (!result.success) {
          console.warn(
            "Error creating signed URL for stored recording:",
            result.error,
          );
          // Return metadata without signed URL
          return {
            ...metadata,
            signedUrl: null,
            name:
              metadata.path && typeof metadata.path === "string"
                ? metadata.path.split("/")[metadata.path.split("/").length - 1]
                : "recording.webm",
          };
        }

        const response = result.response;
        if (!response.ok) {
          console.warn(
            "Error creating signed URL for stored recording:",
            response.statusText,
          );
          // Return metadata without signed URL
          return {
            ...metadata,
            signedUrl: null,
            name:
              metadata.path && typeof metadata.path === "string"
                ? metadata.path.split("/")[metadata.path.split("/").length - 1]
                : "recording.webm",
          };
        }

        const signedUrlData = await response.json();
        console.log(
          "[getLocalStorageRecordingFile]: recordingFileMetadata:",
          metadata,
          "signedUrl:",
          signedUrlData.signedUrl,
          "isuploading:",
          isUploading,
        );
        return {
          ...metadata,
          signedUrl: signedUrlData.signedUrl,
          name:
            metadata.path && typeof metadata.path === "string"
              ? metadata.path.split("/")[metadata.path.split("/").length - 1]
              : "recording.webm",
          // size and duration are now included from stored metadata
        };
      } catch (error) {
        console.error("Error creating signed URL for stored recording:", error);
        // Return metadata without signed URL
        return {
          ...metadata,
          signedUrl: null,
          name:
            metadata.path && typeof metadata.path === "string"
              ? metadata.path.split("/")[metadata.path.split("/").length - 1]
              : "recording.webm",
        };
      }
    } catch (e) {
      console.error("Error parsing recording file metadata:", e);
      return null;
    }
  };
  // useEffect(() => {
  //   background.debugElements({
  //     currentStatus,
  //     isProcessing,
  //     isUploading,
  //     soapNoteRequested,
  //     recordingFileMetadata,
  //     isRecording,
  //     transcript,
  //     soapSubjective,
  //     soapObjective,
  //     soapAssessment,
  //     soapPlan,
  //     billingSuggestion,
  //     patientEncounterName,
  //     audioDuration,
  //     audioCurrentTime,
  //     audioLoadingState,
  //     isSaving,
  //     saveAttempted,
  //     errorMessage,
  //   });
  // }, [
  //   currentStatus,
  //   isProcessing,
  //   isUploading,
  //   soapNoteRequested,
  //   recordingFileMetadata,
  //   isRecording,
  //   transcript,
  //   soapSubjective,
  //   soapObjective,
  //   soapAssessment,
  //   soapPlan,
  //   billingSuggestion,
  //   patientEncounterName,
  //   audioDuration,
  //   audioCurrentTime,
  //   audioLoadingState,
  //   isSaving,
  //   saveAttempted,
  //   errorMessage,
  // ]);

  // File validation
  const validateFile = (file) => {
    const validTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/webm",
      "audio/ogg",
      "video/webm",
      "video/mp4",
      "video/mp4", // Add MP4 support
      "audio/mp4", // Add MP4 audio support
      "audio/m4a", // Add M4A support
      "audio/x-m4a", // Add alternative M4A MIME type
    ];
    if (!validTypes.some((type) => file.type.includes(type))) {
      return "File must be in a supported audio format (MP3, WAV, WebM, OGG, MP4, M4A)";
    }
    if (file.size > 100 * 1024 * 1024) {
      // 100MB
      return "File size must be less than 100MB";
    }
    return null;
  };

  // Poll for file accessibility on Supabase (verify upload is complete and accessible)
  const pollForFileAccessibility = async (signedUrl, maxWaitMs = 5000) => {
    console.log(
      "[pollForFileAccessibility] Starting poll for URL accessibility:",
      {
        url: signedUrl.substring(0, 50) + "...",
        maxWaitMs,
      },
    );

    return new Promise((resolve) => {
      let isResolved = false;
      const startTime = Date.now();
      const pollIntervalMs = 500;

      // Wait 500ms offset before first poll to let Supabase process
      const initialDelay = setTimeout(() => {
        const poll = setInterval(() => {
          const elapsedMs = Date.now() - startTime;

          // Check if we've exceeded timeout
          if (elapsedMs > maxWaitMs) {
            console.warn(
              "[pollForFileAccessibility] Timeout reached, stopping poll",
            );
            clearInterval(poll);
            if (!isResolved) {
              isResolved = true;
              resolve(false); // Return false on timeout
            }
            return;
          }

          // Attempt to fetch file headers to verify accessibility
          fetch(signedUrl, { method: "HEAD" })
            .then((response) => {
              console.log("[pollForFileAccessibility] HEAD request returned:", {
                status: response.status,
                ok: response.ok,
                elapsedMs,
              });

              if (response.ok && !isResolved) {
                isResolved = true;
                clearInterval(poll);
                clearTimeout(initialDelay);
                console.log(
                  "[pollForFileAccessibility] File is accessible, stopping poll",
                );
                resolve(true);
              }
            })
            .catch((error) => {
              console.log(
                "[pollForFileAccessibility] HEAD request failed (expected during polling):",
                {
                  error: error.message,
                  elapsedMs,
                },
              );
              // Continue polling on error
            });
        }, pollIntervalMs);
      }, 500); // 500ms initial offset
    });
  };

  // Get audio duration
  const getAudioDuration = async (file) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      const cleanup = () => {
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
        audio.removeEventListener("error", onError);
        if (audio.src) URL.revokeObjectURL(audio.src);
      };

      console.log("Getting audio duration for file:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      const fallbackDuration = () => {
        // Try ref first to avoid stale state
        const duration = recordingDurationRef.current;
        setRecordingDuration(duration);
        if (duration > 0) {
          console.warn(`Using recordingDurationRef: ${duration} seconds`);
          return duration;
        }
        // As last resort, estimate based on size (~1 KB ≈ 1 sec for WebM)
        const estimated = Math.max(1, file.size / 1024);
        console.warn(`Using estimated duration: ${estimated} seconds`);
        return estimated;
      };

      const onLoadedMetadata = () => {
        cleanup();
        if (isFinite(audio.duration) && audio.duration > 0) {
          console.log("Audio duration obtained:", audio.duration);
          resolve(audio.duration);
        } else {
          resolve(fallbackDuration());
        }
      };

      const onError = () => {
        cleanup();
        resolve(fallbackDuration());
      };

      audio.addEventListener("loadedmetadata", onLoadedMetadata);
      audio.addEventListener("error", onError);
      audio.src = URL.createObjectURL(file);

      // Timeout after 10s
      setTimeout(() => {
        cleanup();
        resolve(fallbackDuration());
      }, 10000);
    });
  };

  // Helper function to detect incognito/private browsing mode
  const detectIncognitoMode = async () => {
    try {
      // Simple test: try to write to localStorage
      const testKey = "incognito-test-" + Math.random();
      try {
        localStorage.setItem(testKey, "test");
        localStorage.removeItem(testKey);
        // If we got here, localStorage works fine - not in incognito
        return false;
      } catch (e) {
        // localStorage is restricted - likely incognito mode
        return true;
      }
    } catch (e) {
      // If we can't determine, assume normal mode
      return false;
    }
  };

  // Helper to get storage quota information
  const getStorageQuota = async () => {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          quota: Math.round(estimate.quota / (1024 * 1024)) + "MB",
          usage: Math.round(estimate.usage / (1024 * 1024)) + "MB",
          available:
            Math.round((estimate.quota - estimate.usage) / (1024 * 1024)) +
            "MB",
        };
      }
      return null;
    } catch (e) {
      return { error: e.message };
    }
  };

  // Helper to test third-party cookie functionality
  const testThirdPartyCookies = async () => {
    try {
      // Test if we can set a cookie
      document.cookie = "test-cookie=test-value; SameSite=None; Secure";
      const cookieSet = document.cookie.includes("test-cookie=test-value");

      // Clean up
      document.cookie =
        "test-cookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";

      return cookieSet;
    } catch (e) {
      return false;
    }
  };

  // Helper function to clear all auth-related storage when sessions get corrupted
  const clearAllAuthState = async () => {
    try {
      // Supabase sessions are now managed by singleton in api.js
      // Just clear localStorage and sessionStorage entries
      Object.keys(localStorage).forEach((key) => {
        if (
          key.includes("supabase") ||
          key.includes("sb-") ||
          key.includes("auth")
        ) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage entries
      Object.keys(sessionStorage).forEach((key) => {
        if (
          key.includes("supabase") ||
          key.includes("sb-") ||
          key.includes("auth")
        ) {
          sessionStorage.removeItem(key);
        }
      });

      // Clear API JWT
      api.deleteJWT();

      console.log("[clearAllAuthState] Cleared all authentication state");
    } catch (e) {
      console.error("[clearAllAuthState] Error clearing auth state:", e);
    }
  };

  // Helper: call server refresh endpoint and return accessToken (or null)
  const refreshAndGetAccessToken = async () => {
    try {
      const resp = await api.fetchWithRefresh("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!resp.ok) {
        return null;
      }
      console.log("refreshAndGetAccessToken response:", resp);
      const body = await resp.json();
      return body?.accessToken || null;
    } catch (e) {
      console.error("refreshAndGetAccessToken error:", e);
      return null;
    }
  };
  // Wrapper around two-step upload process: get signed URL + XHR upload
  const uploadWithReactiveAuth = async (filePath, file, onProgress) => {
    try {
      // Step 1: Get signed URL from backend using Tier 3 (refresh-retry) auth
      console.log("[uploadWithReactiveAuth] Step 1: Fetching signed URL...");
      const result = await api.fetchWithRefreshRetry(
        "/api/recordings/create-signed-upload-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: filePath }),
        },
      );

      if (!result.success) {
        throw new Error(`Failed to get signed URL: ${result.error}`);
      }

      const signedUrlResponse = result.response;
      if (!signedUrlResponse.ok) {
        const errorData = await signedUrlResponse.json().catch(() => ({}));
        throw new Error(
          `Failed to get signed URL: ${errorData.message || signedUrlResponse.statusText}`,
        );
      }

      const { signedUrl, path } = await signedUrlResponse.json();
      console.log("[uploadWithReactiveAuth] Step 1 complete, got signed URL");

      // Step 2: Upload file to signed URL using XHR with progress tracking
      console.log(
        "[uploadWithReactiveAuth] Step 2: Uploading to signed URL via XHR...",
      );
      await api.xhrUploadToSignedUrl(signedUrl, file, onProgress);
      console.log(
        "[uploadWithReactiveAuth] Step 2 complete, upload successful",
      );

      return { data: { path, id: filePath }, error: null };
    } catch (error) {
      // Handle specific error: file too large (413)
      const message = error?.message;
      if (
        message?.includes("exceeded the maximum allowed size") ||
        message?.includes("File too large")
      ) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const fileTooLargeError = new Error(
          `File too large (${fileSizeMB}MB). Maximum allowed size is 100MB.`,
        );
        return {
          data: null,
          error: fileTooLargeError,
          isFileTooLarge: true,
        };
      }
      // Return error structure for other errors
      return {
        data: null,
        error: error,
        requiresLogin: error?.message?.includes("not authenticated"),
      };
    }
  };
  // Helper to reset file input
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle file upload
  const handleRecordingFileUpload = async (file) => {
    if (!file) return;

    // Validate file type and size FIRST, before any async operations
    const validationError = validateFile(file);
    if (validationError) {
      console.error(
        "[handleRecordingFileUpload] Validation failed:",
        validationError,
      );
      alert(validationError);
      resetFileInput();
      return;
    }

    try {
      // Check duration - log warning but don't block (file size is the actual constraint)
      const duration = await getAudioDuration(file);
      if (duration > 40 * 60) {
        // 40 minutes
        const durationWarning = `Recording duration (${Math.round(duration / 60)} minutes) exceeds typical 40-minute limit`;
        console.warn(
          "[handleRecordingFileUpload] Duration warning:",
          durationWarning,
        );
        // Proceed with upload - file size enforcement takes precedence
      }
      console.log("File metadata:", {
        name: file.name,
        size: file.size,
        type: file.type,
        duration,
      });
      // Show uploading status with 0% progress
      setCurrentStatus({
        status: "uploading-recording",
        message: "Uploading recording",
        progress: 0,
      });
      setIsSaving(true);

      const jwt = api.getJWT();
      if (!jwt) {
        setIsSaving(false);
        setCurrentStatus({ status: "error", message: "Not logged in" });

        // Get cached diagnostic data or re-run checks if needed
        let diagnosticData = {
          isIncognito: incognitoStatus,
          storageQuota: storageQuotaInfo,
          cookiesWork: cookiesWork,
          jwtPresent: !!jwtOnMount,
          refreshTokenCookieAvailable: refreshTokenCookieAvailableOnMount,
          localStorageAccessible: localStorageAccessible,
        };

        if (
          incognitoStatus === null ||
          storageQuotaInfo === null ||
          cookiesWork === null
        ) {
          diagnosticData = await runStartupChecks();
          return; // runStartupChecks will handle the error flow
        }

        handleAuthError(diagnosticData, router);
        return;
      }

      // CRITICAL FIX: Get user info from JWT instead of frontend client to avoid auth mismatch
      let user, email;
      try {
        const base64Url = jwt.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(""),
        );
        const jwtPayload = JSON.parse(jsonPayload);

        if (!jwtPayload.sub || !jwtPayload.email) {
          throw new Error("Invalid JWT payload");
        }

        user = { id: jwtPayload.sub, email: jwtPayload.email };
        email = jwtPayload.email;
        if (!user || !user.id || !email) {
          throw new Error(
            "Invalid user information: " + JSON.stringify({ user, email }),
          );
        }
      } catch (e) {
        setIsSaving(false);
        console.error("Error decoding JWT or extracting user info:", e);
        setCurrentStatus({ status: "error", message: "Invalid session" });
        alert("Invalid session. Please log in again.");
        api.handleSignOut();
        navigate("/login");
        return;
      }
      // Get extension from uploaded file name
      const originalName = file.name || "audio";
      const lastDot = originalName.lastIndexOf(".");
      const extension =
        lastDot !== -1 ? originalName.substring(lastDot + 1).toLowerCase() : "";
      const fileName = `${email}-${Date.now()}-${Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0")}${extension ? `.${extension}` : ""}`;
      console.log("[handleRecordingFileUpload] constructed filename/path:", {
        fileName,
        filePath: `${user?.id}/${fileName}`,
      });
      const filePath = `${user?.id || "anonymous"}/${fileName}`;

      // Define progress callback to update UI with upload percentage
      const onProgress = (progress) => {
        console.log(
          "[handleRecordingFileUpload] onProgress callback triggered:",
          progress,
        );
        setCurrentStatus((prev) => {
          const newStatus = {
            ...prev,
            progress: progress.percent || 0,
            message: "Uploading recording",
          };
          console.log(
            "[handleRecordingFileUpload] setCurrentStatus with:",
            newStatus,
          );
          return newStatus;
        });
      };

      // Attempt upload with auth validation and progress tracking
      console.log(
        "[handleRecordingFileUpload] Calling uploadWithReactiveAuth (Tier 2)...",
      );
      const uploadResult = await uploadWithReactiveAuth(
        filePath,
        file,
        onProgress,
      );
      console.log(
        "[handleRecordingFileUpload] uploadWithReactiveAuth returned:",
        {
          hasError: !!uploadResult?.error,
          hasData: !!uploadResult?.data,
          requiresLogin: uploadResult?.requiresLogin,
          errorMessage: uploadResult?.error?.message,
          dataPath: uploadResult?.data?.path,
        },
      );

      setIsSaving(false);

      if (uploadResult?.requiresLogin) {
        alert("Session expired. Please log in again.");
        api.deleteJWT();
        navigate("/login");
        return;
      }

      const { data, error } = uploadResult;

      console.log("[handleRecordingFileUpload] uploadResult.data:", {
        path: data?.path,
        id: data?.id,
        fullPath: data?.fullPath,
      });

      if (error || !data || !data?.path) {
        const errorMessage = error?.message || "Upload failed";
        setCurrentStatus({
          status: "error",
          message: errorMessage,
        });

        // Provide better error messaging
        if (uploadResult?.isFileTooLarge) {
          alert(
            errorMessage +
              "\n\nPlease record a shorter session or use a higher quality setting to reduce file size.",
          );
        } else {
          alert("Error uploading recording: " + errorMessage);
        }
        return;
      }

      // Clear old recording file from localStorage and reset local variables
      localStorage.removeItem(STORAGE_KEYS.newPatientEncounter.recordingFile);
      localStorage.removeItem(
        STORAGE_KEYS.newPatientEncounter.recordingFileMetadata,
      );
      setRecordingFile(null);
      setRecordingDuration(0);
      setRecordingFileMetadata(null);

      // Get signed URL for the uploaded file to enable playback
      console.log(
        "[handleRecordingFileUpload] Getting signed URL for playback...",
      );
      let signedUrl = null;
      try {
        const result = await api.fetchWithRefreshRetry(
          "/api/recordings/create-signed-url",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: data.path }),
          },
        );

        if (!result.success) {
          console.warn(
            "[handleRecordingFileUpload] Failed to get signed URL:",
            result.error,
          );
        } else {
          const response = result.response;
          if (!response.ok) {
            console.warn(
              "[handleRecordingFileUpload] Failed to get signed URL:",
              response.statusText,
            );
          } else {
            const signedUrlData = await response.json();
            console.log(
              "[handleRecordingFileUpload] Received signed URL data:",
              signedUrlData,
            );
            signedUrl = signedUrlData.signedUrl;
            console.log(
              "[handleRecordingFileUpload] Got signed URL, polling for accessibility...",
            );

            // Poll to verify file is accessible before proceeding
            const isAccessible = await pollForFileAccessibility(signedUrl);
            if (isAccessible) {
              console.log(
                "[handleRecordingFileUpload] File confirmed accessible",
              );
            } else {
              console.warn(
                "[handleRecordingFileUpload] File accessibility poll timed out (may still work)",
              );
            }
          }
        }
      } catch (signedUrlError) {
        console.warn(
          "[handleRecordingFileUpload] Error getting signed URL:",
          signedUrlError,
        );
      }

      // Save enhanced metadata for later use - use upload response + our calculations
      const metadata = {
        path: data.path,
        id: data.id,
        fullPath: data.fullPath,
        name: fileName, // Frontend-generated filename (email-timestamp-random.ext)
        size: file.size, // File size from upload
        duration, // Duration calculated from getAudioDuration
        signedUrl: signedUrl, // Signed URL for playback
      };

      console.log("File uploaded successfully - metadata being saved:", {
        metadataPath: metadata.path,
        pathLength: metadata.path?.length,
        pathParts: metadata.path?.split("/"),
      });

      // Store with new key name
      localStorage.setItem(
        STORAGE_KEYS.newPatientEncounter.recordingFileMetadata,
        JSON.stringify(metadata),
      );

      // Verify what was actually saved
      const savedMetadata = JSON.parse(
        localStorage.getItem(
          STORAGE_KEYS.newPatientEncounter.recordingFileMetadata,
        ),
      );
      console.log("Metadata saved to localStorage - verification:", {
        savedPath: savedMetadata?.path,
        pathLength: savedMetadata?.path?.length,
        pathParts: savedMetadata?.path?.split("/"),
      });

      // Update local state
      setRecordingFile(file);
      setRecordingDuration(duration);
      setRecordingFileMetadata(metadata);

      setCurrentStatus({ status: "success", message: "Recording Ready" });
    } catch (error) {
      setIsSaving(false);
      setCurrentStatus({ status: "error", message: error.message });
      setIsProcessing(false);
      console.error("Error processing or uploading audio file:", error);
      alert(
        "Error processing or uploading audio file. Please ensure it's a valid audio file.",
      );
    }
  };

  // File input handler
  const handleRecordingFileInputChange = (event) => {
    const file = event.target.files && event.target.files[0];
    handleRecordingFileUpload(file);
  };

  // Audio error handler
  const handleAudioError = (e) => {
    console.log("[AudioPlayer Error] Full event object:", {
      eventType: e?.type,
      eventTarget: e?.target?.tagName,
      targetError: e?.target?.error,
      errorCode: e?.target?.error?.code,
      errorMessage: e?.target?.error?.message,
      rawError: e?.target?.error,
      fullEvent: e,
    });

    const error = e?.target?.error;
    let errorMessage = "Unknown audio error";
    if (error) {
      switch (error.code) {
        case 1:
          errorMessage =
            "Audio playback was aborted by user. Please try again.";
          break;
        case 2:
          errorMessage =
            "Network error: Could not load audio file. Please check your internet connection and try again.";
          break;
        case 3:
          errorMessage =
            "Audio format not supported or file is corrupted. Try uploading a different format (MP3, WAV, WebM). \n\nNote: Safari does not support WebM format, try a different browser.";
          break;
        case 4:
          errorMessage =
            "Audio file format not supported by your browser. The server may not be responding correctly.";
          break;
        default:
          errorMessage = `Audio error code ${error.code}: ${error.message || "Unknown error"}`;
      }
    } else if (e?.target) {
      errorMessage =
        "Failed to load audio file. It may be inaccessible or corrupted.\n\n Note: Safari does not support WebM format, try a different browser.";
      // Comprehensive fallback logging for mobile debugging
      console.error(`[AudioPlayer FALLBACK] No error code found - full diagnostics:`, {
        eventType: e?.type,
        eventTarget: {
          tagName: e?.target?.tagName,
          src: e?.target?.src,
          currentSrc: e?.target?.currentSrc,
          networkState: e?.target?.networkState,
          readyState: e?.target?.readyState,
          buffered: e?.target?.buffered?.length,
          paused: e?.target?.paused,
          ended: e?.target?.ended,
          seeking: e?.target?.seeking,
        },
        errorObject: e?.target?.error ? {
          code: e?.target?.error?.code,
          message: e?.target?.error?.message,
          name: e?.target?.error?.name,
          keys: Object.keys(e?.target?.error || {}),
        } : 'NULL - THIS IS THE PROBLEM',
        allTargetKeys: Object.keys(e?.target || {}),
        eventKeys: Object.keys(e || {}),
        fullTarget: JSON.stringify(e?.target, null, 2).substring(0, 500),
        fullEvent: JSON.stringify(e, null, 2).substring(0, 500),
      });
    }
    console.error(`[AudioPlayer Error] ${errorMessage}`, {
      errorCode: error?.code,
      error,
      event: e,
    });
    alert(`Error loading audio: ${errorMessage}`);
  };

  // Start recording
  // Fixed startRecording function with proper interval management
  const startRecording = async () => {
    // Pre-flight: Validate JWT before starting recording with refresh retry
    const authCheck = await api.checkAuthWithRefreshRetry();
    if (!authCheck.valid) {
      alert(
        "Your session has expired. Please log in again to continue recording.",
      );
      return;
    }

    // Clear any existing interval first
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Clear previous recording file and remove from localStorage
    localStorage.removeItem(STORAGE_KEYS.newPatientEncounter.recordingFile);
    localStorage.removeItem(
      STORAGE_KEYS.newPatientEncounter.recordingFileMetadata,
    );
    setRecordingFile(null);
    setRecordingFileMetadata(null);
    // Reset recording duration to 0 when starting new recording
    setRecordingDuration(0);
    recordingDurationRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mediaRecorder = new window.MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Clear the duration interval when recording stops
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        // Clear the JWT refresh interval when recording stops
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const recordingFile = new File([audioBlob], "recording.webm", {
          type: "audio/webm",
        });

        // Set the recording file locally first (for immediate playback)
        setRecordingFile(recordingFile);
        console.log("Recording file set locally:", recordingFile);
        // console.log("Recording duration:", recordingDuration);
        // Upload the file to Supabase - pass true to indicate this is a recorded file
        await handleRecordingFileUpload(recordingFile, true);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Try to acquire wake lock (best-effort). Do not block recording if it fails.
      try {
        if (typeof acquireWakeLock === "function") {
          const ok = await acquireWakeLock();
          console.log("Wake lock acquire result:", ok);
        }
      } catch (e) {
        console.warn("Wake lock acquisition threw:", e);
      }

      // Start duration counter - use functional update to avoid stale closure
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prevDuration) => {
          const newDuration = prevDuration + 1;
          console.log(`Recording duration: ${newDuration} seconds`); // Debug log
          if (newDuration >= 40 * 60) {
            // 40 minutes max
            stopRecording();
          }
          recordingDurationRef.current = newDuration;
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Error accessing microphone. Please check permissions.");
    }
  };

  // Fixed stopRecording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear the duration interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Clear the JWT refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    // Release wake lock when recording stops
    try {
      if (typeof releaseWakeLock === "function") releaseWakeLock();
    } catch (e) {
      console.warn("Error releasing wake lock on stop:", e);
    }
  };

  // Add cleanup effect to prevent memory leaks
  useEffect(() => {
    // Cleanup function to clear interval on unmount
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  // In-flight JWT refresh: Periodically refresh token every 60 minutes during active recording
  useEffect(() => {
    if (!isRecording) {
      return;
    }

    // Set up periodic refresh every 60 minutes (3600 seconds)
    refreshIntervalRef.current = setInterval(
      async () => {
        console.log("[Recording] In-flight JWT refresh triggered");
        try {
          const result = await api.refreshSession();
          if (result && result.success) {
            console.log(
              "[Recording] JWT refreshed successfully during recording",
            );
          } else {
            console.warn(
              "[Recording] JWT refresh failed:",
              result?.error || "Unknown error",
            );
          }
        } catch (error) {
          console.warn("[Recording] JWT refresh error:", error);
        }
      },
      60 * 60 * 1000,
    ); // 60 minutes in milliseconds

    // Cleanup when recording stops or component unmounts
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isRecording]);

  // Vibrate on phone (terminal state notification)
  const vibrate = (duration = 200) => {
    if (navigator?.vibrate) {
      navigator.vibrate(duration);
    }
  };

  // Generate SOAP note using job-based API
  const generateSoapNote = async () => {
    // Clear localStorage and reset textareas
    setPatientEncounterName("");
    setTranscript("");
    setSoapSubjective("");
    setSoapObjective("");
    setSoapAssessment("");
    setSoapPlan("");
    setBillingSuggestion("");

    // Clear any previous job IDs
    localStorage.removeItem(STORAGE_KEYS.jobs.promptLlmJobId);
    localStorage.removeItem(STORAGE_KEYS.jobs.promptLlmJobStatus);

    setSoapNoteRequested(true);
    setIsProcessing(true);
    setActiveSection("review");
    setCurrentStatus({
      status: "pending",
      message: "Creating job...",
    });

    const abortController = new AbortController();
    let timeoutId;
    const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    
    try {
      timeoutId = setTimeout(() => {
        abortController.abort();
        setIsProcessing(false);
        setCurrentStatus({
          status: "error",
          message: "Job processing timeout after 10 minutes. Please try again.",
        });
        alert("Job processing timeout after 10 minutes. Please try again.");
      }, TIMEOUT_MS);

      try {
        let recording_file_path = "";

        // Check if we have recording file metadata (works for both upload and URL flows)
        const metadataStr = localStorage.getItem(
          STORAGE_KEYS.newPatientEncounter.recordingFileMetadata,
        );
        if (metadataStr) {
          const metadata = JSON.parse(metadataStr);
          if (!metadata.path) {
            throw new Error("Audio file path missing in metadata.");
          }
          recording_file_path = metadata.path;
          console.log(
            "[generateSoapNote] Using recording path:",
            recording_file_path,
            metadata.fromUrl ? "(from URL)" : "(from upload)",
          );
        } else {
          throw new Error(
            "No audio file found. Please upload or record audio first.",
          );
        }

        // Step 1: Create job
        console.log("[generateSoapNote] Creating job...");
        const jobResponse = await api.createPromptLlmJob(recording_file_path);
        const jobId = jobResponse.id;

        console.log("[generateSoapNote] Job created:", jobId);
        localStorage.setItem(STORAGE_KEYS.jobs.promptLlmJobId, jobId);
        localStorage.setItem(
          STORAGE_KEYS.jobs.promptLlmJobStatus,
          jobResponse.status,
        );

        // Step 2: Poll for status with exponential backoff on failures
        let pollInterval = 10000; // 10 seconds
        const MAX_BACKOFF = 60000; // 60 seconds
        let backoffMultiplier = 1; // Reset to 1 on each successful poll
        let consecutiveErrors = 0;
        let pollCount = 0;

        while (true) {
          if (abortController.signal.aborted) {
            console.log("[generateSoapNote] Polling aborted by user");
            throw new Error("Job polling aborted");
          }

          try {
            pollCount++;
            console.log(`[generateSoapNote] Poll #${pollCount} - Starting poll for jobId: ${jobId} - Next interval: ${pollInterval}ms`);
            const statusResponse = await api.getPromptLlmJobStatus(jobId);

            console.log(`[generateSoapNote] Poll #${pollCount} - Response received - Status: ${statusResponse.status}`);
            if (statusResponse.error_message) {
              console.log(`[generateSoapNote] Poll #${pollCount} - Error message: ${statusResponse.error_message}`);
            }

            localStorage.setItem(
              STORAGE_KEYS.jobs.promptLlmJobStatus,
              statusResponse.status,
            );

            // Reset backoff on successful poll
            if (consecutiveErrors > 0) {
              console.log(`[generateSoapNote] Poll #${pollCount} - Resetting backoff (was ${consecutiveErrors} consecutive errors)`);
            }
            backoffMultiplier = 1;
            consecutiveErrors = 0;

            // Update UI with current status
            const statusMessage = {
              pending: "Waiting to start...",
              transcribing: "Transcribing audio...",
              generating: "Generating SOAP note...",
              complete: "Processing complete, fetching result...",
              error: statusResponse.error_message || "Job failed",
            };

            setCurrentStatus({
              status: statusResponse.status,
              message: statusMessage[statusResponse.status] || statusResponse.status,
            });

            // Handle completion
            if (statusResponse.status === "complete") {
              console.log(`[generateSoapNote] Poll #${pollCount} - Job complete! Fetching full result with ?includeResult=true`);
              const resultResponse = await api.getPromptLlmJobResult(jobId);
              console.log(`[generateSoapNote] Poll #${pollCount} - Result fetched successfully`);
              await processJobResult(resultResponse);
              setIsProcessing(false);
              console.log(`[generateSoapNote] Poll #${pollCount} - SOAP note processing complete`);
              vibrate(); // Terminal state: success
              break;
            }

            // Handle error
            if (statusResponse.status === "error") {
              console.error(`[generateSoapNote] Poll #${pollCount} - Job error state received`);
              vibrate(); // Terminal state: job error
              throw new Error(
                statusResponse.error_message || "Job failed with unknown error",
              );
            }

            // Wait before next poll (10 seconds default, or with backoff)
            console.log(`[generateSoapNote] Poll #${pollCount} - Waiting ${pollInterval}ms before next poll (status: ${statusResponse.status})`);
            await new Promise((resolve) => {
              const pollTimeout = setTimeout(resolve, pollInterval);
              abortController.signal.addEventListener(
                "abort",
                () => clearTimeout(pollTimeout),
              );
            });
          } catch (pollError) {
            // Categorize error and handle accordingly
            const networkErr = isNetworkError(pollError);
            const is401 = pollError.message?.includes('401') || pollError.message?.includes('Unauthorized');
            const is404 = pollError.message?.includes('404') || pollError.message?.includes('not found');
            const isJobError = pollError.message?.includes('Job') && pollError.message?.includes('failed');

            console.warn(`[generateSoapNote] Poll #${pollCount} - Error: ${pollError.message} (network=${networkErr}, 401=${is401}, 404=${is404}, jobError=${isJobError})`);

            // 401 Unauthorized: Refresh JWT and retry immediately
            if (is401) {
              console.log(`[generateSoapNote] Poll #${pollCount} - 401 Unauthorized: Attempting JWT refresh`);
              try {
                await api.refreshSession();
                console.log(`[generateSoapNote] Poll #${pollCount} - JWT refreshed successfully, retrying immediately`);
                backoffMultiplier = 1;
                consecutiveErrors = 0;
                continue; // Retry immediately without backoff
              } catch (refreshError) {
                console.error(`[generateSoapNote] Poll #${pollCount} - JWT refresh failed:`, refreshError);
                throw new Error('Session expired. Please log in again.');
              }
            }

            // 404 or job error: Stop immediately (non-retryable)
            if (is404 || isJobError) {
              console.error(`[generateSoapNote] Poll #${pollCount} - Non-retryable error: ${pollError.message}`);
              throw pollError;
            }

            // Network errors: Use exponential backoff with 10 retries for bad mobile connections
            if (networkErr) {
              consecutiveErrors++;
              console.warn(`[generateSoapNote] Poll #${pollCount} - Network error (attempt #${consecutiveErrors}/10): ${pollError.message}`);

              if (consecutiveErrors >= 10) {
                console.error(`[generateSoapNote] Poll #${pollCount} - GIVING UP after ${consecutiveErrors} network errors`);
                throw new Error(
                  `Failed to reach server after ${consecutiveErrors} attempts. Please check your connection.`,
                );
              }

              // Apply exponential backoff for network errors
              if (consecutiveErrors > 1) {
                backoffMultiplier = Math.min(
                  backoffMultiplier * 2,
                  MAX_BACKOFF / 10000,
                );
                pollInterval = 10000 * backoffMultiplier;
                console.log(`[generateSoapNote] Poll #${pollCount} - Applying exponential backoff: multiplier=${backoffMultiplier}, nextInterval=${pollInterval}ms`);
              }

              // Wait before retrying network error
              console.log(`[generateSoapNote] Poll #${pollCount} - Waiting ${pollInterval}ms before network retry`);
              await new Promise((resolve) => {
                const pollTimeout = setTimeout(resolve, pollInterval);
                abortController.signal.addEventListener(
                  "abort",
                  () => clearTimeout(pollTimeout),
                );
              });
            } else {
              // Unknown error: Stop immediately
              console.error(`[generateSoapNote] Poll #${pollCount} - Unknown error (non-retryable): ${pollError.message}`);
              throw pollError;
            }
          }
        }
      } catch (error) {
        console.error("[generateSoapNote] Error:", error);
        const errorMsg =
          typeof error === "string" ? error : error?.message || "";

        if (errorMsg.includes("expired token") || errorMsg.includes("401")) {
          api.handleSignOut();
          navigate("/login");
          vibrate(); // Terminal state: auth error
          return;
        }

        vibrate(); // Terminal state: processing error
        alert(`Error generating SOAP note: ${errorMsg}`);
        setCurrentStatus({
          status: "error",
          message: `Failed to process recording: ${errorMsg}`,
        });
        setIsProcessing(false);
      }
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("[generateSoapNote] Outer error:", error);
      vibrate(); // Terminal state: outer error (e.g., timeout)
      alert(`Error generating SOAP note: ${error.message}`);
      setCurrentStatus({
        status: "error",
        message: `Failed to process recording: ${error.message}`,
      });
      setIsProcessing(false);
    }
  };

  // Process job result and set state
  const processJobResult = async (resultResponse) => {
    console.log("[processJobResult] Processing result:", resultResponse);

    let noteObj = {};
    let billingObj = {};

    try {
      // Parse SOAP note if it's a string
      const parsed =
        typeof resultResponse.soap_note === "string"
          ? JSON.parse(resultResponse.soap_note)
          : resultResponse.soap_note || {};

      console.log("[processJobResult] Parsed SOAP note:", parsed);

      noteObj = parsed.soap_note || parsed || {};
      billingObj = parsed.billing || {};

      // Extract transcript
      const transcriptText = resultResponse.transcript_text || "";
      setTranscript(transcriptText);
      localStorage.setItem(
        STORAGE_KEYS.newPatientEncounter.transcript,
        JSON.stringify(transcriptText),
      );

      // Format SOAP note fields
      let soapSubjectiveText =
        typeof noteObj.subjective === "string"
          ? noteObj.subjective
          : format.printJsonObject(noteObj.subjective);
      let soapObjectiveText =
        typeof noteObj.objective === "string"
          ? noteObj.objective
          : format.printJsonObject(noteObj.objective);
      let soapAssessmentText =
        typeof noteObj.assessment === "string"
          ? noteObj.assessment
          : format.printJsonObject(noteObj.assessment);
      let soapPlanText =
        typeof noteObj.plan === "string"
          ? noteObj.plan
          : format.printJsonObject(noteObj.plan);

      setSoapSubjective(soapSubjectiveText);
      setSoapObjective(soapObjectiveText);
      setSoapAssessment(soapAssessmentText);
      setSoapPlan(soapPlanText);

      // Format billing
      let billingText =
        typeof billingObj === "string"
          ? billingObj
          : format.printJsonObject(billingObj);
      setBillingSuggestion(billingText.trim());

      // Store to localStorage
      localStorage.setItem(
        STORAGE_KEYS.newPatientEncounter.soapSubjective,
        JSON.stringify(soapSubjectiveText),
      );
      localStorage.setItem(
        STORAGE_KEYS.newPatientEncounter.soapObjective,
        JSON.stringify(soapObjectiveText),
      );
      localStorage.setItem(
        STORAGE_KEYS.newPatientEncounter.soapAssessment,
        JSON.stringify(soapAssessmentText),
      );
      localStorage.setItem(
        STORAGE_KEYS.newPatientEncounter.soapPlan,
        JSON.stringify(soapPlanText),
      );
      localStorage.setItem(
        STORAGE_KEYS.newPatientEncounter.billingSuggestion,
        JSON.stringify(billingText.trim()),
      );

      setCurrentStatus({
        status: "complete",
        message: "SOAP note generated successfully",
      });
    } catch (e) {
      console.error("[processJobResult] Parse error:", e);
      setSoapSubjective("");
      setSoapObjective("");
      setSoapAssessment("");
      setSoapPlan("");
      setBillingSuggestion("");
      throw new Error(
        `Failed to parse SOAP note result: ${e.message}`,
      );
    }
  };

  // Save transcript and note
  const savePatientEncounter = async () => {
    setSaveAttempted(true);
    const missingFields = [];
    if (!patientEncounterName.trim())
      missingFields.push("Patient Encounter Name");
    if (!transcript.trim()) missingFields.push("Transcript");
    if (!soapSubjective.trim()) missingFields.push("Subjective");
    if (!soapObjective.trim()) missingFields.push("Objective");
    if (!soapAssessment.trim()) missingFields.push("Assessment");
    if (!soapPlan.trim()) missingFields.push("Plan");
    if (!billingSuggestion.trim()) missingFields.push("Billing Suggestion");
    if (missingFields.length > 0) {
      alert(
        "Required field(s): " + missingFields.map((f) => `${f}`).join(", "),
      );
      return;
    }

    setIsSaving(true);

    try {
      // Clear localStorage for these fields after successful save
      // Recompile SOAP Note JSON object
      const soapNoteObject = {
        subjective: soapSubjective.replace(/\r?\n/g, "\n"),
        objective: soapObjective.replace(/\r?\n/g, "\n"),
        assessment: soapAssessment.replace(/\r?\n/g, "\n"),
        plan: soapPlan.replace(/\r?\n/g, "\n"),
      };

      // Attempt to parse billingSuggestion into JSON object with 3 fields
      // If not possible, fallback to string
      let billingSuggestionObject = {};
      // Try to extract fields by simple regex (ICD10, CPT, additional_inquiries)
      // const icdMatch = billingSuggestion.match(
      //   /icd10[:\s]*([\s\S]*?)(cpt[:\s]|additional_inquiries[:\s]|$)/i
      // );
      // const cptMatch = billingSuggestion.match(
      //   /cpt[:\s]*([\s\S]*?)(icd10[:\s]|additional_inquiries[:\s]|$)/i
      // );
      // const addMatch = billingSuggestion.match(
      //   /additional_inquiries[:\s]*([\s\S]*?)(icd10[:\s]|cpt[:\s]|$)/i
      // );
      // billingSuggestionObject.icd10 = icdMatch
      //   ? icdMatch[1].trim().replace(/\r?\n/g, "\n")
      //   : "";
      // billingSuggestionObject.cpt = cptMatch
      //   ? cptMatch[1].trim().replace(/\r?\n/g, "\n")
      //   : "";
      // billingSuggestionObject.additional_inquiries = addMatch
      //   ? addMatch[1].trim().replace(/\r?\n/g, "\n")
      //   : "";

      // Use new complete endpoint for mass save

      // Get recording_file_path from localStorage metadata
      const recordingFileMetadata = localStorage.getItem(
        STORAGE_KEYS.newPatientEncounter.recordingFileMetadata,
      );
      let recording_file_path = "";

      if (recordingFileMetadata) {
        try {
          const metadataObj = JSON.parse(recordingFileMetadata);
          recording_file_path = metadataObj.path || "";
        } catch (e) {
          console.error("Error parsing recording metadata:", e);
          recording_file_path = "";
        }
      }

      //merge SOAP note and billing suggestion into soapNote_text jsonObject

      const payload = {
        patientEncounter: { name: patientEncounterName },
        recording: { recording_file_path },
        transcript: { transcript_text: transcript },
        soapNote_text: {
          soapNote: soapNoteObject,
          billingSuggestion,
        }, // <-- pass as object
      };

      console.log("Saving patient encounter with data:", payload);
      console.log(
        "[savePatientEncounter] Calling API with fetchWithRefreshRetry (Tier 3)...",
      );
      const apiResult = await api.fetchWithRefreshRetry(
        "/api/patient-encounters/complete",
        {
          method: "POST",
          body: JSON.stringify(payload),
          cache: "no-store", // Always fetch fresh data, never use cache
        },
      );

      if (!apiResult.success) {
        const errorMessage = `Authentication failed: ${apiResult.error}`;
        console.error(errorMessage);
        alert(errorMessage);
        setIsSaving(false);
        return;
      }

      const response = apiResult.response;
      console.log("Save response:", response);

      if (!response.ok) {
        let detailedError = `Failed to save patient encounter: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            detailedError += `\nServer response: ${errorText}`;
          }
          console.error(detailedError);
        } catch (e) {
          detailedError += `\nError reading server response: ${e.message}`;
        }
        alert(detailedError);
        setIsSaving(false);
        return;
      }
      // Clear localStorage for these fields after successful save
      Object.values(STORAGE_KEYS.newPatientEncounter).forEach((key) =>
        localStorage.removeItem(key),
      );
      // Navigate back to dashboard
      setRecordingFile(null);
      setRecordingFileMetadata(null);
      setPatientEncounterName("");
      setTranscript("");
      setSoapSubjective("");
      setSoapObjective("");
      setSoapAssessment("");
      setSoapPlan("");
      setBillingSuggestion("");

      setIsSaving(false);
      //reload page
      window.location.reload();
    } catch (error) {
      let debugMsg = "Error saving data: " + error.message;
      if (error.stack) {
        debugMsg += "\nStack trace: " + error.stack;
      }
      alert(debugMsg);
      setIsSaving(false);
    }
  };

  // Format duration helper
  const formatDuration = (seconds) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <Auth />
      <div className="max-w-8xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">New Patient Encounter</h1>

        {/* Section 1: Upload/Record */}
        <div className="border border-gray-200 rounded-lg mb-4">
          <button
            className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            onClick={() =>
              setActiveSection(activeSection === "upload" ? "upload" : "upload")
            }
          >
            <span className="text-lg font-semibold">
              1. Upload or Record Patient Encounter Audio
            </span>
            <span className="text-xl">
              {activeSection === "upload" ? "−" : "+"}
            </span>
          </button>

          {activeSection === "upload" && (
            <div className="p-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Upload Audio</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,video/mp4,.mp4,.m4a" // Updated to include MP4 and M4A
                      onChange={handleRecordingFileInputChange}
                      className="hidden"
                      id="file-upload"
                      disabled={isRecording || isProcessing}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-800"
                    >
                      <div className="text-4xl mb-2">📁</div>
                      <div>Click to upload audio file</div>
                      <div className="text-sm text-gray-500 mt-2">
                        Max 50MB, 30 minutes duration
                        <br />
                        Supports MP3, WAV, WebM, OGG, MP4, M4A
                      </div>
                    </label>
                  </div>
                </div>

                {/* Recording Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Record Audio</h3>
                  <div className="text-center space-y-4">
                    {/* <div className="text-2xl">{isRecording ? "🔴" : "🎤"}</div> */}
                    <div className="flex items-center justify-center space-x-2">
                      <div className="text-2xl">
                        {isRecording ? "🔴" : "🎤"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {isRecording ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                              Keep Awake
                            </span>
                            <span className="text-xs">
                              {isSupportedWakeLock
                                ? isWakeLockActive
                                  ? "Active"
                                  : isWakeLockPending
                                    ? "Pending"
                                    : "Inactive"
                                : "Unsupported"}
                              {process.env.NODE_ENV !== "production" && (
                                <span className="sr-only">{` wk: ${
                                  isWakeLockActive
                                    ? "A"
                                    : isWakeLockPending
                                      ? "P"
                                      : "N"
                                }`}</span>
                              )}
                            </span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {isRecording && (
                      <div className="text-lg font-mono">
                        {formatDuration(recordingDuration)} / 40:00
                      </div>
                    )}

                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                      className={`px-6 py-3 rounded-lg font-medium ${
                        isRecording
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      } disabled:opacity-50`}
                    >
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </button>
                  </div>
                </div>
              </div>

              {(() => {
                if (
                  recordingFileMetadata ||
                  isUploading ||
                  loadingUrlRecording
                ) {
                  const isLoading = isUploading || loadingUrlRecording;

                  return (
                    <div
                      className={`mt-6 p-4 rounded-lg border ${
                        isLoading
                          ? "bg-gray-100 border-gray-300 opacity-60 pointer-events-none select-none"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              isLoading ? "text-gray-500" : "text-green-800"
                            }`}
                          >
                            {isLoading
                              ? loadingUrlRecording
                                ? "Loading recording from URL..."
                                : "Uploading recording..."
                              : recordingFileMetadata?.fromUrl
                                ? "Recording Loaded from URL"
                                : "Recording Ready"}
                          </p>
                          {isLoading &&
                            currentStatus?.progress !== undefined && (
                              <p className="text-sm text-gray-600 mt-1">
                                Progress: {currentStatus.progress}%
                              </p>
                            )}
                          <p
                            className={`text-sm ${
                              isLoading ? "text-gray-500" : "text-green-600"
                            }`}
                            data-path={recordingFileMetadata?.path || ""}
                          >
                            {recordingFileMetadata?.name || "recording.webm"}
                            {recordingFileMetadata?.size &&
                              ` (${((recordingFileMetadata.size || 0) / (1024 * 1024)).toFixed(1)}MB)`}
                          </p>

                          {/* Audio Player - Simple native player with download button */}
                          {!isLoading && recordingFileMetadata?.signedUrl && (
                            <div className="mt-4">
                              <AudioPlayer
                                src={recordingFileMetadata.signedUrl}
                                onError={handleAudioError}
                                filename={
                                  recordingFileMetadata?.name ||
                                  "recording.webm"
                                }
                                maxWidth="500px"
                              />
                            </div>
                          )}
                        </div>

                        <button
                          onClick={generateSoapNote}
                          disabled={
                            isProcessing ||
                            isUploading ||
                            loadingUrlRecording ||
                            !recordingFileMetadata
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                        >
                          {isProcessing
                            ? "Processing..."
                            : loadingUrlRecording
                              ? "Loading Recording..."
                              : "Generate SOAP Note"}
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>

        {/* Section 2: Review */}
        <div
          className={`border border-gray-200 rounded-lg ${
            !soapNoteRequested
              ? "opacity-60 pointer-events-none select-none"
              : ""
          }`}
        >
          <button
            className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            onClick={() =>
              setActiveSection(activeSection === "review" ? "review" : "review")
            }
            disabled={!soapNoteRequested}
          >
            <span className="text-lg font-semibold">
              2. Edit Generated Transcript and SOAP Note
            </span>
            <span className="text-xl">
              {activeSection === "review" ? "−" : "+"}
            </span>
          </button>

          {activeSection === "review" && (
            <div className="p-6 border-t border-gray-200">
              {/* <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Encounter Name
                </label>
                <input
                  type="text"
                  value={patientEncounterName}
                  onChange={(e) => setPatientEncounterName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white"
                  placeholder="Enter patient encounter name"
                  disabled={isSaving}
                />
              </div> */}

              {/* Status Messages */}
              {currentStatus && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    currentStatus.status === "error"
                      ? "bg-red-50 border border-red-200 text-red-800"
                      : "bg-blue-50 border border-blue-200 text-blue-800"
                  }`}
                >
                  <div className="font-medium capitalize">
                    {currentStatus.status}
                  </div>
                  <div className="text-sm">
                    {currentStatus.message}
                    {currentStatus.progress !== undefined &&
                    currentStatus.progress !== null
                      ? ` – ${currentStatus.progress}%`
                      : ""}
                  </div>
                </div>
              )}

              {/* Patient Encounter Name */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Patient Encounter Name
                </label>
                <input
                  type="text"
                  value={patientEncounterName}
                  onChange={(e) => setPatientEncounterName(e.target.value)}
                  disabled={isSaving || isProcessing}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white"
                  placeholder="Patient Encounter Name..."
                  maxLength={100}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Transcript
                </label>

                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  disabled={isSaving || isProcessing}
                  className="w-full h-100 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "20rem" }}
                  placeholder="Transcript will appear here..."
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <CopyToClipboard
                    text={transcript}
                    label="Copy"
                    placement="right"
                  />
                </div>
              </div>

              {/* SOAP Note (S/O/A/P) */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Subjective
                </label>
                <textarea
                  value={soapSubjective}
                  onChange={(e) => setSoapSubjective(e.target.value)}
                  disabled={isSaving || isProcessing}
                  className="w-full h-80 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "8rem" }}
                  placeholder="Subjective notes will appear here..."
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <CopyToClipboard
                    text={soapSubjective}
                    label="Copy"
                    placement="right"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Objective
                </label>
                <textarea
                  value={soapObjective}
                  onChange={(e) => setSoapObjective(e.target.value)}
                  disabled={isSaving || isProcessing}
                  className="w-full h-80 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "8rem" }}
                  placeholder="Objective notes will appear here..."
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <CopyToClipboard
                    text={soapObjective}
                    label="Copy"
                    placement="right"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Assessment
                </label>
                <textarea
                  value={soapAssessment}
                  onChange={(e) => setSoapAssessment(e.target.value)}
                  disabled={isSaving || isProcessing}
                  className="w-full h-50 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "8rem" }}
                  placeholder="Assessment notes will appear here..."
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <CopyToClipboard
                    text={soapAssessment}
                    label="Copy"
                    placement="right"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Plan
                </label>
                <textarea
                  value={soapPlan}
                  onChange={(e) => setSoapPlan(e.target.value)}
                  disabled={isSaving || isProcessing}
                  className="w-full h-50 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "8rem" }}
                  placeholder="Plan notes will appear here..."
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <CopyToClipboard
                    text={soapPlan}
                    label="Copy"
                    placement="right"
                  />
                </div>
              </div>

              {/* Billing Suggestion (Rich Text) */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Billing Suggestion
                </label>
                <textarea
                  value={billingSuggestion}
                  onChange={(e) => setBillingSuggestion(e.target.value)}
                  disabled={isSaving || isProcessing}
                  className="w-full h-80 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "20rem" }}
                  placeholder="Billing suggestion will appear here..."
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <CopyToClipboard
                    text={billingSuggestion}
                    label="Copy"
                    placement="right"
                  />
                </div>
              </div>

              {/* Save Button (always enabled, but checks required fields before saving) */}
              <div className="flex flex-col items-end">
                <div className="flex gap-4">
                  {/* Export menu/button - placed to the left of Preview button */}
                  <ExportDataAsFileMenu
                    patientEncounterData={{ name: patientEncounterName }}
                    transcriptData={{ transcript_text: transcript }}
                    soapNotesData={[
                      {
                        soapNote_text: {
                          soapNote: {
                            subjective: soapSubjective,
                            objective: soapObjective,
                            assessment: soapAssessment,
                            plan: soapPlan,
                          },
                          billingSuggestion,
                        },
                      },
                    ]}
                  />
                  <button
                    onClick={() => setShowPreview(true)}
                    disabled={isSaving}
                    className={`bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium ${
                      isSaving ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Preview & Save
                  </button>
                </div>
                {errorMessage && (
                  <div className="mt-3 text-red-600 text-sm text-right w-full">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <PatientEncounterPreviewOverlay
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        transcript={transcript}
        setTranscript={setTranscript}
        soapSubjective={soapSubjective}
        setSoapSubjective={setSoapSubjective}
        soapObjective={soapObjective}
        setSoapObjective={setSoapObjective}
        soapAssessment={soapAssessment}
        setSoapAssessment={setSoapAssessment}
        soapPlan={soapPlan}
        setSoapPlan={setSoapPlan}
        billingSuggestion={billingSuggestion}
        setBillingSuggestion={setBillingSuggestion}
        patientEncounterName={patientEncounterName}
        setPatientEncounterName={setPatientEncounterName}
        onSave={savePatientEncounter}
        isSaving={isSaving}
        errorMessage={errorMessage}
        sections={["transcript", "soapNote", "billingSuggestion"]}
        // Optionally pass previewSection and reviewedSections if you want to control them from parent
      />
    </>
  );
}
