import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";
import * as format from "@/utils/format.js";
import Auth from "@/components/Auth.jsx";
import RecordingPreviewOverlay from "@/components/RecordingPreviewOverlay.jsx";

export default function ViewRecordingsPage() {
  const navigate = useNavigate();
  const [attachedRecordings, setAttachedRecordings] = useState([]);
  const [unattachedRecordings, setUnattachedRecordings] = useState([]);
  const [attachedSortBy, setAttachedSortBy] = useState("date_created");
  const [unattachedSortBy, setUnattachedSortBy] = useState("date_created");
  const [attachedOrder, setAttachedOrder] = useState("desc");
  const [unattachedOrder, setUnattachedOrder] = useState("desc");
  // Active tab: 'attached' or 'unattached'
  const [activeTab, setActiveTab] = useState("attached");
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [recordingData, setRecordingData] = useState(null);
  const [loadingRecording, setLoadingRecording] = useState(false);
  const [deletingRecording, setDeletingRecording] = useState(false);
  const [selectedAttachedIds, setSelectedAttachedIds] = useState(new Set());
  const [selectedUnattachedPaths, setSelectedUnattachedPaths] = useState(
    new Set(),
  );
  const [hoveredRecordingId, setHoveredRecordingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [hasLoadedUnattached, setHasLoadedUnattached] = useState(false);

  const fetchRecordings = useCallback(
    async (attached, sortBy = "name", order = "asc") => {
      const result = await api.getRecordingsByAttached({
        attached,
        limit: 100,
        offset: 0,
        sortBy,
        order,
      });

      if (!result.success) {
        console.error(
          `Error fetching ${attached ? "attached" : "unattached"} recordings:`,
          result.error,
        );
        if (result.status === 401) {
          navigate("/login");
        }
        return [];
      }

      return result.data;
    },
    [navigate],
  );

  const loadAttachedRecordings = useCallback(
    async (
      attachedSort = attachedSortBy,
      attachedOrd = attachedOrder,
    ) => {
      setLoading(true);
      const attached = await fetchRecordings(true, attachedSort, attachedOrd);
      setAttachedRecordings(attached);
      setLoading(false);
    },
    [attachedSortBy, attachedOrder, fetchRecordings],
  );

  const loadUnattachedRecordings = useCallback(
    async (
      unattachedSort = unattachedSortBy,
      unattachedOrd = unattachedOrder,
    ) => {
      setLoading(true);
      const unattached = await fetchRecordings(false, unattachedSort, unattachedOrd);
      setUnattachedRecordings(unattached);
      setHasLoadedUnattached(true);
      setLoading(false);
    },
    [unattachedSortBy, unattachedOrder, fetchRecordings],
  );

  // Load attached recordings on mount
  useEffect(() => {
    loadAttachedRecordings();
  }, [loadAttachedRecordings]);

  // Load unattached recordings when user switches to unattached tab
  useEffect(() => {
    if (activeTab === "unattached" && !hasLoadedUnattached) {
      loadUnattachedRecordings();
    }
  }, [activeTab, hasLoadedUnattached, loadUnattachedRecordings]);

  const handleAttachedSortChange = (newSort) => {
    setAttachedSortBy(newSort);
    loadAttachedRecordings(newSort, attachedOrder);
  };

  const handleAttachedOrderToggle = () => {
    const newOrder = attachedOrder === "asc" ? "desc" : "asc";
    setAttachedOrder(newOrder);
    loadAttachedRecordings(attachedSortBy, newOrder);
  };

  const handleUnattachedSortChange = (newSort) => {
    setUnattachedSortBy(newSort);
    loadUnattachedRecordings(newSort, unattachedOrder);
  };

  const handleUnattachedOrderToggle = () => {
    const newOrder = unattachedOrder === "asc" ? "desc" : "asc";
    setUnattachedOrder(newOrder);
    loadUnattachedRecordings(unattachedSortBy, newOrder);
  };

  const getRecordingName = (path) => {
    return path?.split("/").pop() || "unknown";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleCardClick = async (recording) => {
    setSelectedRecording(recording);
    setLoadingRecording(true);
    setRecordingData(null);

    const jwt = api.getJWT();
    if (!jwt) {
      navigate("/login");
      return;
    }

    try {
      if (recording.id) {
        // Attached recording - fetch from API with signed URL generation
        const result = await api.getRecordingById(recording.id);
        if (!result.success) {
          if (result.status === 401) {
            navigate("/login");
          } else {
            console.error("Failed to fetch recording data:", result.error);
          }
          return;
        }
        setRecordingData(result.data);
      } else {
        // Unattached recording - create signed URL directly
        try {
          const result = await api.fetchWithRefreshRetry(
            "/api/recordings/create-signed-url",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: recording.path }),
            },
          );

          if (!result.success) {
            console.error("Failed to get signed URL:", result.error);
            return;
          }

          const response = result.response;
          if (!response.ok) {
            console.error("Failed to get signed URL:", response.statusText);
            return;
          }

          const signedUrlData = await response.json();
          setRecordingData({
            ...recording,
            recording_file_signed_url: signedUrlData.signedUrl,
            id: null, // Mark as unattached
          });
        } catch (error) {
          console.error("Signed URL error:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching recording data:", error);
    } finally {
      setLoadingRecording(false);
    }
  };

  const closePreview = () => {
    setSelectedRecording(null);
    setRecordingData(null);
  };



  const getSortDisplayName = (sortValue) => {
    switch (sortValue) {
      case "name":
        return "A-Z";
      case "created_at":
        return "Date Created";
      case "updated_at":
        return "Date Updated";
      default:
        return "A-Z";
    }
  };

  const getTotalSelectedCount = () => {
    return selectedAttachedIds.size + selectedUnattachedPaths.size;
  };

  const getAttachedSelectedCount = () => {
    return selectedAttachedIds.size;
  };

  const getUnattachedSelectedCount = () => {
    return selectedUnattachedPaths.size;
  };

  const isRecordingSelected = (identifier, isAttached) => {
    return isAttached
      ? selectedAttachedIds.has(identifier)
      : selectedUnattachedPaths.has(identifier);
  };

  const shouldShowCheckbox = (recordingId, isAttached) => {
    const tabSelected = isAttached
      ? getAttachedSelectedCount()
      : getUnattachedSelectedCount();
    const isHovered = hoveredRecordingId === recordingId;
    // In selection mode (tabSelected > 0), show ALL checkboxes in this tab
    // Otherwise, only show on hover
    return tabSelected > 0 || isHovered;
  };

  const handleToggleRecordingSelection = (identifier, isAttached) => {
    if (isAttached) {
      setSelectedAttachedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(identifier)) {
          newSet.delete(identifier);
        } else {
          newSet.add(identifier);
        }
        return newSet;
      });
    } else {
      setSelectedUnattachedPaths((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(identifier)) {
          newSet.delete(identifier);
        } else {
          newSet.add(identifier);
        }
        return newSet;
      });
    }
  };

  const handleToggleSelectAll = (isAttached) => {
    if (isAttached) {
      if (selectedAttachedIds.size === attachedRecordings.length) {
        setSelectedAttachedIds(new Set());
      } else {
        setSelectedAttachedIds(new Set(attachedRecordings.map((r) => r.id)));
      }
    } else {
      if (selectedUnattachedPaths.size === unattachedRecordings.length) {
        setSelectedUnattachedPaths(new Set());
      } else {
        setSelectedUnattachedPaths(
          new Set(unattachedRecordings.map((r) => r.path)),
        );
      }
    }
  };

  const handleAttachedDelete = async () => {
    const attachedCount = selectedAttachedIds.size;
    if (attachedCount === 0) return;

    const confirmMessage = `Warning: This will delete ${attachedCount} entire Patient Encounter(s)!\n\nDeleting these recordings will also permanently delete:\n• The associated Patient Encounters\n• All Transcripts\n• All SOAP Notes\n\nAre you sure you want to continue?`;
    if (!confirm(confirmMessage)) return;

    setBulkDeleting(true);
    const jwt = api.getJWT();
    if (!jwt) {
      navigate("/login");
      return;
    }

    try {
      // Get full recording objects for selected IDs
      const selectedRecordings = attachedRecordings.filter((r) =>
        selectedAttachedIds.has(r.id),
      );

      // Extract patientEncounterIds
      const patientEncounterIds = selectedRecordings.map(
        (r) => r.patientEncounter.id,
      );

      let successCount = 0;
      let errorCount = 0;

      console.log(
        "Deleting patient encounters and related data for IDs:",
        patientEncounterIds,
      );

      // TODO: Implement DELETE endpoint for /api/patient-encounters/{id}
      // For now, just show alert since endpoint doesn't exist yet
      alert(
        "Delete functionality for attached recordings will be implemented soon. This would delete the entire patient encounter, transcript, and SOAP notes.",
      );
      errorCount = patientEncounterIds.length;

      // When backend endpoint is ready, uncomment and use:
      // for (const encounterId of patientEncounterIds) {
      //   try {
      //     const apiResult = await api.fetchWithRefreshRetry(
      //       `/api/patient-encounters/${encounterId}`,
      //       { method: 'DELETE' }
      //     );
      //
      //     if (!apiResult.success) {
      //       if (apiResult.status === 401) {
      //         navigate("/login");
      //         return;
      //       }
      //       errorCount++;
      //     } else {
      //       successCount++;
      //     }
      //   } catch (error) {
      //     console.error("Error deleting patient encounter:", error);
      //     errorCount++;
      //   }
      // }
      //
      // if (successCount > 0) {
      //   setAttachedRecordings((prev) =>
      //     prev.filter((r) => !selectedAttachedIds.has(r.id)),
      //   );
      // }

      // Clear selections
      setSelectedAttachedIds(new Set());

      // Show result message
      if (successCount > 0 && errorCount === 0) {
        alert(`Successfully deleted ${successCount} patient encounter(s).`);
      } else if (errorCount > 0 && successCount === 0) {
        alert(`Failed to delete ${errorCount} patient encounter(s). Please try again.`);
      } else if (successCount > 0 && errorCount > 0) {
        alert(
          `Deleted ${successCount} patient encounter(s), but ${errorCount} failed.`,
        );
      }
    } catch (error) {
      console.error("Error during attached delete:", error);
      alert("An error occurred during delete. Please try again.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleUnattachedDelete = async () => {
    const unattachedCount = selectedUnattachedPaths.size;
    if (unattachedCount === 0) return;

    const confirmMessage = `Are you sure you want to permanently delete ${unattachedCount} recording file(s) from storage?`;
    if (!confirm(confirmMessage)) return;

    setBulkDeleting(true);
    const jwt = api.getJWT();
    if (!jwt) {
      navigate("/login");
      return;
    }

    try {
      const pathsToDelete = Array.from(selectedUnattachedPaths);
      let successCount = 0;
      let errorCount = 0;

      try {
        const apiResult = await api.fetchWithRefreshRetry(
          "/api/recordings/storage",
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prefixes: pathsToDelete }),
          },
        );

        if (!apiResult.success) {
          console.error("Delete request failed:", apiResult.error);
          if (apiResult.status === 401) {
            navigate("/login");
            return;
          }
          errorCount = pathsToDelete.length;
        } else {
          const response = apiResult.response;
          if (!response.ok) {
            console.error(
              "Delete failed:",
              response.status,
              response.statusText,
            );
            errorCount = pathsToDelete.length;
          } else {
            const result = await response.json();
            // result format: { deleted: string[], failed: string[], errors: Record<string, string> }
            successCount = result.deleted.length;
            errorCount = result.failed.length;

            if (result.failed.length > 0) {
              console.error("Some files failed to delete:", result.errors);
            }

            // Update local state - filter out successfully deleted paths
            if (successCount > 0) {
              setUnattachedRecordings((prev) =>
                prev.filter((r) => !result.deleted.includes(r.path)),
              );
            }
          }
        }
      } catch (error) {
        console.error("Storage delete error:", error);
        errorCount = pathsToDelete.length;
      }

      // Clear selections
      setSelectedUnattachedPaths(new Set());

      // Show result message
      if (successCount > 0 && errorCount === 0) {
        alert(`Successfully deleted ${successCount} recording file(s).`);
      } else if (errorCount > 0 && successCount === 0) {
        alert(`Failed to delete ${errorCount} recording file(s). Please try again.`);
      } else if (successCount > 0 && errorCount > 0) {
        alert(
          `Deleted ${successCount} recording file(s), but ${errorCount} failed.`,
        );
      }
    } catch (error) {
      console.error("Error during unattached delete:", error);
      alert("An error occurred during delete. Please try again.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const RecordingCard = ({ recording, isAttached }) => {
    const recordingIdentifier = isAttached ? recording.id : recording.path;
    const totalSelected = getTotalSelectedCount();
    const isSelected = isRecordingSelected(recordingIdentifier, isAttached);
    const showCheckbox = shouldShowCheckbox(recordingIdentifier, isAttached);

    return (
      <div
        className="recording-card"
        data-recording-path={recording.path}
        data-patient-encounter-id={
          isAttached ? recording.patientEncounter?.id : undefined
        }
        key={recording.path}
        style={{
          background: isSelected ? "#f0f9ff" : "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: "20px",
          minWidth: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "box-shadow 0.2s, transform 0.2s, background-color 0.2s",
          cursor: "pointer",
          border: isSelected
            ? "2px solid #2563eb"
            : recording.missing
              ? "2px solid #ef4444"
              : "1px solid #e5e7eb",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          setHoveredRecordingId(recordingIdentifier);
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.16)";
          e.currentTarget.style.transform = "translateY(-4px) scale(1.03)";
        }}
        onMouseLeave={(e) => {
          setHoveredRecordingId(null);
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          e.currentTarget.style.transform = "none";
        }}
        onClick={() => handleCardClick(recording)}
      >
        {showCheckbox && (
          <input
            type="checkbox"
            className="recording-checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              handleToggleRecordingSelection(recordingIdentifier, isAttached);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              width: "20px",
              height: "20px",
              cursor: "pointer",
              zIndex: "10",
            }}
          />
        )}
        <div
          className="recording-icon"
          style={{ fontSize: "2rem", marginBottom: "8px" }}
        >
          {recording.missing ? "❌" : "🎵"}
        </div>
        <div
          className="recording-title"
          style={{
            fontWeight: "bold",
            marginBottom: "6px",
            fontSize: "1rem",
            wordBreak: "break-word",
          }}
        >
          {getRecordingName(recording.path)}
        </div>
        {isAttached && recording.patientEncounter && (
          <div
            className="patient-encounter-name"
            style={{
              fontWeight: "bold",
              fontSize: "0.85rem",
              color: "#2563eb",
              marginBottom: "6px",
              wordBreak: "break-word",
            }}
          >
            {recording.patientEncounter.name || "Unnamed Encounter"}
          </div>
        )}
        <div
          className="recording-size"
          style={{
            color: "#666",
            fontSize: "0.9rem",
            marginBottom: "8px",
          }}
        >
          {formatFileSize(recording.size)}
        </div>
        <div
          className="recording-date"
          style={{
            color: "#555",
            fontSize: "0.85em",
          }}
        >
          {recording.created_at
            ? format.formatTimestamp(recording.created_at)
            : "Unknown date"}
        </div>
        {recording.missing && (
          <div
            style={{
              color: "#ef4444",
              fontSize: "0.8rem",
              marginTop: "8px",
              fontStyle: "italic",
            }}
          >
            File missing from storage
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Auth />
      <div className="max-w-8xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            View Recordings (
            {attachedRecordings.length + unattachedRecordings.length})
          </h1>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Loading recordings...</p>
          </div>
        ) : (
          <>
            {/* Tabs for Attached / Unattached Recordings (dashboard style) */}
            <div
              className="tabs"
              style={{
                display: "flex",
                borderBottom: "2px solid #e0e0e0",
                marginBottom: "20px",
                backgroundColor: "#f8f9fa",
              }}
            >
              <button
                className={`tab-btn${activeTab === "attached" ? " active" : ""}`}
                onClick={() => setActiveTab("attached")}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  border: "none",
                  backgroundColor:
                    activeTab === "attached" ? "#007bff" : "transparent",
                  color: activeTab === "attached" ? "white" : "#495057",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderBottom:
                    activeTab === "attached"
                      ? "3px solid #0056b3"
                      : "3px solid transparent",
                  transition: "all 0.3s ease",
                }}
              >
                🎵 Attached ({attachedRecordings.length})
              </button>
              <button
                className={`tab-btn${activeTab === "unattached" ? " active" : ""}`}
                onClick={() => setActiveTab("unattached")}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  border: "none",
                  backgroundColor:
                    activeTab === "unattached" ? "#007bff" : "transparent",
                  color: activeTab === "unattached" ? "white" : "#495057",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderBottom:
                    activeTab === "unattached"
                      ? "3px solid #0056b3"
                      : "3px solid transparent",
                  transition: "all 0.3s ease",
                }}
              >
                🎵 Unattached ({hasLoadedUnattached ? unattachedRecordings.length : "..."})
              </button>
            </div>
          </>
        )}

        {/* Attached recordings tab content */}
        {!loading && activeTab === "attached" && (
          <div
            className="tab-content"
            style={{ display: activeTab === "attached" ? "block" : "none" }}
          >
            {/* Bulk delete toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <input
                  type="checkbox"
                  className="recording-checkbox"
                  checked={
                    selectedAttachedIds.size === attachedRecordings.length &&
                    attachedRecordings.length > 0
                  }
                  onChange={() => handleToggleSelectAll(true)}
                  title="Select all attached recordings"
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                {getAttachedSelectedCount() === 0 ? (
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      fontWeight: "500",
                    }}
                  >
                    Select All
                  </span>
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#1e40af",
                        fontWeight: "500",
                      }}
                    >
                      {getAttachedSelectedCount()} selected
                    </span>
                    <button
                      onClick={async () => {
                        if (getTotalSelectedCount() > 0) {
                          activeTab === "attached"
                            ? await handleAttachedDelete()
                            : await handleUnattachedDelete();
                        } else {
                          alert("Please select at least one recording to delete.");
                        }
                      }}
                      disabled={bulkDeleting}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: bulkDeleting ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: bulkDeleting ? 0.6 : 1,
                      }}
                    >
                      {bulkDeleting
                        ? "Deleting..."
                        : `Delete ${getAttachedSelectedCount()} recording${getAttachedSelectedCount() !== 1 ? "s" : ""}`}
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="attachedSortBy"
                  className="text-sm font-medium text-gray-700"
                >
                  Sort by
                </label>
                <select
                  id="attachedSortBy"
                  value={attachedSortBy}
                  onChange={(e) => handleAttachedSortChange(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="name">A-Z</option>
                  <option value="created_at">Date Created</option>
                  <option value="updated_at">Date Updated</option>
                </select>
                <button
                  onClick={handleAttachedOrderToggle}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title={attachedOrder === "asc" ? "Ascending" : "Descending"}
                  style={{
                    fontSize: "18px",
                    lineHeight: "1",
                    cursor: "pointer",
                  }}
                >
                  {attachedOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
            <div
              className="responsive-grid"
              id="attachedRecordings"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "20px",
                width: "100%",
                margin: "0 auto",
              }}
            >
              {attachedRecordings.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                  <div className="empty-icon">🎵</div>
                  <div className="empty-text">No attached recordings found</div>
                </div>
              ) : (
                attachedRecordings.map((recording) => (
                  <RecordingCard
                    key={recording.path}
                    recording={recording}
                    isAttached={true}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Unattached recordings tab content */}
        {!loading && activeTab === "unattached" && (
          <div
            className="tab-content"
            style={{ display: activeTab === "unattached" ? "block" : "none" }}
          >
            {/* Data retention notice */}
            <div
              style={{
                backgroundColor: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "16px",
                fontSize: "14px",
                color: "#92400e",
              }}
            >
              ⚠️ These recordings have not been linked to a patient encounter.
              Please review and attach them, otherwise they will be removed per
              our data retention policy.
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <input
                  type="checkbox"
                  className="recording-checkbox"
                  checked={
                    selectedUnattachedPaths.size ===
                      unattachedRecordings.length &&
                    unattachedRecordings.length > 0
                  }
                  onChange={() => handleToggleSelectAll(false)}
                  title="Select all unattached recordings"
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                {getUnattachedSelectedCount() === 0 ? (
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      fontWeight: "500",
                    }}
                  >
                    Select All
                  </span>
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#1e40af",
                        fontWeight: "500",
                      }}
                    >
                      {getUnattachedSelectedCount()} selected
                    </span>
                    <button
                      onClick={async () => {
                        if (getTotalSelectedCount() > 0) {
                          activeTab === "attached"
                            ? await handleAttachedDelete()
                            : await handleUnattachedDelete();
                        } else {
                          alert("Please select at least one recording to delete.");
                        }
                      }}
                      disabled={bulkDeleting}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: bulkDeleting ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: bulkDeleting ? 0.6 : 1,
                      }}
                    >
                      {bulkDeleting
                        ? "Deleting..."
                        : `Delete ${getUnattachedSelectedCount()} recording${getUnattachedSelectedCount() !== 1 ? "s" : ""}`}
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="unattachedSortBy"
                  className="text-sm font-medium text-gray-700"
                >
                  Sort by
                </label>
                <select
                  id="unattachedSortBy"
                  value={unattachedSortBy}
                  onChange={(e) => handleUnattachedSortChange(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="name">A-Z</option>
                  <option value="created_at">Date Created</option>
                  <option value="updated_at">Date Updated</option>
                </select>
                <button
                  onClick={handleUnattachedOrderToggle}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title={unattachedOrder === "asc" ? "Ascending" : "Descending"}
                  style={{
                    fontSize: "18px",
                    lineHeight: "1",
                    cursor: "pointer",
                  }}
                >
                  {unattachedOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
            <div
              className="responsive-grid"
              id="unattachedRecordings"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "20px",
                width: "100%",
                margin: "0 auto",
              }}
            >
              {unattachedRecordings.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                  <div className="empty-icon">🎵</div>
                  <div className="empty-text">
                    No unattached recordings found
                  </div>
                </div>
              ) : (
                unattachedRecordings.map((recording) => (
                  <RecordingCard
                    key={recording.path}
                    recording={recording}
                    isAttached={false}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <RecordingPreviewOverlay
        selectedRecording={selectedRecording}
        recordingData={recordingData}
        loadingRecording={loadingRecording}
        deletingRecording={deletingRecording}
        onClose={closePreview}
        onDeleteClick={async () => {
          if (!selectedRecording) return;

          activeTab === "attached"
            ? await handleAttachedDelete()
            : await handleUnattachedDelete();
        }}
      />
    </>
  );
}
