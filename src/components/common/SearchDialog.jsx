import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { FiSearch, FiLayers, FiImage, FiType, FiCircle, FiFile, FiArrowUpRight, FiToggleRight } from 'react-icons/fi';
import { AiOutlineEnter } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../constants/Categories';
import { componentMetadata } from '../../constants/Information';
import { getComponentMatchLabel, rankComponentSearch } from '../../utils/componentSearch';
import { searchPro } from '../../utils/proSearch';
import { proUrl, trackProClick } from '../../utils/pro';
import { useProManifest } from '../../hooks/useProManifest';
import { useSearch } from '../context/SearchContext/useSearch';
import './SearchDialog.css';

const PRO_PLACEMENT = 'search';
const FREE_ONLY_KEY = 'reactbits:search-free-only';

/** Persisted so someone who opts out of Pro results only has to say so once. */
const readFreeOnly = () => {
  try {
    return window.localStorage.getItem(FREE_ONLY_KEY) === 'true';
  } catch {
    return false;
  }
};

const metadataByPath = new Map(
  Object.values(componentMetadata).map(metadata => [new URL(metadata.docsUrl).pathname, metadata])
);

const slug = value => value.replace(/\s+/g, '-').toLowerCase();

function searchComponents(query) {
  if (!query || query.trim() === '') return [];
  const results = [];
  CATEGORIES.forEach(category => {
    const { name: categoryName, subcategories } = category;
    if (categoryName === 'Get Started') return;

    subcategories.forEach(componentName => {
      const path = `/${slug(categoryName)}/${slug(componentName)}`;
      const metadata = metadataByPath.get(path);
      const match = rankComponentSearch(
        {
          title: componentName,
          categoryLabel: categoryName,
          description: metadata?.description,
          tags: metadata?.tags
        },
        query
      );

      if (match) {
        results.push({
          categoryName,
          componentName,
          matchLabel: getComponentMatchLabel(categoryName, match.type),
          score: match.score
        });
      }
    });
  });
  return results.sort((a, b) => b.score - a.score || a.componentName.localeCompare(b.componentName)).slice(0, 8);
}

const Result = ({ children, dataIndex, onMouseEnter, onClick }) => (
  <div data-index={dataIndex} onMouseEnter={onMouseEnter} onClick={onClick} style={{ cursor: 'pointer' }}>
    {children}
  </div>
);

const categoryIconMapping = {
  'Get Started': FiFile,
  'Text Animations': FiType,
  Animations: FiCircle,
  Components: FiLayers,
  Micro: FiToggleRight,
  Backgrounds: FiImage
};

