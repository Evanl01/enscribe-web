import React, { useState } from "react";
import { exportDataAsFile } from "@/scripts/export.js";

export default function ExportDataAsFileMenu({
  patientEncounterData,
  transcriptData,
  soapNotesData,
}) {
  const [show, setShow] = useState(false);
  // console.log("ExportDataAsFileMenu rendered with:", {
  //   patientEncounterData,
  //   transcriptData,
  //   soapNotesData,
  // });
  const handleExport = async (type) => {
    const exportObj = {
      patientEncounterName: patientEncounterData?.name || "",
      transcript: transcriptData?.transcript_text || "",
      soapNotes: soapNotesData || [],
    };
    await exportDataAsFile(exportObj, type);
    setShow(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        className="bg-[#DE7459] hover:bg-[#D1735E] text-white px-8 py-3 rounded-lg font-medium"
      >
        Export As...
      </button>
      {show && (
        <div className="absolute left-0 top-full w-full z-10 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col"
          style={{ marginTop: 0 }}
        >
          <button
            className="bg-white hover:bg-gray-100 text-black px-3 py-2 rounded-t w-full font-medium transition-all duration-150"
            onClick={() => handleExport("word")}
          >
            Export as Word
          </button>
          <button
            className="bg-white hover:bg-gray-100 text-black px-3 py-2 rounded-b w-full font-medium transition-all duration-150"
            onClick={() => handleExport("pdf")}
          >
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}