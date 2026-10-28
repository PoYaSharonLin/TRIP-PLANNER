import { Navigate, Route, Routes } from 'react-router-dom'
import { TripPage } from './ui/TripPage'

export function App() {
  return (
    <Routes>
      {/* 單人使用：直接進入範例行程，不經過首頁 */}
      <Route path="/" element={<Navigate to="/t/demo" replace />} />
      <Route path="/t/:tripId" element={<TripPage />} />
      <Route path="*" element={<Navigate to="/t/demo" replace />} />
    </Routes>
  )
}
