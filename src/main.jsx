import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LoginPage from './App.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MeetingRoom from './pages/views/MeetingRoom.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
