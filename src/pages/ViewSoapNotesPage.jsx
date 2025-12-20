import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";
import * as format from "@/utils/format.js";
import Auth from "@/components/Auth.jsx";
import parseSoapNotes from "@/utils/parseSoapNotes";

export default function ViewSoapNotesPage() {
  const navigate = useNavigate();
  const [soapNotes, setSoapNotes] = useState([]);
  const [sortBy, setSortBy] = useState("created_at");

  useEffect(() => {
    const fetchSoapNotes = async () => {
      const jwt = api.getJWT();
      if (!jwt) {
        navigate("/login");
        return;
      }
      try {
        const data = await api.getAllSoapNotes();
        if (!data || Object.keys(data).length === 0) {
          navigate("/login");
          return;
        }
        const parsedSoapNotes = parseSoapNotes(data);
        setSoapNotes(parsedSoapNotes);
        console.log("Fetched SOAP notes:", parsedSoapNotes);
      } catch (error) {
        navigate("/login");
      }
    };
    fetchSoapNotes();
  }, [navigate]);

  const sortedSoapNotes = [...soapNotes].sort((a, b) => {
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

  const handleCardClick = (id) => {
    navigate(`/edit-soap-note?id=${id}`);
  };

  return (
    <>
      <Auth />
      <div className="max-w-8xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            View SOAP Notes ({soapNotes.length})
          </h1>
          <div className="flex items-center gap-2">
            <label
              htmlFor="sortBy"
              className="text-sm font-medium text-gray-700"
            >
              Sort By:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="created_at">Date Created</option>
              <option value="updated_at">Date Updated</option>
              <option value="A-Z">A-Z</option>
            </select>
          </div>
        </div>
        <div
          id="allSoapNotes"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "20px",
            width: "100%",
            margin: "0 auto",
          }}
          className="responsive-grid"
        >
          {sortedSoapNotes.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <div className="empty-icon">📋</div>
              <div className="empty-text">No SOAP notes found</div>
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
                onClick={() => handleCardClick(soapNote.id)}
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
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
