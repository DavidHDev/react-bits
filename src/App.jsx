import { lazy, Suspense } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation, useParams } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import Providers from './components/layout/Providers';
import { ActiveRouteProvider } from './components/context/ActiveRouteContext/ActiveRouteContext';
import LandingPage from './pages/LandingPage';
import { TOOLS } from './constants/Tools';
import usePrefetchOnIntent from './hooks/usePrefetchOnIntent';

const loadDocs = () => import('./routes/DocsRoutes');
const loadShowcase = () => import('./pages/ShowcasePage');
const loadSponsors = () => import('./pages/SponsorsPage');
const loadTools = () => import('./pages/ToolsPage');
const loadPro = () => import('./pages/ProPage');
const loadChakra = () => import('./components/setup/ChakraScope');

const DocsRoute = lazy(() => loadDocs().then(module => ({ default: module.DocsRoute })));
const CategoryIndexRoute = lazy(() => loadDocs().then(module => ({ default: module.CategoryIndexRoute })));
const FavoritesRoute = lazy(() => loadDocs().then(module => ({ default: module.FavoritesRoute })));
const ShowcasePage = lazy(loadShowcase);
const SponsorsPage = lazy(loadSponsors);
const ToolsPage = lazy(loadTools);
const ProPage = lazy(loadPro);
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AnnouncementModal = lazy(() => import('./components/common/AnnouncementModal/AnnouncementModal'));
const ChakraScope = lazy(loadChakra);

const withChakra = load => () => Promise.all([load(), loadChakra()]);

const PREFETCH_RULES = [
  { test: path => path === '/pro', load: withChakra(loadPro) },
  { test: path => path.startsWith('/tools'), load: withChakra(loadTools) },
  { test: path => path === '/showcase', load: withChakra(loadShowcase) },
  { test: path => path === '/sponsors', load: withChakra(loadSponsors) },
  { test: path => path !== '/', load: withChakra(loadDocs) }
];

const ToolsRoute = () => {
  const { toolId } = useParams();
  return !toolId || TOOLS.some(tool => tool.id === toolId) ? <ToolsPage /> : <NotFoundPage />;
};

function AppContent() {
  usePrefetchOnIntent(PREFETCH_RULES);
  const { pathname } = useLocation();
  const landing = pathname === '/';
  const routes = (
    <Routes>
      <Route exact path="/" element={<LandingPage />} />
      <Route exact path="/showcase" element={<ShowcasePage />} />
      <Route exact path="/sponsors" element={<SponsorsPage />} />
      <Route exact path="/changelog" element={<Navigate to="/get-started/changelog" replace />} />
      <Route path="/tools/:toolId?" element={<ToolsRoute />} />
      <Route exact path="/pro" element={<ProPage />} />
      <Route path="/c/:category" element={<CategoryIndexRoute />} />
      <Route path="/c/:category/:subcategory" element={<DocsRoute prefix="/c" />} />
      <Route path="/:category/:subcategory" element={<DocsRoute />} />
      <Route path="/favorites" element={<FavoritesRoute />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );

  return (
    <>
      <Providers>
        <Suspense fallback={null}>{landing ? routes : <ChakraScope>{routes}</ChakraScope>}</Suspense>
        <Suspense fallback={null}>
          <AnnouncementModal />
        </Suspense>
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
