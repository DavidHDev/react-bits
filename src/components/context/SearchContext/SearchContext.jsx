/* eslint-disable react-refresh/only-export-components */
import { createContext, lazy, Suspense, useCallback, useEffect, useState } from 'react';

const SearchDialog = lazy(() => import('../../common/SearchDialog'));

export const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const toggleSearch = useCallback(() => setSearchOpen(prev => !prev), []);

  useEffect(() => {
    if (isSearchOpen) setMounted(true);
  }, [isSearchOpen]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === '/') {
        e.preventDefault();
        toggleSearch();
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSearch, closeSearch]);

  return (
    <SearchContext.Provider value={{ openSearch, closeSearch, toggleSearch, isSearchOpen }}>
      {children}
      {mounted && (
        <Suspense fallback={null}>
          <SearchDialog isOpen={isSearchOpen} onClose={closeSearch} />
        </Suspense>
      )}
    </SearchContext.Provider>
  );
}
