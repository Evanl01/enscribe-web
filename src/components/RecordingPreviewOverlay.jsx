import React from "react";
import { useNavigate } from "react-router-dom";
import * as format from "@/utils/format.js";

export default function RecordingPreviewOverlay({
  selectedRecording,
  recordingData,
  loadingRecording,
  deletingRecording,
  onClose,
  onDeleteClick
}) {
  const navigate = useNavigate();

  if (!selectedRecording) return null;

  const getRecordingName = (path) => {
    return path?.split("/").pop() || "unknown";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "30px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Recording Preview</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "5px"
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ marginBottom: "20px" }}>
          <h3 ><strong>Name:</strong> {getRecordingName(selectedRecording.path)}</h3>
          {/* <p><strong>File Path:</strong> {selectedRecording.path}</p> */}
          <p><strong>Size:</strong> {formatFileSize(selectedRecording.size)}</p>
          <p><strong>Created:</strong> {selectedRecording.created_at ? format.formatTimestamp(selectedRecording.created_at) : "Unknown"}</p>
          {selectedRecording.patientEncounter && (
            <p><strong>Patient Encounter:</strong> {selectedRecording.patientEncounter.name || "Unnamed Encounter"}</p>
          )}
        </div>
        
        <div style={{ 
          padding: "4px", 
          backgroundColor: "#f3f4f6", 
          borderRadius: "8px"
        }}>
          {selectedRecording.missing ? (
            <div style={{ textAlign: "center", color: "#ef4444" }}>
              <p style={{ margin: 0, fontWeight: "bold" }}>
                ❌ File Missing from Storage
              </p>
              <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem" }}>
                This recording file cannot be found in storage and cannot be played.
              </p>
            </div>
          ) : !recordingData ? (
            <div style={{ textAlign: "center", color: "#666" }}>
              <p style={{ margin: 0 }}>
                🎵 Click to load audio player
              </p>
            </div>
          ) : loadingRecording ? (
            <div style={{ textAlign: "center", color: "#666" }}>
              <p style={{ margin: 0 }}>Loading audio player...</p>
            </div>
          ) : recordingData && recordingData.recording_file_signed_url ? (
            <div>
              {/* <div style={{ marginBottom: "15px", textAlign: "center" }}>
                <p style={{ margin: 0, fontWeight: "bold", color: "#333" }}>Audio Player</p>
              </div> */}
              <audio 
                controls 
                style={{ width: "100%"}}
                preload="metadata"
              >
                <source src={recordingData.recording_file_signed_url} type="audio/mpeg" />
                <source src={recordingData.recording_file_signed_url} type="audio/wav" />
                <source src={recordingData.recording_file_signed_url} type="audio/ogg" />
                <source src={recordingData.recording_file_signed_url} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#ef4444" }}>
              <p style={{ margin: 0 }}>
                Failed to load audio player. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: "20px" }}>
          {/* Buttons for Unattached Recordings */}
          {!selectedRecording.id && (
            <div style={{ display: "flex", gap: "10px" }}>
              {/* Create Patient Encounter Button - only show for non-missing recordings */}
              {!selectedRecording.missing && (
                <button
                  onClick={() => {
                    const path = selectedRecording.path;
                    navigate(`/new-patient-encounter?recordingPath=${encodeURIComponent(path)}`);
                  }}
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "bold",
                    flex: "1",
                    lineHeight: "1.2",
                    wordWrap: "break-word",
                    textAlign: "center"
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#059669")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#10b981")}
                >
                  Create Patient Encounter
                </button>
              )}
              
              {/* Delete Button */}
              <button
                onClick={onDeleteClick}
                disabled={deletingRecording}
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "1rem",
                  cursor: deletingRecording ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  flex: "1",
                  lineHeight: "1.2",
                  wordWrap: "break-word",
                  textAlign: "center"
                }}
                onMouseOver={(e) => !deletingRecording && (e.target.style.backgroundColor = "#dc2626")}
                onMouseOut={(e) => !deletingRecording && (e.target.style.backgroundColor = "#ef4444")}
              >
                {deletingRecording ? "Deleting..." : "Delete Recording"}
              </button>
            </div>
          )}

          {/* Buttons for Attached Recordings */}
          {selectedRecording.id && (
            <div style={{ display: "flex", gap: "10px" }}>
              {/* View Patient Encounter Button */}
              <button
                onClick={() => {
                  const patientEncounterId = selectedRecording.patientEncounter?.id;
                  if (patientEncounterId) {
                    navigate(`/edit-patient-encounter/${patientEncounterId}`);
                  }
                }}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "bold",
                  flex: "1",
                  lineHeight: "1.2",
                  wordWrap: "break-word",
                  textAlign: "center"
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#1d4ed8")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#2563eb")}
              >
                View Patient Encounter
              </button>
              
              {/* Delete Button */}
              <button
                onClick={onDeleteClick}
                disabled={deletingRecording}
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "1rem",
                  cursor: deletingRecording ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  flex: "1",
                  lineHeight: "1.2",
                  wordWrap: "break-word",
                  textAlign: "center"
                }}
                onMouseOver={(e) => !deletingRecording && (e.target.style.backgroundColor = "#dc2626")}
                onMouseOut={(e) => !deletingRecording && (e.target.style.backgroundColor = "#ef4444")}
              >
                {deletingRecording ? "Deleting..." : "🗑️ Delete Recording"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
