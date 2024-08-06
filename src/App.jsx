import Sidebar from './components/Sidebar'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import CategoryPage from './pages/CategoryPage'

export default function App() {
  return (
    <Router>
      <div className='app-container'>
        <Sidebar />
        <Routes>
          <Route path="/" element={<Navigate to="/text-animations/split-text" />} />
          <Route path="/:category/:subcategory" element={<CategoryPage />} />
        </Routes>
      </div>
    </Router>
  )
}