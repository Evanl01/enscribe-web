import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import * as api from "@/lib/api";
import * as ui from "@/utils/ui.js";
import * as format from "@/utils/format.js";
import PatientEncounterPreviewOverlay from "@/components/PatientEncounterPreviewOverlay";
import AudioPlayer from "@/components/AudioPlayer.jsx";
import ExportDataAsFileMenu from "@/components/ExportDataAsFileMenu.jsx";
import Auth from "@/components/Auth.jsx";
import CopyToClipboard from '@/components/CopyToClipboard.jsx';
import parseSoapNotes from "@/utils/parseSoapNotes";

function EditPatientEncounterPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // State management
  const [patientEncounterId, setPatientEncounterId] = useState(null);
  const [patientEncounterName, setPatientEncounterName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [associatedSoapNotes, setAssociatedSoapNotes] = useState([]);
  const [soapSubjective, setSoapSubjective] = useState("");
  const [soapObjective, setSoapObjective] = useState("");
  const [soapAssessment, setSoapAssessment] = useState("");
  const [soapPlan, setSoapPlan] = useState("");
  const [billingSuggestion, setBillingSuggestion] = useState("");
  const [recordingFileUrl, setRecordingFileUrl] = useState("");
  const [recordingFileName, setRecordingFileName] = useState("");
  const [recordingFileSize, setRecordingFileSize] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedSoapNoteId, setSelectedSoapNoteId] = useState(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [previewPatientEncounterName, setPreviewPatientEncounterName] =
    useState(patientEncounterName);

  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState(null);
  const [openSections, setOpenSections] = useState({
    recording: true,
    transcript: true,
    soapNotes: true,
    editSoapNote: false,
  });
  const [editingSoapNote, setEditingSoapNote] = useState(null);

  // Helper to toggle sections
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sortedSoapNotes = [...associatedSoapNotes].sort((a, b) => {
    if (sortBy === "created_at") {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    if (sortBy === "updated_at") {
      return new Date(b.updated_at) - new Date(a.updated_at);
    }
    if (sortBy === "A-Z") {
      return (a.soapNote_text?.soapNote?.subjective || "").localeCompare(
        b.soapNote_text?.soapNote?.subjective || ""
      );
    }
    return 0;
  });

  // Fetch patient encounter data on mount
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const result = await api.getPatientEncounterComplete(id);
        
        if (!result.success) {
          if (result.status === 401) {
            navigate("/login");
          }
          throw new Error(result.error);
        }
        const data = result.data;

        console.log("Fetched patient encounter data:", data);
        // Fill in all fields from API response
        setPatientEncounterId(data.patientEncounter.id || null);
        setPatientEncounterName(data.patientEncounter.name || "");
        setTranscript(data.transcript.transcript_text || "");
        setRecordingFileUrl(data.recording.recording_file_signed_url || "");
        setRecordingFileName(
          format.extractRecordingFilenameFromPath(data.recording.recording_file_path) || "recording.webm"
        );
        setRecordingFileSize(data.recording.recording_file_size || 0);
        setRecordingDuration(data.recording.recording_duration || 0);

        // Parse soapNote_text if present
        if (data.soapNotes) {
          const parsedSoapNotes = parseSoapNotes(data.soapNotes);
          setAssociatedSoapNotes(parsedSoapNotes);
        }
      } catch (error) {
        console.error("Error fetching patient encounter data:", error);
        setErrorMessage(`Failed to load patient encounter: ${error.message}`);
        setRecordingFileUrl("");
        setRecordingFileName("");
        setRecordingFileSize(0);
        setRecordingDuration(0);
      }
    };
    fetchData();
  }, [id]);

  // Sync preview name with loaded name
  useEffect(() => {
    setPreviewPatientEncounterName(patientEncounterName);
  }, [patientEncounterName]);

  // Audio error handler for AudioPlayer component
  const handleAudioError = (e) => {
    const error = e?.target?.error;
    let errorMessage = "Unknown audio error";
    if (error) {
      switch (error.code) {
        case 1:
          errorMessage = "Audio loading was aborted";
          break;
        case 2:
          errorMessage = "Network error occurred while loading audio";
          break;
        case 3:
          errorMessage = "Audio decoding error - file may be corrupted";
          break;
        case 4:
          errorMessage = "Audio format not supported by browser";
          break;
        default:
          errorMessage = `Audio error (code: ${error.code})`;
      }
    }
    console.error(`Error loading audio: ${errorMessage}`, error);
    alert(`Error loading audio: ${errorMessage}`);
  };

  // Format duration helper
  const formatDuration = (seconds) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Save patient encounter and transcript
  const savePatientEncounterAndTranscript = async (id) => {
    setIsSaving(true);
    const missingFields = [];
    if (!previewPatientEncounterName.trim())
      missingFields.push("Patient Encounter Name");
    if (!transcript.trim()) missingFields.push("Transcript");
    if (missingFields.length > 0) {
      alert("Required field(s): " + missingFields.join(", "));
      setIsSaving(false);
      return;
    }
    // console.log("Saving patient encounter:", {
    //   id: id,
    //   name: previewPatientEncounterName,
    //   transcript_text: transcript,
    // });
    const result = await api.updatePatientEncounterAndTranscript(id, {
      name: previewPatientEncounterName,
      transcript_text: transcript,
    });

    if (!result.success) {
      console.error("Error saving patient encounter:", result.error);
      if (result.status === 401) {
        navigate("/login");
        return;
      }
      alert("Error saving data: " + result.error);
      setIsSaving(false);
      return;
    }

    console.log("Patient encounter saved successfully:", result.data);
    setPatientEncounterName(previewPatientEncounterName);
    setIsSaving(false);
    setOpenSections((prev) => ({
      ...prev,
      editSoapNote: false, // Close section 4 before reload
    }));
    setEditingSoapNote(null);
    setSelectedSoapNoteId(null);
    window.location.reload();
  };
  const saveSoapNote_BillingSuggestion = async (id) => {
    setIsSaving(true);
    const missingFields = [];
    if (!patientEncounterName.trim())
      missingFields.push("Patient Encounter Name");
    if (!soapSubjective.trim()) missingFields.push("Subjective");
    if (!soapObjective.trim()) missingFields.push("Objective");
    if (!soapAssessment.trim()) missingFields.push("Assessment");
    if (!soapPlan.trim()) missingFields.push("Plan");
    if (!billingSuggestion.trim()) missingFields.push("Billing Suggestion");
    if (missingFields.length > 0) {
      alert("Required field(s): " + missingFields.join(", "));
      setIsSaving(false);
      return;
    }

    try {
      const soapNoteObject = {
        subjective: soapSubjective.replace(/\r?\n/g, "\n"),
        objective: soapObjective.replace(/\r?\n/g, "\n"),
        assessment: soapAssessment.replace(/\r?\n/g, "\n"),
        plan: soapPlan.replace(/\r?\n/g, "\n"),
      };
      const result = await api.patchSoapNote(id, {
        soapNote_text: {
          soapNote: soapNoteObject,
          billingSuggestion,
        },
      });
      if (!result.success) {
        if (result.status === 401) {
          navigate("/login");
        } else {
          alert("Error saving data: " + result.error);
        }
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
      window.location.reload();
    } catch (error) {
      alert("Error saving data: " + error.message);
      setIsSaving(false);
    }
  };

  const handleEditSoapNote = () => {
    const note = associatedSoapNotes.find((n) => n.id === selectedSoapNoteId);
    console.log("Editing SOAP Note:", note);
    if (note) {
      setEditingSoapNote(note);
      setSoapSubjective(note.soapNote_text?.soapNote?.subjective || "");
      setSoapObjective(note.soapNote_text?.soapNote?.objective || "");
      setSoapAssessment(note.soapNote_text?.soapNote?.assessment || "");
      setSoapPlan(note.soapNote_text?.soapNote?.plan || "");
      const billingSuggestionObject =
        note.soapNote_text?.billingSuggestion || {};
      const billingSuggestionText = format.cleanMarkdownText(
        "",
        billingSuggestionObject,
        0,
        "1.25em"
      );
      setBillingSuggestion(billingSuggestionText);
      setOpenSections((prev) => ({
        ...prev,
        soapNotes: false,
        editSoapNote: true,
      }));
    }
  };
  return (
    <>
      <Auth />
      <div className="max-w-8xl mx-auto p-6">
        {/* Title row with Export button on right */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            Edit Patient Encounter: {patientEncounterName}
          </h1>
          <ExportDataAsFileMenu
            patientEncounterData={{ name: patientEncounterName }}
            transcriptData={{ transcript_text: transcript }}
            soapNotesData={associatedSoapNotes}
          />
        </div>

        {/* Section 1: Patient Encounter Recording (Accordion) */}
        <div className="border border-gray-200 rounded-lg mb-4">
          <button
            className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            onClick={() => toggleSection("recording")}
            disabled={false}
          >
            <span className="text-lg font-semibold">
              1. Patient Encounter Recording
            </span>
            <span className="text-xl">
              {openSections.recording ? "−" : "+"}
            </span>
          </button>
          {openSections.recording !== false && (
            <div className="p-6 border-t border-gray-200">
              {recordingFileUrl ? (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-green-800">
                      Recording Ready
                    </p>
                    <p className="text-sm text-green-600">
                      {recordingFileName}
                    </p>
                    <div className="mt-4">
                      <AudioPlayer
                        src={recordingFileUrl}
                        filename={recordingFileName}
                        onError={handleAudioError}
                        maxWidth="600px"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  No recording found for this patient encounter.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Review */}
        {/* Section 2: Transcript & SOAP Note */}
        <div className="border border-gray-200 rounded-lg mb-4">
          <button
            className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            onClick={() => toggleSection("transcript")}
            disabled={false}
          >
            <span className="text-lg font-semibold">
              2. Edit Name and Transcript
            </span>
            <span className="text-xl">
              {openSections.transcript ? "−" : "+"}
            </span>
          </button>
          {openSections.transcript && (
            <div className="p-6 border-t border-gray-200">
              {errorMessage && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                  <div className="font-medium capitalize">Error</div>
                  <div className="text-sm">{errorMessage}</div>
                </div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Patient Encounter Name
                </label>
                <input
                  type="text"
                  value={previewPatientEncounterName}
                  onChange={(e) => setPreviewPatientEncounterName(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white"
                  placeholder="Enter patient encounter name..."
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Transcript
                </label>
                <div>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    disabled={isSaving}
                    className="w-full h-100 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                    style={{ minHeight: "20rem" }}
                    placeholder="Transcript will appear here..."
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <CopyToClipboard text={transcript} label="Copy" placement="right" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex gap-4">
                  {/* Export menu/button - placed to the left of Preview button */}
                  {/* <ExportDataAsFileMenu
                    patientEncounterData={{ name: patientEncounterName }}
                    transcriptData={{ transcript_text: transcript }}
                    soapNotesData={associatedSoapNotes}
                    billingSuggestionData={billingSuggestion}
                  /> */}

                  <button
                    onClick={() => savePatientEncounterAndTranscript(patientEncounterId)}
                    disabled={isSaving}
                    className={`bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium ${
                      isSaving ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Save Name and Transcript
                  </button>
                  {errorMessage && (
                    <div className="mt-3 text-red-600 text-sm text-right w-full">
                      {errorMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Associated SOAP Notes */}
        <div className="border border-gray-200 rounded-lg mb-4">
          <button
            className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            onClick={() => toggleSection("soapNotes")}
            disabled={false}
          >
            <span className="text-lg font-semibold">
              3. Select Associated SOAP Note
            </span>
            <span className="text-xl">
              {openSections.soapNotes ? "−" : "+"}
            </span>
          </button>
          {openSections.soapNotes && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">Associated SOAP Notes</h3>
                <div>
                  <label
                    htmlFor="sortSoapNotes"
                    className="mr-2 text-sm font-medium text-gray-700"
                  >
                    Sort By:
                  </label>
                  <select
                    id="sortSoapNotes"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="created_at">Created at</option>
                    <option value="updated_at">Updated at</option>
                    <option value="A-Z">A-Z</option>
                  </select>
                </div>
              </div>
              <div
                id="associatedSoapNotes"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "20px",
                  width: "100%",
                  margin: "0 auto",
                }}
              >
                {sortedSoapNotes.length === 0 ? (
                  <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                    <div className="empty-icon">📋</div>
                    <div className="empty-text">No SOAP notes yet</div>
                  </div>
                ) : (
                  sortedSoapNotes.map((soapNote) => (
                    <div
                      className="soap-card"
                      data-soapnote-id={soapNote.id}
                      key={soapNote.id}
                      style={{
                        background: "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        padding: "20px",
                        minWidth: 0,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "box-shadow 0.2s, transform 0.2s",
                        cursor: "pointer",
                        position: "relative",
                        border:
                          selectedSoapNoteId === soapNote.id
                            ? "2px solid #22c55e"
                            : "",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 4px 16px rgba(0,0,0,0.16)";
                        e.currentTarget.style.transform =
                          "translateY(-4px) scale(1.03)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0,0,0,0.08)";
                        e.currentTarget.style.transform = "none";
                      }}
                      onClick={() => setSelectedSoapNoteId(soapNote.id)}
                    >
                      <div
                        className="recent-icon"
                        style={{ fontSize: "2rem", marginBottom: "8px" }}
                      >
                        📋
                      </div>
                      <div
                        className="recent-title"
                        style={{ fontWeight: "bold", marginBottom: "6px" }}
                      >
                        {format.formatTimestamp(soapNote.created_at)}
                      </div>
                      <div
                        className="recent-preview"
                        style={{
                          color: "#555",
                          marginBottom: "12px",
                          fontSize: "0.95em",
                        }}
                      >
                        {soapNote.soapNote_text?.soapNote?.subjective
                          ? soapNote.soapNote_text.soapNote.subjective.substring(
                              0,
                              200
                            ) + "..."
                          : "No content"}
                      </div>
                      {selectedSoapNoteId === soapNote.id && (
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: "#22c55e",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "1.2rem",
                            boxShadow: "0 2px 6px rgba(34,197,94,0.2)",
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  className={`bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium ${
                    selectedSoapNoteId ? "" : "opacity-50 cursor-not-allowed"
                  }`}
                  disabled={!selectedSoapNoteId}
                  onClick={handleEditSoapNote}
                >
                  Edit this SOAP note
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Edit SOAP Note (always rendered, closed and disabled unless a note is selected) */}
        <div className="border border-gray-200 rounded-lg mb-4">
          <button
            className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            onClick={() => {
              if (editingSoapNote) toggleSection("editSoapNote");
            }}
            disabled={!editingSoapNote}
          >
            <span className="text-lg font-semibold">
              4. Edit Selected SOAP Note
            </span>
            <span className="text-xl">
              {openSections.editSoapNote ? "−" : "+"}
            </span>
          </button>
          {/* Only show section content if open and editingSoapNote exists */}
          {openSections.editSoapNote && editingSoapNote && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Subjective
                </label>
                <textarea
                  value={soapSubjective}
                  onChange={(e) => setSoapSubjective(e.target.value)}
                  className="w-full h-80 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "8rem" }}
                  placeholder="Subjective notes..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <CopyToClipboard text={soapSubjective} label="Copy" placement="right" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Objective
                </label>
                <textarea
                  value={soapObjective}
                  onChange={(e) => setSoapObjective(e.target.value)}
                  className="w-full h-80 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "8rem" }}
                  placeholder="Objective notes..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <CopyToClipboard text={soapObjective} label="Copy" placement="right" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Assessment
                </label>
                <textarea
                  value={soapAssessment}
                  onChange={(e) => setSoapAssessment(e.target.value)}
                  className="w-full h-50 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "8rem" }}
                  placeholder="Assessment notes..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <CopyToClipboard text={soapAssessment} label="Copy" placement="right" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Plan
                </label>
                <textarea
                  value={soapPlan}
                  onChange={(e) => setSoapPlan(e.target.value)}
                  className="w-full h-50 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "8rem" }}
                  placeholder="Plan notes..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <CopyToClipboard text={soapPlan} label="Copy" placement="right" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                  Billing Suggestion
                </label>
                <textarea
                  value={billingSuggestion}
                  onChange={(e) => setBillingSuggestion(e.target.value)}
                  className="w-full h-80 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                  style={{ minHeight: "20rem" }}
                  placeholder="Billing suggestion..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <CopyToClipboard text={billingSuggestion} label="Copy" placement="right" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200">
                <div className="flex flex-col items-end">
                  <button
                    onClick={() =>
                      saveSoapNote_BillingSuggestion(selectedSoapNoteId)
                    }
                    disabled={isSaving}
                    className={`bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium ${
                      isSaving ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Save SOAP Note and Billing Suggestion
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </>
  );
}

export default EditPatientEncounterPage;
