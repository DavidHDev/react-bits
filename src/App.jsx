import Sidebar from './components/Sidebar'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import CategoryPage from './pages/CategoryPage'

export default function App() {
  return (
    <Router>
      <div className='app-container'>
        <Sidebar />
        <Routes>
          <Route path="/:category/:subcategory" element={<CategoryPage />} />
        </Routes>
      </div>
    </Router>
  )
}