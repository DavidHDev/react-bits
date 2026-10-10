import { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowTurnBackwardIcon,
  ArrowUpRight01Icon,
  File01Icon,
  Image01Icon,
  Layers01Icon,
  Motion01Icon,
  MousePointerClickIcon,
  PuzzleIcon,
  Search01Icon,
  TextFontIcon
} from '@hugeicons/core-free-icons';
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

const categoryIconMapping = {
  'Get Started': File01Icon,
  'Text Animations': TextFontIcon,
  Animations: Motion01Icon,
  Components: PuzzleIcon,
  Micro: MousePointerClickIcon,
  Backgrounds: Image01Icon
};

const Glyph = ({ icon, size = 16 }) => <HugeiconsIcon icon={icon} size={size} strokeWidth={1.6} aria-hidden="true" />;

const ResultRow = ({ index, selected, icon, title, badge, meta, trail, onHover, onSelect }) => (
  <div
    className="search-row"
    data-index={index}
    data-selected={selected ? '' : undefined}
    role="option"
    aria-selected={selected}
    onMouseMove={onHover}
    onClick={onSelect}
  >
    <span className="search-row-icon">
      <Glyph icon={icon} />
    </span>
    <span className="search-row-text">
      <span className="search-row-title">
        {title}
        {badge && <span className="search-row-badge">{badge}</span>}
      </span>
      <span className="search-row-meta">{meta}</span>
    </span>
    <span className="search-row-trail">
      <Glyph icon={trail} />
    </span>
  </div>
);

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
  const [highlight, setHighlight] = useState(null);
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

  useLayoutEffect(() => {
    const row = selectedIndex >= 0 ? resultsRef.current?.querySelector(`[data-index="${selectedIndex}"]`) : null;
    setHighlight(previous => {
      if (!row) return previous ? { ...previous, visible: false } : null;
      return { y: row.offsetTop, height: row.offsetHeight, visible: true, ready: Boolean(previous) };
    });
  }, [selectedIndex, results]);

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
      <div className="search-dialog" role="dialog" aria-label="Search" onClick={e => e.stopPropagation()}>
        <div className="search-input-row">
          <span className="search-input-icon">
            <Glyph icon={Search01Icon} size={18} />
          </span>
          <input
            ref={inputRef}
            className="search-input"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Search components, categories, or keywords..."
            aria-label="Search"
          />
          <kbd className="search-kbd" onClick={onClose}>
            esc
          </kbd>
        </div>

        {searchValue && (
          <div className="search-results-wrapper">
            <div ref={resultsRef} className="search-results" role="listbox" onScroll={handleScroll}>
              {results.length > 0 ? (
                <>
                  <span
                    className="search-highlight"
                    aria-hidden="true"
                    data-ready={highlight?.ready ? '' : undefined}
                    style={
                      highlight
                        ? {
                            height: highlight.height,
                            transform: `translateY(${highlight.y}px)`,
                            opacity: highlight.visible ? 1 : 0
                          }
                        : { opacity: 0 }
                    }
                  />

                  {freeResults.length > 0 && <div className="search-group-label">React Bits</div>}

                  {freeResults.map((r, i) => (
                    <ResultRow
                      key={`free-${r.categoryName}-${r.componentName}-${i}`}
                      index={i}
                      selected={i === selectedIndex}
                      icon={categoryIconMapping[r.categoryName] || Search01Icon}
                      title={r.componentName}
                      meta={r.matchLabel}
                      trail={ArrowTurnBackwardIcon}
                      onHover={() => i !== selectedIndex && setSelectedIndex(i)}
                      onSelect={() => handleSelect(results[i])}
                    />
                  ))}

                  {proResults.length > 0 && (
                    <div className="search-group-label">
                      React Bits Pro
                      <span>opens pro.reactbits.dev</span>
                    </div>
                  )}

                  {proResults.map((r, i) => {
                    const index = freeResults.length + i;
                    return (
                      <ResultRow
                        key={r.id}
                        index={index}
                        selected={index === selectedIndex}
                        icon={Layers01Icon}
                        title={r.name}
                        badge={r.isFree ? 'Free' : null}
                        meta={r.context}
                        trail={ArrowUpRight01Icon}
                        onHover={() => index !== selectedIndex && setSelectedIndex(index)}
                        onSelect={() => handleSelect(results[index])}
                      />
                    );
                  })}
                </>
              ) : (
                <p className="search-no-results">
                  No results for <strong>{searchValue}</strong>
                </p>
              )}
            </div>

            <div className="search-gradient search-gradient-top" style={{ opacity: topGradientOpacity }} />
            <div className="search-gradient search-gradient-bottom" style={{ opacity: bottomGradientOpacity }} />
          </div>
        )}

        <div className="search-footer">
          <div className="search-hints" aria-hidden="true">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              Navigate
            </span>
            <span>
              <kbd>↵</kbd>
              Open
            </span>
          </div>
          <label className="search-toggle">
            Free only
            <input type="checkbox" role="switch" checked={freeOnly} onChange={toggleFreeOnly} />
            <span className="search-switch" aria-hidden="true" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
