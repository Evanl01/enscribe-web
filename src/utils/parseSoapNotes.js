function parseSoapNotes(input) {
    // Helper to parse and clean a single note
    function parseSingleNote(note) {
        console.log("Parsing note:", note);
        if (typeof note?.soapNote_text === "string") {
            let cleaned = note.soapNote_text
                .replace(/^"+|"+$/g, "")
                .replace(/""/g, '"')
                .replace(/,(\s*[}\]])/g, "$1")
                .replace(/[\u0000-\u001F\u007F-\u009F\u00A0]/g, " ");
            try {
                note.soapNote_text = JSON.parse(cleaned);
            } catch (e) {
                console.error("Failed to parse soapNote_text:", e, cleaned);
                note.soapNote_text = {
                    error: "Invalid SOAP note format",
                    raw: cleaned,
                };
            }
        }
        return note;
    }

    if (Array.isArray(input)) {
        return input.map(parseSingleNote);
    } else if (input && typeof input === "object") {
        return parseSingleNote(input);
    } else {
        return input;
    }
}

export default parseSoapNotes;