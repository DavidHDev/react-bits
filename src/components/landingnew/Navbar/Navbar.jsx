import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../../common/SVGComponents';
import { useStars } from '../../../hooks/useStars';
import { GITHUB_URL } from '../../../constants/Site';
import { proLinkProps } from '../../../utils/pro';
import useProImpression from '../../../hooks/useProImpression';
import { FaGithub } from 'react-icons/fa6';
import { LuLayoutGrid, LuSearch, LuSettings2, LuSun, LuMoon } from 'react-icons/lu';
import { useColorMode } from '../../setup/color-mode';
import { useSearch } from '../../context/SearchContext/useSearch';
import { useOptions } from '../../context/OptionsContext/useOptions';
import { CATEGORIES, TOTAL_COMPONENTS } from '../../../constants/Categories';
import { PRO_SECTIONS } from '../../../constants/Pro';
import { TOOLS } from '../../../constants/Tools';
import jsIcon from '../../../assets/icons/js.svg';
import tsIcon from '../../../assets/icons/ts.svg';
import cssIcon from '../../../assets/icons/css.svg';
import twIcon from '../../../assets/icons/tw.svg';
import './Navbar.css';

const slugify = value => value.replace(/\s+/g, '-').toLowerCase();
const DOCS_MATCHES = CATEGORIES.map(category => `/${slugify(category.name)}`);

const NAV_LINKS = [
  { label: 'Docs', to: '/get-started/introduction', match: DOCS_MATCHES },
  { label: 'Tools', to: '/tools', match: '/tools' },
  { label: 'Pro', to: '/pro', match: '/pro' },
  { label: 'Sponsors', to: '/sponsors', match: '/sponsors' }
];

