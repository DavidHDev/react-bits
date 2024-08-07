import Sidebar from './components/Sidebar'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import CategoryPage from './pages/CategoryPage'
import LandingPage from './pages/LandingPage'
import Nav from './components/Nav';

export default function App() {
  return (
    <Router>
      <div className='app-container'>
        <Nav />
        <Routes>
          <Route exact path="/" element={<LandingPage />} />
          <Route path="/:category/:subcategory" element={
            <>
              <Sidebar />
              <CategoryPage />
            </>
          } />
        </Routes>
      </div>
    </Router>
  )
}