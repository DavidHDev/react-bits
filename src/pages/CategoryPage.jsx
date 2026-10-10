import { useEffect, useMemo, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { componentMap } from '../constants/Components';
import { decodeLabel } from '../utils/utils';
import { Box, Text } from '@chakra-ui/react';
import { useTransition } from '../hooks/useTransition';
import usePageSEO from '../hooks/usePageSEO';
import { PAGE_METADATA } from '../constants/pageMetadata';
import BackToTopButton from '../components/common/BackToTopButton';
import { SkeletonLoader, GetStartedLoader } from '../components/common/SkeletonLoader';
import IndexPage from './IndexPage';
import { DEFAULT_DESCRIPTION, INDEX_SEO, getComponentSEOByPath } from '../utils/seo';
import { DocsOverview } from '../components/common/DocsOverview';

const lazyComponentCache = new Map();

const getLazyComponent = (subcategory, componentFactory) => {
  if (!subcategory || !componentFactory) return null;
  if (!lazyComponentCache.has(subcategory)) {
    lazyComponentCache.set(subcategory, lazy(componentFactory));
  }
  return lazyComponentCache.get(subcategory);
};

const CategoryPage = () => {
  const { category, subcategory } = useParams();
  const { transitionPhase, getPreloadedComponent } = useTransition();

  const decodedLabel = decodeLabel(subcategory);
  const isLoading = transitionPhase === 'loading';
  const opacity = ['fade-out', 'loading'].includes(transitionPhase) ? 0 : 1;
  const isGetStartedRoute = category === 'get-started';
  const isIndexPage = subcategory === 'index';

  const componentFactory = subcategory && componentMap[subcategory];
  const SubcategoryComponent =
    getPreloadedComponent(subcategory)?.default || getLazyComponent(subcategory, componentFactory);
  const Loader = isGetStartedRoute ? GetStartedLoader : SkeletonLoader;

  useEffect(() => {
    if (transitionPhase !== 'fade-out') {
      try {
        window.scrollTo({ top: 0, behavior: 'auto' });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, [subcategory, transitionPhase]);

  const path = `/${category}/${subcategory}`;
  const componentSEO = useMemo(() => getComponentSEOByPath(path), [path]);
  usePageSEO(
    isIndexPage
      ? INDEX_SEO
      : (componentSEO ?? {
          title: decodedLabel ? `React Bits - ${decodedLabel}` : undefined,
          description: DEFAULT_DESCRIPTION,
          ...PAGE_METADATA[path],
          path
        })
  );

  return (
    <>
      {isIndexPage ? (
        <IndexPage />
      ) : (
        <Box className={`category-page category-${category} ${isLoading ? 'loading' : ''}`}>
          <Box className="page-transition-fade" style={{ opacity }}>
            {componentSEO ? (
              <DocsOverview seo={componentSEO} />
            ) : (
              !isGetStartedRoute && <h1 className="sub-category">{decodedLabel}</h1>
            )}

            {SubcategoryComponent ? (
              <Suspense fallback={<Loader />}>
                <SubcategoryComponent />
              </Suspense>
            ) : (
              <Box p={6}>
                <Text color="var(--text-primary)" fontWeight={600} fontSize="18px">
                  Not found
                </Text>
                <Text color="var(--text-muted)" fontSize="14px">
                  This section is unavailable.
                </Text>
              </Box>
            )}
          </Box>
          <BackToTopButton />
        </Box>
      )}
    </>
  );
};

export default CategoryPage;