const Navbar = ({ showDocs }) => {
  const stars = useStars();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [mobileFilter, setMobileFilter] = useState('');
  const linksRef = useRef(null);
  const highlightRef = useRef(null);
  const prefsTimeoutRef = useRef(null);

  const { toggleSearch } = useSearch();
  const { languagePreset, setLanguagePreset, stylePreset, setStylePreset } = useOptions();
  const { resolvedTheme, toggleColorMode } = useColorMode();
  const isLightTheme = resolvedTheme === 'light';
  const location = useLocation();
  const docsCategory = location.pathname.split('/').filter(Boolean)[0] || 'unknown';
  const showDocsProCta = showDocs;
  const docsProRef = useProImpression('docs-navbar', { category: docsCategory }, showDocsProCta);
  const landingProRef = useProImpression('navbar', { surface: 'marketing' }, !showDocs);
  const mobileFilterQuery = mobileFilter.trim().toLowerCase();
  const onIndexPage = location.pathname === '/get-started/index';
  const mobileCategories = useMemo(
    () =>
      CATEGORIES.map((category, index) => ({
        ...category,
        index,
        subcategories:
          mobileFilterQuery && !category.name.toLowerCase().includes(mobileFilterQuery)
            ? category.subcategories.filter(item => item.toLowerCase().includes(mobileFilterQuery))
            : category.subcategories
      })),
    [mobileFilterQuery]
  );
  const mobileProSections = useMemo(
    () =>
      mobileFilterQuery
        ? PRO_SECTIONS.filter(section =>
            `${section.sidebarLabel || ''} ${section.label}`.toLowerCase().includes(mobileFilterQuery)
          )
        : PRO_SECTIONS,
    [mobileFilterQuery]
  );
  const mobileTools = useMemo(
    () => (mobileFilterQuery ? TOOLS.filter(tool => tool.label.toLowerCase().includes(mobileFilterQuery)) : TOOLS),
    [mobileFilterQuery]
  );
  const showMobileFavorites = !mobileFilterQuery || 'favorites saved'.includes(mobileFilterQuery);
  const mobileHasResults =
    showMobileFavorites ||
    mobileProSections.length > 0 ||
    mobileTools.length > 0 ||
    mobileCategories.some(category => category.subcategories.length > 0);

  const isActive = useCallback(
    match => {
      const matches = Array.isArray(match) ? match : [match];
      return matches.some(path => location.pathname === path || location.pathname.startsWith(`${path}/`));
    },
    [location.pathname]
  );

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen && mobileFilter) setMobileFilter('');
  }, [menuOpen, mobileFilter]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const positionHighlight = useCallback(el => {
    const highlight = highlightRef.current;
    const container = linksRef.current;
    if (!highlight || !container || !el) return;
    const linkRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    highlight.style.width = `${linkRect.width}px`;
    highlight.style.height = `${linkRect.height}px`;
    highlight.style.transform = `translateX(${linkRect.left - containerRect.left}px)`;
    highlight.style.opacity = '1';
  }, []);

  const getActiveEl = useCallback(() => {
    const container = linksRef.current;
    if (!container) return null;
    return container.querySelector('.ln-navbar-link-active');
  }, []);

  const handleLinkHover = useCallback(
    e => {
      positionHighlight(e.currentTarget);
    },
    [positionHighlight]
  );

  const handleLinksLeave = useCallback(() => {
    const activeEl = getActiveEl();
    if (activeEl) {
      positionHighlight(activeEl);
    } else {
      const highlight = highlightRef.current;
      if (highlight) highlight.style.opacity = '0';
    }
  }, [positionHighlight, getActiveEl]);

  // Position highlight on active link on mount and route change
  useEffect(() => {
    requestAnimationFrame(() => {
      const activeEl = getActiveEl();
      if (activeEl) positionHighlight(activeEl);
    });
  }, [location.pathname, positionHighlight, getActiveEl]);

  const formattedStars = useMemo(
    () => (stars >= 1000 ? `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}k` : stars),
    [stars]
  );

  const handlePrefsEnter = useCallback(() => {
    if (prefsTimeoutRef.current) clearTimeout(prefsTimeoutRef.current);
    setPrefsOpen(true);
  }, []);

  const handlePrefsLeave = useCallback(() => {
    prefsTimeoutRef.current = setTimeout(() => setPrefsOpen(false), 150);
  }, []);

  return (
    <header className={`ln-navbar${scrolled ? ' ln-navbar-scrolled' : ''}${showDocs ? ' ln-navbar-docs' : ''}`}>
      <div className="ln-navbar-inner">
        <div className="ln-navbar-left">
          <Link to="/" className="ln-navbar-logo">
            <Logo />
          </Link>

          <span className="ln-navbar-divider">/</span>

          <nav className="ln-navbar-links" ref={linksRef} onMouseLeave={handleLinksLeave}>
            <div className="ln-navbar-link-highlight" ref={highlightRef} />
            {NAV_LINKS.map(({ label, to, match }) => (
              <Link
                key={to}
                className={`ln-navbar-link${isActive(match) ? ' ln-navbar-link-active' : ''}`}
                to={to}
                onMouseEnter={handleLinkHover}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="ln-navbar-right">
          {showDocs && (
            <>
              <button className="ln-navbar-icon-btn ln-navbar-search-btn" onClick={toggleSearch} aria-label="Search">
                <LuSearch size={15} />
                <span className="ln-navbar-search-text">Search...</span>
                <kbd className="ln-navbar-kbd">/</kbd>
              </button>

              <div className="ln-navbar-prefs-wrapper" onMouseEnter={handlePrefsEnter} onMouseLeave={handlePrefsLeave}>
                <button
                  className="ln-navbar-icon-btn ln-navbar-prefs-trigger"
                  aria-label="Preferences"
                  aria-expanded={prefsOpen}
                  title="Preferences"
                  onClick={() => setPrefsOpen(true)}
                >
                  <LuSettings2 size={16} />
                </button>

                {prefsOpen && (
                  <div className="ln-navbar-prefs-menu">
                    <span className="ln-navbar-prefs-label">Language</span>
                    <div className="ln-navbar-toggle-group">
                      <button
                        className={`ln-navbar-toggle-item${languagePreset === 'JS' ? ' active' : ''}`}
                        onClick={() => setLanguagePreset('JS')}
                      >
                        <img src={jsIcon} alt="JS" width={18} height={18} />
                      </button>
                      <button
                        className={`ln-navbar-toggle-item${languagePreset === 'TS' ? ' active' : ''}`}
                        onClick={() => setLanguagePreset('TS')}
                      >
                        <img src={tsIcon} alt="TS" width={18} height={18} />
                      </button>
                    </div>
                    <span className="ln-navbar-prefs-label">Styling</span>
                    <div className="ln-navbar-toggle-group">
                      <button
                        className={`ln-navbar-toggle-item${stylePreset === 'CSS' ? ' active' : ''}`}
                        onClick={() => setStylePreset('CSS')}
                      >
                        <img src={cssIcon} alt="CSS" width={18} height={18} />
                      </button>
                      <button
                        className={`ln-navbar-toggle-item${stylePreset === 'TW' ? ' active' : ''}`}
                        onClick={() => setStylePreset('TW')}
                      >
                        <img src={twIcon} alt="TW" width={18} height={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            className="ln-navbar-icon-btn ln-navbar-theme-btn"
            onClick={toggleColorMode}
            aria-label={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
            title={isLightTheme ? 'Dark mode' : 'Light mode'}
          >
            {isLightTheme ? <LuMoon size={16} /> : <LuSun size={16} />}
          </button>

          <a className="ln-navbar-github" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <FaGithub size={16} />
            <span>{formattedStars}</span>
          </a>

          {showDocsProCta && (
            <a
              ref={docsProRef}
              {...proLinkProps('/#pricing', 'docs-navbar', {
                params: { category: docsCategory },
                sameTab: true
              })}
              className="ln-navbar-pro ln-navbar-pro-docs"
            >
              <span className="ln-navbar-pro-label ln-navbar-pro-label-desktop">Get React Bits Pro</span>
              <span className="ln-navbar-pro-label ln-navbar-pro-label-mobile">Get Pro</span>
            </a>
          )}

          {!showDocs && (
            <a
              ref={landingProRef}
              {...proLinkProps('/', 'navbar', { sameTab: true })}
              className="ln-navbar-pro"
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                e.currentTarget.style.setProperty('--pro-mx', `${x}%`);
              }}
            >
              <span className="ln-navbar-pro-label ln-navbar-pro-label-desktop">Get React Bits Pro</span>
              <span className="ln-navbar-pro-label ln-navbar-pro-label-mobile">Get Pro</span>
            </a>
          )}

          <button
            className={`ln-navbar-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {menuOpen && !showDocs && (
          <div className="ln-navbar-mobile-menu">
            {NAV_LINKS.map(({ label, to }) => (
              <Link key={to} className="ln-navbar-mobile-link" to={to} onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ln-navbar-mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <FaGithub size={14} /> GitHub
              </span>
              <span style={{ opacity: 0.6 }}>{formattedStars}</span>
            </a>
          </div>
        )}

        {menuOpen &&
          showDocs &&
          createPortal(
            <>
              <div className="ln-navbar-mobile-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="ln-navbar-mobile-menu ln-navbar-mobile-menu-docs">
                <div className="ln-navbar-mobile-scroll">
                  <Link
                    className="sidebar-browse sidebar-browse--menu"
                    to="/get-started/index"
                    aria-current={onIndexPage ? 'page' : undefined}
                    tabIndex={onIndexPage ? -1 : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <LuLayoutGrid size={14} aria-hidden="true" className="sidebar-browse__icon" />
                    <span className="sidebar-browse__label">
                      {onIndexPage ? 'Viewing all components' : 'Browse all components'}
                    </span>
                  </Link>

                  <label className="ln-navbar-mobile-filter">
                    <LuSearch size={14} aria-hidden="true" />
                    <input
                      value={mobileFilter}
                      onChange={event => setMobileFilter(event.target.value)}
                      placeholder={`Filter ${TOTAL_COMPONENTS} components...`}
                      aria-label="Filter navigation"
                    />
                  </label>

                  {mobileCategories.map(cat => {
                    return (
                      <div className="ln-navbar-mobile-section" key={cat.name}>
                        {(cat.subcategories.length > 0 || (cat.index === 0 && showMobileFavorites)) && (
                          <>
                            <span className="ln-navbar-mobile-label">{cat.name}</span>
                            <div className="ln-navbar-mobile-group">
                              {cat.subcategories.map(sub => {
                                const path = `/${slugify(cat.name)}/${slugify(sub)}`;
                                return (
                                  <Link
                                    key={sub}
                                    className={`ln-navbar-mobile-link${location.pathname === path ? ' ln-navbar-mobile-link-active' : ''}`}
                                    to={path}
                                    onClick={() => setMenuOpen(false)}
                                  >
                                    {sub}
                                  </Link>
                                );
                              })}
                              {cat.index === 0 && showMobileFavorites && (
                                <Link
                                  className={`ln-navbar-mobile-link${location.pathname === '/favorites' ? ' ln-navbar-mobile-link-active' : ''}`}
                                  to="/favorites"
                                  onClick={() => setMenuOpen(false)}
                                >
                                  Favorites
                                </Link>
                              )}
                            </div>
                          </>
                        )}

                        {cat.index === 0 && (
                          <>
                            {/* Mirrors the desktop sidebar, where Pro sits directly
                                below Get Started and above Tools. */}
                            {mobileProSections.length > 0 && (
                              <div className="ln-navbar-mobile-subsection">
                                <span className="ln-navbar-mobile-label ln-navbar-mobile-label-pro">Explore Pro</span>
                                <div className="ln-navbar-mobile-group">
                                  {mobileProSections.map(section => {
                                    const linkProps = proLinkProps(section.proPath, 'mobile-menu', {
                                      params: { section: section.slug }
                                    });
                                    const SectionIcon = section.icon;
                                    return (
                                      <a
                                        key={section.slug}
                                        className="ln-navbar-mobile-link ln-navbar-mobile-pro-link"
                                        {...linkProps}
                                        onClick={() => {
                                          linkProps.onClick();
                                          setMenuOpen(false);
                                        }}
                                      >
                                        <SectionIcon size={14} aria-hidden="true" />
                                        <span>{section.sidebarLabel || section.label}</span>
                                        {section.freeCount && (
                                          <span className="ln-navbar-mobile-free-tag">{section.freeCount} Free</span>
                                        )}
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {mobileTools.length > 0 && (
                              <div className="ln-navbar-mobile-subsection">
                                <span className="ln-navbar-mobile-label">Tools</span>
                                <div className="ln-navbar-mobile-group">
                                  {mobileTools.map(tool => (
                                    <Link
                                      key={tool.id}
                                      className={`ln-navbar-mobile-link${location.pathname === tool.path ? ' ln-navbar-mobile-link-active' : ''}`}
                                      to={tool.path}
                                      onClick={() => setMenuOpen(false)}
                                    >
                                      {tool.label}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {!mobileHasResults && <p className="ln-navbar-mobile-empty">No matching pages</p>}
                </div>
              </div>
            </>,
            document.body
          )}
      </div>
    </header>
  );
};

export default Navbar;
