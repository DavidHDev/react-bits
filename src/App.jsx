import Sidebar from './components/navs/Sidebar'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import CategoryPage from './pages/CategoryPage'
import LandingPage from './pages/LandingPage'
import Nav from './components/navs/Nav';

export default function App() {
  return (
    <Router>
      <Nav />
      <Routes>
        <Route exact path="/" element={<LandingPage />} />
        <Route path="/:category/:subcategory" element={
          <div className='app-container'>
            <Sidebar />
            <CategoryPage />
          </div>
        } />
      </Routes>
    </Router>
  )
}