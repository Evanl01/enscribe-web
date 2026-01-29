import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import * as api from "@/lib/api";
import * as ui from "@/utils/ui.js";
import * as format from "@/utils/format.js";
import PatientEncounterPreviewOverlay from "@/components/PatientEncounterPreviewOverlay";
import ExportDataAsFileMenu from "@/components/ExportDataAsFileMenu";
import Auth from "@/components/Auth.jsx";
import CopyToClipboard from '@/components/CopyToClipboard.jsx';
import parseSoapNotes from "@/utils/parseSoapNotes";

export default function EditSoapNotePage() {
  const navigate = useNavigate();
  const { id: soapNoteIdRaw } = useParams();
  const soapNoteId = soapNoteIdRaw ? parseInt(soapNoteIdRaw, 10) : null;

  // State management
  const [patientEncounterId, setPatientEncounterId] = useState("");
  const [patientEncounterName, setPatientEncounterName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [soapSubjective, setSoapSubjective] = useState("");
  const [soapObjective, setSoapObjective] = useState("");
  const [soapAssessment, setSoapAssessment] = useState("");
  const [soapPlan, setSoapPlan] = useState("");
  const [billingSuggestion, setBillingSuggestion] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState(null);

  // Fetch soap note and patient encounter data on mount
  useEffect(() => {
    if (!soapNoteId) return;
    const fetchData = async () => {
      try {
        // 1. Fetch soapNote by id
        const result = await api.getSoapNoteById(soapNoteId);
        if (!result.success) {
          if (result.status === 401) {
            navigate("/login");
          }
          throw new Error(result.error);
        }
        let data = parseSoapNotes(result.data);
        if (!data) throw new Error("SOAP note not found");

        // 2. Set SOAP note fields
        const soapNoteText = data.soapNote_text;
        setSoapSubjective(soapNoteText?.soapNote?.subjective || "");
        setSoapObjective(soapNoteText?.soapNote?.objective || "");
        setSoapAssessment(soapNoteText?.soapNote?.assessment || "");
        setSoapPlan(soapNoteText?.soapNote?.plan || "");
        let billingSuggestionObj = soapNoteText?.billingSuggestion || {};
        let billingSuggestionText = format.cleanMarkdownText(
          "",
          billingSuggestionObj,
          0,
          "1.25em"
        );
        setBillingSuggestion(billingSuggestionText);

        // 3. Fetch patient encounter using soapNote.patientEncounter_id
        const patientEncounterId = data.patientEncounter_id;
        if (!patientEncounterId)
          throw new Error("Associated Patient Encounter not found");
        
        setPatientEncounterId(patientEncounterId);
        const patientEncounterResult = await api.getPatientEncounterComplete(patientEncounterId);
        if (!patientEncounterResult.success) {
          if (patientEncounterResult.status === 401) {
            navigate("/login");
          }
          throw new Error(patientEncounterResult.error);
        }
        const patientEncounterData = patientEncounterResult.data.patientEncounter;
        setPatientEncounterName(patientEncounterData.name || "");
      } catch (error) {
        console.error("Error fetching SOAP note or patient encounter:", error);
        setErrorMessage(
          `Failed to load SOAP note or patient encounter: ${error.message}`
        );
        setPatientEncounterName("");
        setSoapSubjective("");
        setSoapObjective("");
        setSoapAssessment("");
        setSoapPlan("");
        setBillingSuggestion("");
      }
    };
    fetchData();
  }, [soapNoteId]);

  // Save transcript and note
  const saveSoapNote = async () => {
    setIsSaving(true);
    const missingFields = [];
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

      const payload = {
        soapNote_text: {
          soapNote: soapNoteObject,
          billingSuggestion,
        },
      };
      console.log("Saving SOAP note:", payload);
      
      const result = await api.patchSoapNote(soapNoteId, payload);
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

  return (
    <>
      <Auth />
      <div className="max-w-8xl mx-auto p-6">
        {/* Title row with Export button on right */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Edit Soap Note</h1>
          <ExportDataAsFileMenu
            patientEncounterData={{ name: patientEncounterName }}
            transcriptData={null}
            soapNotesData={[
              {
                id: soapNoteId,

                soapNote_text: {
                  soapNote: {
                    subjective: soapSubjective,
                    objective: soapObjective,
                    assessment: soapAssessment,
                    plan: soapPlan,
                  },
                  billingSuggestion: billingSuggestion,
                },
              },
            ]}
          />
        </div>

        {/* Section 1: Edit SOAP Note */}
        <div className="border border-gray-200 rounded-lg">
          <button
            className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            onClick={() => {}}
            disabled={false}
          >
            <span className="text-lg font-semibold">1. Edit SOAP Note</span>
            <span className="text-xl">−</span>
          </button>
          <div className="p-6 border-t border-gray-200">
            {/* Associated Patient Encounter Name (non-editable) */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                Associated Patient Encounter Name
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={patientEncounterName}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  style={{ minWidth: "12rem" }}
                />
              </div>
              <div className="mt-2 text-red-600 text-sm font-medium">
                This field is view-only. To change, go to{" "}
                <a
                  href={`/edit-patient-encounter/${patientEncounterId}`}
                  className="text-blue-600 underline text-sm font-medium"
                  style={{ whiteSpace: "nowrap" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Edit Patient Encounter
                </a>{" "}
                page.
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                <div className="font-medium capitalize">Error</div>
                <div className="text-sm">{errorMessage}</div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-bold text-xl text-gray-700 mb-2">
                Subjective
              </label>
              <textarea
                value={soapSubjective}
                onChange={(e) => setSoapSubjective(e.target.value)}
                disabled={isSaving}
                className="w-full h-80 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                style={{ minHeight: "8rem" }}
                placeholder="Subjective notes will appear here..."
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
                disabled={isSaving}
                className="w-full h-80 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                style={{ minHeight: "8rem" }}
                placeholder="Objective notes will appear here..."
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
                disabled={isSaving}
                className="w-full h-50 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                style={{ minHeight: "8rem" }}
                placeholder="Assessment notes will appear here..."
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
                disabled={isSaving}
                className="w-full h-50 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                style={{ minHeight: "8rem" }}
                placeholder="Plan notes will appear here..."
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
                disabled={isSaving}
                className="w-full h-80 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white resize-none"
                style={{ minHeight: "20rem" }}
                placeholder="Billing suggestion will appear here..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <CopyToClipboard text={billingSuggestion} label="Copy" placement="right" />
              </div>
            </div>
            <div className="flex flex-col items-end">
              <button
                onClick={() => setShowPreview(true)}
                disabled={isSaving}
                className={`bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium ${
                  isSaving ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Preview & Save
              </button>
              {errorMessage && (
                <div className="mt-3 text-red-600 text-sm text-right w-full">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <PatientEncounterPreviewOverlay
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
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
        onSave={saveSoapNote}
        isSaving={isSaving}
        errorMessage={errorMessage}
        sections={["soapNote", "billingSuggestion"]}
        isPatientEncounterNameEditable={false}
      />
    </>
  );
}