const SearchDialog = ({ isOpen, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [freeOnly, setFreeOnly] = useState(readFreeOnly);
  const resultsRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { toggleSearch } = useSearch();

  // Only fetched once the dialog has been opened, and cached from then on.
  const { manifest } = useProManifest({ enabled: isOpen && !freeOnly });

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchValue(inputValue);
      setSelectedIndex(-1);
    }, 180);
    return () => clearTimeout(t);
  }, [inputValue]);

  const freeResults = useMemo(() => searchComponents(searchValue), [searchValue]);

  const proResults = useMemo(
    () => (freeOnly ? [] : searchPro(manifest, searchValue)),
    [freeOnly, manifest, searchValue]
  );

  // One flat list so arrow keys and Enter run across both groups.
  const results = useMemo(
    () => [...freeResults.map(item => ({ kind: 'free', item })), ...proResults.map(item => ({ kind: 'pro', item }))],
    [freeResults, proResults]
  );

  const toggleFreeOnly = () => {
    setFreeOnly(prev => {
      const next = !prev;
      try {
        window.localStorage.setItem(FREE_ONLY_KEY, String(next));
      } catch {
        /* storage unavailable, the preference just won't persist */
      }
      return next;
    });
    setSelectedIndex(-1);
  };

  const handleScroll = e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDist = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDist / 50, 1));
  };

  useEffect(() => {
    if (!resultsRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = resultsRef.current;
    setBottomGradientOpacity(
      scrollHeight <= clientHeight ? 0 : Math.min((scrollHeight - (scrollTop + clientHeight)) / 50, 1)
    );
  }, [results]);

  const handleSelect = useCallback(
    result => {
      if (!result) return;

      if (result.kind === 'pro') {
        const { item } = result;
        trackProClick(PRO_PLACEMENT, { section: item.section, item: item.name });
        window.open(proUrl(item.href, PRO_PLACEMENT), '_blank', 'noopener,noreferrer');
      } else {
        const slug = str => str.replace(/\s+/g, '-').toLowerCase();
        navigate(`/${slug(result.item.categoryName)}/${slug(result.item.componentName)}`);
      }

      setInputValue('');
      setSearchValue('');
      setSelectedIndex(-1);
      onClose();
    },
    [navigate, onClose]
  );

  useEffect(() => {
    const onKey = e => {
      if (!searchValue) return;
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(p => Math.min(p + 1, results.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(p => Math.max(p - 1, 0));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [results, searchValue, selectedIndex, handleSelect]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !resultsRef.current) return;
    const container = resultsRef.current;
    const item = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (!item) return;

    const margin = 50;
    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    if (itemTop < container.scrollTop + margin) {
      container.scrollTo({ top: itemTop - margin, behavior: 'smooth' });
    } else if (itemBottom > container.scrollTop + container.clientHeight - margin) {
      container.scrollTo({
        top: itemBottom - container.clientHeight + margin,
        behavior: 'smooth'
      });
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === '/') {
        e.preventDefault();
        toggleSearch();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSearch, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setInputValue('');
      setSearchValue('');
      setSelectedIndex(-1);
      setTopGradientOpacity(0);
      setBottomGradientOpacity(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="search-backdrop" onClick={onClose}>
      <div className="search-dialog" onClick={e => e.stopPropagation()}>
        <div className="search-input-row">
          <FiSearch className="search-input-icon" size={16} />
          <input
            ref={inputRef}
            className="search-input"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Search components, categories, or keywords..."
          />
          <kbd className="search-kbd" onClick={onClose}>
            esc
          </kbd>
        </div>

        {searchValue && (
          <div className="search-results-wrapper">
            <div ref={resultsRef} className="search-results" onScroll={handleScroll}>
              {results.length > 0 ? (
                <>
                  {freeResults.map((r, i) => {
                    const IconComp = categoryIconMapping[r.categoryName] || FiSearch;
                    return (
                      <Result
                        key={`free-${r.categoryName}-${r.componentName}-${i}`}
                        dataIndex={i}
                        onMouseEnter={() => setSelectedIndex(i)}
                        onClick={() => handleSelect(results[i])}
                      >
                        <div className={`search-result-item${i === selectedIndex ? ' selected' : ''}`}>
                          <div className="search-result-icon">
                            <IconComp size={20} />
                          </div>
                          <div className="search-result-text">
                            <span className="search-result-name">{r.componentName}</span>
                            <span className="search-result-category">{r.matchLabel}</span>
                          </div>
                          <div className="search-result-enter">
                            <AiOutlineEnter size={16} />
                          </div>
                        </div>
                      </Result>
                    );
                  })}

                  {proResults.length > 0 && (
                    <div className="search-group-label">
                      React Bits Pro
                      <span>opens pro.reactbits.dev</span>
                    </div>
                  )}

                  {proResults.map((r, i) => {
                    const index = freeResults.length + i;
                    return (
                      <Result
                        key={r.id}
                        dataIndex={index}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => handleSelect(results[index])}
                      >
                        <div className={`search-result-item is-pro${index === selectedIndex ? ' selected' : ''}`}>
                          <div className="search-result-icon">
                            <FiLayers size={20} />
                          </div>
                          <div className="search-result-text">
                            <span className="search-result-name">
                              {r.name}
                              {r.isFree && <span className="search-result-free">Free</span>}
                            </span>
                            <span className="search-result-category">{r.context}</span>
                          </div>
                          <div className="search-result-enter">
                            <FiArrowUpRight size={16} />
                          </div>
                        </div>
                      </Result>
                    );
                  })}
                </>
              ) : (
                <p className="search-no-results">
                  No results found for <strong>{searchValue}</strong>
                </p>
              )}
            </div>

            <div className="search-gradient search-gradient-top" style={{ opacity: topGradientOpacity }} />
            <div className="search-gradient search-gradient-bottom" style={{ opacity: bottomGradientOpacity }} />
          </div>
        )}

        <div className="search-footer">
          <label className="search-toggle">
            <input type="checkbox" checked={freeOnly} onChange={toggleFreeOnly} />
            <span className="search-toggle-box" aria-hidden="true" />
            Free only
          </label>
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
