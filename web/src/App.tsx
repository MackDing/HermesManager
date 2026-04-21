import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { SkillsPage } from './pages/SkillsPage'
import { EventsPage } from './pages/EventsPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="events" element={<EventsPage />} />
      </Route>
    </Routes>
  )
}

export default App
