import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/lib/api";
import * as format from "@/utils/format.js";
import Auth from "@/components/Auth.jsx";

export default function DotPhrasesPage() {
  const navigate = useNavigate();
  const [dotPhrases, setDotPhrases] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editValues, setEditValues] = useState({ trigger: "", expansion: "" });
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [error, setError] = useState(null);

  const fetchDotPhrases = useCallback(async () => {
    const jwt = api.getJWT();
    if (!jwt) {
      navigate("/login");
      return;
    }
    try {
      setError(null);
      const data = await api.getAllDotPhrases();
      setDotPhrases(data);
    } catch (error) {
      // Only logout on 401 (authentication error)
      if (error.status === 401) {
        navigate("/login");
      } else {
        // Show user-friendly error for other failures (404, 500, etc)
        setError(`Failed to load dot phrases: ${error.message}`);
        setDotPhrases([]);
      }
    }
  }, [navigate]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDotPhrases().catch(console.error);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [fetchDotPhrases]);

  const handleEditClick = (dotPhrase) => {
    setSelectedRowId(dotPhrase.id);
    setEditValues({ trigger: dotPhrase.trigger, expansion: dotPhrase.expansion });
    setIsCreatingNew(false);
  };

  const handleDeleteClick = async (dotPhrase) => {
    if (confirm(`Are you sure you want to delete the dot phrase "${dotPhrase.trigger}"?`)) {
      try {
        await api.deleteDotPhrase(dotPhrase.id);
        window.location.reload();
      } catch (error) {
        if (error.status === 401) {
          navigate("/login");
        } else {
          setError(`Delete failed: ${error.message}`);
        }
      }
    }
  };

  const handleSave = async () => {
    try {
      if (isCreatingNew) {
        await api.createDotPhrase({ 
          trigger: editValues.trigger, 
          expansion: editValues.expansion 
        });
      } else {
        await api.updateDotPhrase(selectedRowId, { 
          trigger: editValues.trigger, 
          expansion: editValues.expansion 
        });
      }
      window.location.reload();
    } catch (error) {
      if (error.status === 401) {
        navigate("/login");
      } else {
        setError(`Save failed: ${error.message}`);
      }
    }
  };

  const handleCancel = () => {
    setSelectedRowId(null);
    setIsCreatingNew(false);
    setEditValues({ trigger: "", expansion: "" });
    setError(null);
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedRowId(null);
    setEditValues({ trigger: "", expansion: "" });
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <>
      <Auth />
      <div className="max-w-8xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Dot Phrases ({dotPhrases.length})
          </h1>
        </div>

        {/* Headers */}
        <div className="bg-gray-50 p-4 rounded-t-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="font-semibold text-gray-700">Dot Phrase</div>
            <div className="font-semibold text-gray-700">Full Text</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dot Phrases List */}
        <div className="bg-white border border-gray-200 rounded-b-lg">
          {dotPhrases.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {error ? "Unable to load dot phrases" : "No dot phrases found. Create your first one below!"}
            </div>
          ) : (
            dotPhrases.map((dotPhrase) => (
              <div key={dotPhrase.id}>
                {/* Normal Row */}
                {selectedRowId !== dotPhrase.id && (
                  <div
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 group cursor-pointer transition-colors"
                    data-dot-phrase-id={dotPhrase.id}
                  >
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <p className="text-gray-800">
                        {truncateText(dotPhrase.trigger)}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-800">
                          {truncateText(dotPhrase.expansion)}
                        </p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={() => handleEditClick(dotPhrase)}
                            className="w-8 h-8 bg-gray-300 hover:bg-gray-300 text-white rounded-lg flex items-center justify-center transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteClick(dotPhrase)}
                            className="w-8 h-8 bg-gray-300 hover:bg-gray-300 text-white rounded-lg flex items-center justify-center transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Row */}
                {selectedRowId === dotPhrase.id && (
                  <div className="p-4 border-b border-gray-100 bg-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={editValues.trigger}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              trigger: e.target.value.substring(0, 50),
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Dot phrase trigger"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <textarea
                          value={editValues.expansion}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              expansion: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Full text expansion"
                          rows="4"
                          style={{ whiteSpace: "pre-wrap" }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* New Dot Phrase Row */}
          {isCreatingNew && (
            <div className="p-4 border-b border-gray-100 bg-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    value={editValues.trigger}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        trigger: e.target.value.substring(0, 50),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Dot phrase trigger"
                    maxLength={50}
                  />
                </div>
                <div>
                  <textarea
                    value={editValues.expansion}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        expansion: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Full text expansion"
                    rows="4"
                    style={{ whiteSpace: "pre-wrap" }}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create New Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleCreateNew}
            disabled={isCreatingNew || selectedRowId !== null}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            Create New Dot Phrase
          </button>
        </div>
      </div>
    </>
  );
}
