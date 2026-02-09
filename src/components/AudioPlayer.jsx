import React from "react";
import { saveAs } from "file-saver";

export default function AudioPlayer({
  src,
  onError,
  filename = "recording.webm",
  maxWidth = "100%",
}) {
  // Detect audio type from filename or URL
  const getAudioType = (url) => {
    if (!url) return "audio/mpeg";
    const ext = url.toLowerCase().split(".").pop()?.split("?")[0] || "";
    const typeMap = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      webm: "audio/webm",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      mp4: "audio/mp4",
    };
    return typeMap[ext] || "audio/mpeg";
  };

  const audioType = getAudioType(src);

  return (
    <div
      style={{
        padding: "4px",
        width: "100%", // Add this
        maxWidth: maxWidth, // Keep this
        backgroundColor: "#f3f4f6",
        borderRadius: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0px",
          alignItems: "center",
          width: "100%",
        }}
      >
        <audio
          controls
          controlsList="nodownload noplaybackrate"
          style={{ flex: 1, minWidth: 0 }}
          preload="metadata"
          onError={onError}
        >
          <source src={src} type={audioType} />
          Your browser does not support the audio element.
        </audio>

        {/* Download Button with SVG */}
        <button
          onClick={async () => {
            try {
              const response = await fetch(src);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const blob = await response.blob();
              saveAs(blob, filename);
            } catch (error) {
              console.error("Error downloading recording:", error);
              alert("Failed to download recording. Please try again.");
            }
          }}
          style={{
            width: "40px",
            height: "40px",
            minWidth: "40px",
            minHeight: "40px",
            padding: "3px",
            backgroundColor: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#e5e7eb")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#f3f4f6")
          }
          title="Download recording"
        >
          <img
            src="/download-icon.svg"
            alt="Download"
            style={{ width: "18px", height: "18px" }}
          />
        </button>

        {/* Spacer for right padding */}
        <div style={{ width: "10px" }} />
      </div>
    </div>
  );
}
