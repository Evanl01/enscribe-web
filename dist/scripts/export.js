import jsPDF from "jspdf";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import * as format from "@/public/scripts/format.js";
/**
 * Export patient encounter data as PDF or Word.
 * Only includes sections present in the data object.
 * Supports multiple SOAP notes (data.soapNotes: array).
 * @param {Object} data - Encounter data.
 * @param {string} data.patientEncounterName - Required.
 * @param {string} [data.transcript]
 * @param {Array<Object>} [data.soapNotes] - Each with subjective/objective/assessment/plan.
 * @param {Object} [data.billingSuggestion]
 * @param {"pdf"|"word"} type - Export type.
 */

export async function exportDataAsFile(data, type = "pdf") {
  if (!data?.patientEncounterName) {
    console.error("[exportDataAsFile]: data: ", data);
    alert("Patient encounter name is required for export.");
    return;
  }
  console.log('[exportDataAsFile] Exporting data: ', data);

  if (type === "pdf") {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 20;

    // Add font color param, default black
    function addHeader(text, fontSize = 16, spacing = 8, color = "#2563eb") {
      doc.setFontSize(fontSize);
      doc.setTextColor(color);
      y += spacing;
      y = checkAddPage(doc, y);
      doc.text(text, 20, y);
      doc.setTextColor("#000000"); // Reset to black after
    }

    function addBody(text, fontSize = 12, spacing = 8, color = "#000000") {
      doc.setFontSize(fontSize);
      doc.setTextColor(color);
      const lines = doc.splitTextToSize(text, 180); // 180mm width
      lines.forEach(line => {
        y += spacing;
        y = checkAddPage(doc, y);
        doc.text(line, 20, y);
      });
      doc.setTextColor("#000000"); // Reset to black after
    }

    addHeader(data.patientEncounterName, 20, 8, "#000000");

    if (data.transcript) {
      y += 10; // Add spacing before transcript
      addHeader("Transcript", 16, 0); // blue
      addBody(data.transcript, 12, 8); // blue
      y += 10; // Add spacing after transcript
    }

    if (Array.isArray(data.soapNotes) && data.soapNotes.length > 0) {
      data.soapNotes.forEach((note, idx) => {
        addHeader(`SOAP Note${data.soapNotes.length > 1 ? ` #${idx + 1}` : ""}`, 16, 8); // blue
        const soapNoteObject = note.soapNote_text.soapNote || {};
        const billingSuggestionObject = note.soapNote_text.billingSuggestion || {};
        if (soapNoteObject) {
          if (typeof soapNoteObject !== 'object') {
            addHeader("SOAP Note", 16, 8);
            addBody(soapNoteObject, 12, 8);
          }
          else {
            for (const [key, value] of Object.entries(soapNoteObject)) {
              if (value) {
                addHeader(key.charAt(0).toUpperCase() + key.slice(1), 14, 8);
                addBody(format.printJsonObject(value), 12, 8);
              }
            }
          }
        }
        y += 8; // Add spacing after each SOAP note

        if (billingSuggestionObject) {
          addHeader("Billing Suggestion", 16, 8);
          if (typeof billingSuggestionObject !== 'object') {
            addBody(billingSuggestionObject, 12, 8);
          } else {
            for (const [key, value] of Object.entries(billingSuggestionObject)) {
              if (value) {
                addHeader(key.charAt(0).toUpperCase() + key.slice(1), 14, 8);
                addBody(format.printJsonObject(value), 12, 8);
              }
            }
          }
        }
        y += 10; // Add spacing after billing suggestion
      });
    }

    doc.save(`${data.patientEncounterName}.pdf`);
  } else if (type === "word") {
    const children = [
      new Paragraph({
        text: data.patientEncounterName,
        heading: HeadingLevel.TITLE,
      }),
    ];

    // Helper for colored text in docx
    function coloredParagraph(text, heading, color = "000000", spacing) {
      return new Paragraph({
        text,
        heading,
        color,
        spacing: spacing !== undefined ? spacing : { after: 400 },
      });
    }
    function markdownTextColoredParagraph(markdownText, heading, color = "000000", spacing) {
      if (typeof markdownText !== "string") return [];

      const lines = markdownText.split("\n").filter(line => line.trim().length > 0);
      console.log("Markdown lines for Word export:", lines);
      const paragraphs = lines.map(line =>
        coloredParagraph(line, heading, color, spacing)
      );
      return paragraphs;
    }


    if (data.transcript) {
      children.push(
        coloredParagraph("Transcript", HeadingLevel.HEADING_1, "2563eb", { before: 400, after: 200 }),
        coloredParagraph(data.transcript, undefined, "2563eb", { after: 800 }),
        new Paragraph({ text: "" }) // Add spacing after transcript
      );
    }

    if (Array.isArray(data.soapNotes) && data.soapNotes.length > 0) {
      data.soapNotes.forEach((note, idx) => {
        children.push(
          coloredParagraph(
            `SOAP Note${data.soapNotes.length > 1 ? ` #${idx + 1}` : ""}`,
            HeadingLevel.HEADING_1,
            "2563eb",
            { before: 400, after: 200 }
          )
        );
        const soapNoteObject = note.soapNote_text?.soapNote || {};
        const billingSuggestionObject = note.soapNote_text?.billingSuggestion || {};

        if (soapNoteObject && typeof soapNoteObject === "object") {
          for (const [key, value] of Object.entries(soapNoteObject)) {
            if (value) {
              children.push(
                coloredParagraph(key.charAt(0).toUpperCase() + key.slice(1), HeadingLevel.HEADING_2, "2563eb", { before: 200 }),
                ...markdownTextColoredParagraph(value, undefined, "2563eb", {before: 50})
              );
            }
          }
        } else if (soapNoteObject) {
          children.push(
            coloredParagraph("SOAP Note", HeadingLevel.HEADING_1, "2563eb", { before: 200 }),
            ...markdownTextColoredParagraph(soapNoteObject, undefined, "2563eb", { after: 800 })
          );
        }
        children.push(new Paragraph({ text: "" })); // Add spacing after SOAP note

        if (typeof billingSuggestionObject !== 'object') {
          children.push(
            coloredParagraph("Billing Suggestion", HeadingLevel.HEADING_2, "2563eb", { before: 400 }),
            ...markdownTextColoredParagraph(billingSuggestionObject, undefined, "2563eb")
          );
        }
        else {
          children.push(
            coloredParagraph("Billing Suggestion", HeadingLevel.HEADING_1, "2563eb", { before: 400})
          );
          for (const [key, value] of Object.entries(billingSuggestionObject)) {
            if (value) {
              children.push(
                coloredParagraph(key.charAt(0).toUpperCase() + key.slice(1), HeadingLevel.HEADING_2, "2563eb", { before: 200 }),
                ...markdownTextColoredParagraph(value, undefined, "2563eb", {before: 50})
              );
            }
          }
        }
        children.push(new Paragraph({ text: "" })); // Add spacing after billing suggestion
      });
    }

    const doc = new Document({
      sections: [{ children }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${data.patientEncounterName}.docx`);
  } else {
    throw new Error("Unsupported export type");
  }
}

const PAGE_HEIGHT = 297; // A4 page height in mm for jsPDF
const MARGIN_BOTTOM = 20;

function checkAddPage(doc, y) {
  if (y > PAGE_HEIGHT - MARGIN_BOTTOM) {
    doc.addPage();
    return 20; // Reset y to top margin
  }
  return y;
}