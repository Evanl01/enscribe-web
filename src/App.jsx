import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from '@/components/Header'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import ConfirmEmailPage from '@/pages/ConfirmEmailPage'
import DashboardPage from '@/pages/DashboardPage'
import NewPatientEncounterPage from '@/pages/NewPatientEncounterPage'
import ViewPatientEncountersPage from '@/pages/ViewPatientEncountersPage'
import EditPatientEncounterPage from '@/pages/EditPatientEncounterPage'
import ViewRecordingsPage from '@/pages/ViewRecordingsPage'
import ViewSoapNotesPage from '@/pages/ViewSoapNotesPage'
import EditSoapNotePage from '@/pages/EditSoapNotePage'
import DotPhrasesPage from '@/pages/DotPhrasesPage'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/new-patient-encounter" element={<NewPatientEncounterPage />} />
        <Route path="/view-patient-encounters" element={<ViewPatientEncountersPage />} />
        <Route path="/edit-patient-encounter/:id" element={<EditPatientEncounterPage />} />
        <Route path="/view-recordings" element={<ViewRecordingsPage />} />
        <Route path="/view-soap-notes" element={<ViewSoapNotesPage />} />
        <Route path="/edit-soap-note/:id" element={<EditSoapNotePage />} />
        <Route path="/dot-phrases" element={<DotPhrasesPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  )
}
