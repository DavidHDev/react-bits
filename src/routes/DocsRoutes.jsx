import { Navigate, useLocation, useParams } from 'react-router-dom';
import SidebarLayout from '../components/layout/SidebarLayout';
import CategoryPage from '../pages/CategoryPage';
import CategoryIndexPage from '../pages/CategoryIndexPage';
import FavoritesPage from '../pages/FavoritesPage';
import NotFoundPage from '../pages/NotFoundPage';
import { CATEGORIES } from '../constants/Categories';
import { componentMap } from '../constants/Components';
import { toSlug } from '../utils/catalog';
import { findComponentBySlug } from '../utils/routeMatch';

const DOCS_CATEGORIES = new Set(CATEGORIES.map(category => toSlug(category.name)));

export const DocsRoute = ({ prefix = '' }) => {
  const { category, subcategory } = useParams();
  const { search, hash } = useLocation();
  const match = findComponentBySlug(subcategory);

  if (match && match.path !== `/${category}/${subcategory}`) {
    return <Navigate to={{ pathname: `${prefix}${match.path}`, search, hash }} replace />;
  }

  if (subcategory === 'index' && category !== 'get-started' && DOCS_CATEGORIES.has(category)) {
    return <Navigate to={{ pathname: `/c/${category}`, search, hash }} replace />;
  }

  if (!DOCS_CATEGORIES.has(category) || (subcategory !== 'index' && !componentMap[subcategory])) {
    return <NotFoundPage />;
  }

  return (
    <SidebarLayout>
      <CategoryPage />
    </SidebarLayout>
  );
};

export const CategoryIndexRoute = () => {
  const { category } = useParams();

  if (category === 'get-started' || !DOCS_CATEGORIES.has(category)) return <NotFoundPage />;

  return (
    <SidebarLayout>
      <CategoryIndexPage />
    </SidebarLayout>
  );
};

export const FavoritesRoute = () => (
  <SidebarLayout>
    <FavoritesPage />
  </SidebarLayout>
);
