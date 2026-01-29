import { marked } from 'marked';
// Print a JSON object as indented plain text (for display, logging, or export)
export function printJsonObject(obj, level = 0) {
    const indent = (lvl) => ' '.repeat(lvl * 3);
    if (typeof obj === 'string' || typeof obj === 'number') {
        // Split by \n and add indent to each line
        return String(obj)
            .split('\n')
            .map(line => indent(level) + line)
            .join('\n');
    } else if (Array.isArray(obj)) {
        return obj.map(item => printJsonObject(item, level + 1)).join('\n');
    } else if (typeof obj === 'object' && obj !== null) {
        let result = '';
        for (const [key, value] of Object.entries(obj)) {
            result += indent(level) + key + ':\n';
            result += printJsonObject(value, level + 1) + '\n';
        }
        return result.trim();
    }
    return indent(level) + String(obj);
}

/**
 * Converts plain markdown text (with \n) to an array of docx Paragraphs for Word export.
 * Each line separated by \n becomes a new Paragraph.
 * @param {string} markdownText
 * @param {object} [options] - Optional: heading, color, spacing, etc.
 * @returns {Paragraph[]} Array of docx Paragraphs
 */
import { Paragraph, HeadingLevel } from "docx";

export function markdownTextToWord(markdownText, options = {}) {
    if (typeof markdownText !== "string") return [];

    const lines = markdownText.split("\n").map(line => line.trim()).filter(line => line.length > 0);

    return lines.map(line =>
        new Paragraph({
            text: line,
            heading: options.heading,
            color: options.color,
            spacing: options.spacing,
        })
    );
}
// Clean markdown for plain text display, removing all HTML/markdown and adding indentation for levels
export const cleanMarkdownText = (key, value, level = 0) => {
    // Helper for indentation
    const indent = (lvl) => ' '.repeat(lvl * 3);

    if (typeof value === 'string' || typeof value === 'number') {
        let str = String(value).trim();
        // Remove markdown markers
        str = str
            .replace(/\*{2,}/g, '') // Remove bold/italic markers
            .replace(/\*/g, '') // Remove list markers
            .replace(/`+/g, '') // Remove code markers
            .replace(/#+/g, '') // Remove heading markers
            .replace(/_/g, '') // Remove underscores
            .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Remove markdown links
            .replace(/\!\[(.*?)\]\((.*?)\)/g, '$1') // Remove images
            .replace(/<[^>]+>/g, '') // Remove any HTML tags
            .replace(/^-\s+/gm, '') // Remove dash list markers
            .replace(/\n{2,}/g, '\n'); // Collapse multiple newlines
        // Add indentation for each line
        return str.split('\n').map(line => indent(level) + line).join('\n');
    } else if (Array.isArray(value)) {
        return value.map(item => cleanMarkdownText('', item, level + 1)).join('\n');
    } else if (typeof value === 'object' && value !== null) {
        let result = '';
        for (const [k, v] of Object.entries(value)) {
            result += indent(level) + k + ':\n';
            result += cleanMarkdownText('', v, level + 1) + '\n';
        }
        return result.trim();
    }
    return String(value);
};
// lib/format.js - Formatting and utility functions
// Generate unique ID for transcripts/SOAP notes
export const generateId = (userId = 'default') => {
    const timestamp = Date.now();
    return `${timestamp}_${userId}`;
};

// Format timestamp for display
export const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Format display name for transcript (timestamp_chief complaint)
export const formatDisplayName = (timestamp, chiefComplaint = '') => {
    const dateStr = formatTimestamp(timestamp);
    return chiefComplaint ? `${dateStr}_${chiefComplaint}` : dateStr;
};

// Extract chief complaint from transcript text
export const extractChiefComplaint = (transcript) => {
    if (!transcript || typeof transcript !== 'string') {
        return 'No chief complaint';
    }

    // Simple extraction - look for common patterns
    const patterns = [
        /chief complaint[:\s]+(.+?)[\.\n]/i,
        /presenting with[:\s]+(.+?)[\.\n]/i,
        /complains? of[:\s]+(.+?)[\.\n]/i,
        /here for[:\s]+(.+?)[\.\n]/i
    ];

    for (const pattern of patterns) {
        const match = transcript.match(pattern);
        if (match) {
            return match[1].trim().substring(0, 50); // Limit to 50 chars
        }
    }

    // Fallback - use first sentence up to 50 chars
    const firstSentence = transcript.split('.')[0];
    return firstSentence ? firstSentence.substring(0, 50).trim() : 'No chief complaint';
};

// Format duration helper (moved from your component)
export const formatDuration = (seconds) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Extract filename from path (e.g., "/folder/file.webm" -> "file.webm")
export const extractRecordingFilenameFromPath = (path) => {
    return path?.split("/").pop() || "recording.webm";
};

// Format SOAP section as HTML with bold and bullet structure
export const formatMarkdownText = (key, value, level = 0, fontSize = null) => {
    // Helper to wrap text in larger font if requested
    const wrapLarge = (html, size) => {
        if (!size) return html;
        return `<span style="font-size:${size};font-weight:bold;">${html}</span>`;
    };

    // Helper for indentation
    const indent = (level) => '&nbsp;'.repeat(level * 3);

    if (typeof value === 'string' || typeof value === 'number') {
        const str = String(value).trim();
        // Clean up the malformed markdown first
        let cleaned = str
            // Fix the *** separators to proper newlines
            .replace(/\*{3,}/g, '\n* ')
            // Ensure proper spacing after list markers
            .replace(/^\*([^*\s])/gm, '* $1')
            // Clean up any malformed bold markers
            .replace(/\*\*([^*]+?)\*(?!\*)/g, '**$1**');

        // Use marked to parse the markdown
        try {
            let html = marked.parse(cleaned, {
                breaks: true,
                gfm: true
            });
            // Level-based formatting
            if (level === 0 && fontSize) {
                html = `<span style="font-weight:bold;text-decoration:underline;">${html}</span>`;

                html = wrapLarge(html, fontSize);
                // } else if (level === 1) {
                //     // Bold and underline for level 1
                //     html = `<span style="font-weight:bold;">${html}</span>`;
            } else if (level > 0) {
                // Indent lower levels
                html = `<div style="margin-left:${level * 3}ch;">${html}</div>`;
            }
            return html;
        } catch (error) {
            console.error('Markdown parsing error:', error);
            return str; // Fallback to original text
        }
    } else if (Array.isArray(value)) {
        let result = '<ul>';
        for (const item of value) {
            result += `<li>${formatMarkdownText('', item, level + 1, fontSize)}</li>`;
        }
        result += '</ul>';
        return result;
    } else if (typeof value === 'object' && value !== null) {
        let result = '';
        let idx = 0;
        for (const [k, v] of Object.entries(value)) {
            // Level-based formatting for keys
            let keyHtml = k;
            if (level === 0 && fontSize) {
                keyHtml = wrapLarge(keyHtml, fontSize);
            } else if (level === 1) {
                keyHtml = `<span style="text-decoration:underline;">${keyHtml}</span>`;
            } else if (level > 1) {
                keyHtml = `<span style="margin-left:${level * 3}ch;">${keyHtml}</span>`;
            }
            result += `${indent(level)}${keyHtml}:<br>`;
            result += formatMarkdownText('', v, level + 1, fontSize) + '<br>';
            idx++;
        }
        return result;
    }
    return String(value);
};