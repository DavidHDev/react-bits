import { useEffect, useMemo, useState } from 'react';
import { Box } from '@chakra-ui/react';
import BackToTopButton from '../components/common/BackToTopButton';
import { getSavedComponents } from '../utils/favorites';
import { componentMetadata } from '../constants/Information';
import ComponentList from '../components/common/ComponentList';
import usePageSEO from '../hooks/usePageSEO';
import { PAGE_METADATA } from '../constants/pageMetadata';

const FavoritesPage = () => {
  usePageSEO({ ...PAGE_METADATA['/favorites'], path: '/favorites' });
  const [savedKeys, setSavedKeys] = useState(() => getSavedComponents());

  useEffect(() => {
    const update = () => setSavedKeys(getSavedComponents());
    const onStorage = e => {
      if (!e || e.key === 'savedComponents') update();
    };
    window.addEventListener('favorites:updated', update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('favorites:updated', update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const savedList = useMemo(() => {
    const entries = (savedKeys || [])
      .filter(k => typeof k === 'string' && k.includes('/') && componentMetadata?.[k])
      .map(k => [k, componentMetadata[k]]);
    return Object.fromEntries(entries);
  }, [savedKeys]);

  return (
    <Box>
      <ComponentList title="Favorites" list={savedList} hasDeleteButton sorting="none" />
      <BackToTopButton />
    </Box>
  );
};

export default FavoritesPage;
