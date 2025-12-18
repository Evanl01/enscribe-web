import React, { useEffect, useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as api from '@/lib/api'
import * as format from '@/scripts/format.js'
import parseSoapNotes from '@/utils/parseSoapNotes'

const DashboardPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [soapNotes, setSoapNotes] = useState({})
  const [soapNotesCount, setSoapNotesCount] = useState(0)
  const [patientEncounters, setPatientEncounters] = useState({})
  const [patientEncountersCount, setPatientEncountersCount] = useState(0)
  const [recentSoapNotes, setRecentSoapNotes] = useState([])
  const [recentPatientEncounters, setRecentPatientEncounters] = useState([])
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboardActiveTab') || 'encounters'
    }
    return 'encounters'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const tabMenu = [
    { key: 'encounters', label: 'Patient Encounters', icon: '🏥' },
    { key: 'soap', label: 'SOAP Notes', icon: '📋' },
  ]

  // Load patient encounters
  const loadPatientEncounters = useCallback(async () => {
    try {
      const data = await api.getAllPatientEncounters()
      setPatientEncounters(data)
      setPatientEncountersCount(Object.keys(data).length)
      const recent = Object.values(data).slice(0, 5)
      setRecentPatientEncounters(recent)
      return data
    } catch (error) {
      console.error('Error loading patient encounters:', error)
      if (error.message?.includes('401') || error.message?.includes('not logged in')) {
        navigate('/login')
      } else {
        setError('Error loading patient encounters: ' + (error.message || error))
      }
    }
  }, [navigate])

  // Load SOAP notes
  const loadSoapNotes = useCallback(async () => {
    const jwt = api.getJWT()
    if (!jwt) {
      navigate('/login')
      return
    }

    try {
      const data = await api.getAllSoapNotes()
      const parsedSoapNotes = parseSoapNotes(data)
      setSoapNotes(parsedSoapNotes)
      setSoapNotesCount(Object.keys(parsedSoapNotes).length)
      const recent = Object.values(parsedSoapNotes).slice(0, 5)
      setRecentSoapNotes(recent)
      return data
    } catch (error) {
      console.error('Error loading SOAP notes:', error)
      if (error.message?.includes('401') || error.message?.includes('not logged in')) {
        navigate('/login')
      } else {
        setError('Error loading SOAP notes: ' + (error.message || error))
      }
    }
  }, [navigate])

  // Load all data on mount
  useEffect(() => {
    const jwt = api.getJWT()
    if (!jwt) {
      navigate('/login')
      return
    }

    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadSoapNotes(), loadPatientEncounters()])
      setLoading(false)
    }

    loadData()
  }, [loadSoapNotes, loadPatientEncounters, navigate])

  // Tab switching
  const switchTab = (tabName) => {
    setActiveTab(tabName)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardActiveTab', tabName)
    }
  }

  // Navigation handlers
  const editSoapNote = (id) => {
    navigate(`/edit-soap-note?id=${id}`)
  }

  const editPatientEncounter = (id) => {
    navigate(`/edit-patient-encounter?id=${id}`)
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container" style={{ padding: '20px', width: '100%' }}>
      {error && (
        <div style={{ color: '#d32f2f', marginBottom: '20px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Dashboard</h1>
        <button
          onClick={() => navigate('/new-patient-encounter')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
          }}
        >
          + New Patient Encounter
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e0e0e0',
          marginBottom: '30px',
          backgroundColor: '#f8f9fa',
        }}
      >
        {tabMenu.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              backgroundColor: activeTab === tab.key ? '#007bff' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#495057',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === tab.key ? '600' : '500',
              borderBottom: activeTab === tab.key ? '3px solid #0056b3' : '3px solid transparent',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                e.target.style.backgroundColor = '#e9ecef'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                e.target.style.backgroundColor = 'transparent'
              }
            }}
          >
            {tab.icon} {tab.label} ({tab.key === 'encounters' ? patientEncountersCount : soapNotesCount})
          </button>
        ))}
      </div>

      {/* Patient Encounters Tab */}
      {activeTab === 'encounters' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', fontWeight: '600' }}>Recent Patient Encounters</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
              width: '100%',
            }}
          >
            {recentPatientEncounters.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '40px 20px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏥</div>
                <div style={{ color: '#666', fontSize: '1.1rem' }}>No patient encounters yet</div>
              </div>
            ) : (
              recentPatientEncounters.map((encounter) => (
                <div
                  key={encounter.id}
                  onClick={() => editPatientEncounter(encounter.id)}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.16)'
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏥</div>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '1.05rem' }}>
                    {encounter.name || 'Unnamed Encounter'}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    {format.formatTimestamp(encounter.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SOAP Notes Tab */}
      {activeTab === 'soap' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', fontWeight: '600' }}>Recent SOAP Notes</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
              width: '100%',
            }}
          >
            {recentSoapNotes.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '40px 20px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📋</div>
                <div style={{ color: '#666', fontSize: '1.1rem' }}>No SOAP notes yet</div>
              </div>
            ) : (
              recentSoapNotes.map((soapNote) => (
                <div
                  key={soapNote.id}
                  onClick={() => editSoapNote(soapNote.id)}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.16)'
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '1.05rem' }}>
                    SOAP Note
                  </div>
                  <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '12px' }}>
                    {format.formatTimestamp(soapNote.created_at)}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    {soapNote.soapNote_text?.soapNote?.subjective
                      ? soapNote.soapNote_text.soapNote.subjective.substring(0, 150) + '...'
                      : 'No content'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
