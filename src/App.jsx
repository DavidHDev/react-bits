import { lazy, Suspense } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation, useParams } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import Providers from './components/layout/Providers';
import { ActiveRouteProvider } from './components/context/ActiveRouteContext/ActiveRouteContext';

import SidebarLayout from './components/layout/SidebarLayout';
import LandingPage from './pages/LandingPage';
import CategoryPage from './pages/CategoryPage';
import CategoryIndexPage from './pages/CategoryIndexPage';
import ShowcasePage from './pages/ShowcasePage';
import FavoritesPage from './pages/FavoritesPage';
import SponsorsPage from './pages/SponsorsPage';
import ToolsPage from './pages/ToolsPage';
import ProPage from './pages/ProPage';
import ProSectionPage from './pages/ProSectionPage';
import AnnouncementModal from './components/common/AnnouncementModal/AnnouncementModal';
import { CATEGORIES } from './constants/Categories';
import { componentMap } from './constants/Components';
import { toSlug } from './utils/catalog';
import { findComponentBySlug } from './utils/routeMatch';

const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const DOCS_CATEGORIES = new Set(CATEGORIES.map(category => toSlug(category.name)));

const NotFound = () => (
  <Suspense fallback={null}>
    <NotFoundPage />
  </Suspense>
);

const DocsRoute = ({ prefix = '' }) => {
  const { category, subcategory } = useParams();
  const { search, hash } = useLocation();
  const match = findComponentBySlug(subcategory);

  if (match && match.path !== `/${category}/${subcategory}`) {
    return <Navigate to={{ pathname: `${prefix}${match.path}`, search, hash }} replace />;
  }

  if (!DOCS_CATEGORIES.has(category) || (subcategory !== 'index' && !componentMap[subcategory])) {
    return <NotFound />;
  }

  return (
    <SidebarLayout>
      <CategoryPage />
    </SidebarLayout>
  );
};

const CategoryIndexRoute = () => {
  const { category } = useParams();

  if (category === 'get-started' || !DOCS_CATEGORIES.has(category)) return <NotFound />;

  return (
    <SidebarLayout>
      <CategoryIndexPage />
    </SidebarLayout>
  );
};

function AppContent() {
  return (
    <>
      <Providers>
        <Routes>
          <Route exact path="/" element={<LandingPage />} />
          <Route exact path="/showcase" element={<ShowcasePage />} />
          <Route exact path="/sponsors" element={<SponsorsPage />} />
          <Route exact path="/changelog" element={<Navigate to="/get-started/changelog" replace />} />
          <Route path="/tools/:toolId?" element={<ToolsPage />} />
          <Route exact path="/pro" element={<ProPage />} />
          <Route
            path="/pro/:section"
            element={
              <SidebarLayout>
                <ProSectionPage />
              </SidebarLayout>
            }
          />
          <Route path="/c/:category" element={<CategoryIndexRoute />} />
          <Route path="/c/:category/:subcategory" element={<DocsRoute prefix="/c" />} />
          <Route path="/:category/:subcategory" element={<DocsRoute />} />

          <Route
            path="/favorites"
            element={
              <SidebarLayout>
                <FavoritesPage />
              </SidebarLayout>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <AnnouncementModal />
      </Providers>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <NuqsAdapter>
        <ActiveRouteProvider>
          <AppContent />
        </ActiveRouteProvider>
      </NuqsAdapter>
    </Router>
  );
}
