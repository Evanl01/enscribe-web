import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HeaderReact from '@/components/HeaderReact'
import LoginPage from '@/pages/LoginPage'

export default function App() {
  return (
    <Router>
      <HeaderReact />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard (coming soon)</div>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}
