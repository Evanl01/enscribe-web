"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/public/scripts/api.js";
import * as format from "@/public/scripts/format.js";
import Auth from "@/src/components/Auth.jsx";

export default function ViewPatientEncounters() {
  const router = useRouter();
  const [patientEncounters, setPatientEncounters] = useState([]);
  const [sortBy, setSortBy] = useState("created_at");

  useEffect(() => {
    const fetchEncounters = async () => {
      const jwt = api.getJWT();
      if (!jwt) {
        router.push("/login");
        return;
      }
      try {
        const data = await api.getAllPatientEncounters();
        setPatientEncounters(Object.values(data));
      } catch (error) {
        router.push("/login");
      }
    };
    fetchEncounters();
  }, [router]);

  const sortedEncounters = [...patientEncounters].sort((a, b) => {
    if (sortBy === "created_at") {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    if (sortBy === "updated_at") {
      return new Date(b.updated_at) - new Date(a.updated_at);
    }
    if (sortBy === "A-Z") {
      return (a.name || "").localeCompare(b.name || "");
    }
    return 0;
  });

  const handleCardClick = (id) => {
    router.push(`/edit-patient-encounter?id=${id}`);
  };

  return (
    <>
      <Auth />
      <div className="max-w-8xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            View Patient Encounters ({patientEncounters.length})
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
          id="allPatientEncounters"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "20px",
            width: "100%",
            margin: "0 auto",
          }}
          className="responsive-grid"
        >
          {sortedEncounters.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <div className="empty-icon">🏥</div>
              <div className="empty-text">No patient encounters found</div>
            </div>
          ) : (
            sortedEncounters.map((encounter) => (
              <div
                className="encounter-card"
                data-encounter-id={encounter.id}
                key={encounter.id}
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
                onClick={() => handleCardClick(encounter.id)}
              >
                <div
                  className="recent-icon"
                  style={{ fontSize: "2rem", marginBottom: "8px" }}
                >
                  🏥
                </div>
                <div
                  className="recent-title"
                  style={{ fontWeight: "bold", marginBottom: "6px" }}
                >
                  {encounter.name || ""}
                </div>
                <div
                  className="recent-preview"
                  style={{
                    color: "#555",
                    marginBottom: "12px",
                    fontSize: "0.95em",
                  }}
                >
                  {format.formatTimestamp(encounter.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
