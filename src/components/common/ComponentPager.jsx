import { useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../constants/Categories';

const slug = value => value.replace(/\s+/g, '-').toLowerCase();

const COMPONENT_ROUTES = CATEGORIES.filter(category => category.name !== 'Get Started').flatMap(category =>
  category.subcategories.map(component => ({
    category: category.name,
    component,
    path: `/${slug(category.name)}/${slug(component)}`
  }))
);

const SHORTCUTS = { previous: '[', next: ']' };

const isEditable = target =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    Boolean(target.closest('[role="textbox"], [role="combobox"], [contenteditable="true"]')));

const PagerLink = ({ item, direction }) => {
  const previous = direction === 'previous';

  if (!item) {
    return (
      <span className={`component-pager-empty component-pager-${direction}`}>
        <span>
          <span className="component-pager-label">Collection</span>
          <span className="component-pager-name">{previous ? 'Start of library' : 'End of library'}</span>
        </span>
      </span>
    );
  }

  return (
    <Link
      className={`component-pager-link component-pager-${direction}`}
      to={item.path}
      aria-keyshortcuts={SHORTCUTS[direction]}
    >
      {previous ? <ArrowLeft size={16} aria-hidden="true" /> : null}
      <span>
        <span className="component-pager-label">
          {previous ? 'Previous' : 'Next'}
          <kbd className="component-pager-key" aria-hidden="true">
            {SHORTCUTS[direction]}
          </kbd>
        </span>
        <span className="component-pager-name">{item.component}</span>
      </span>
      {!previous ? <ArrowRight size={16} aria-hidden="true" /> : null}
    </Link>
  );
};

const ComponentPager = ({ category, subcategory }) => {
  const navigate = useNavigate();
  const path = `/${category}/${subcategory}`;
  const index = COMPONENT_ROUTES.findIndex(item => item.path === path);
  const previous = index > 0 ? COMPONENT_ROUTES[index - 1] : null;
  const next = index >= 0 ? (COMPONENT_ROUTES[index + 1] ?? null) : null;

  useEffect(() => {
    if (index < 0) return undefined;
    const onKeyDown = event => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      if (event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return;
      const target = event.key === SHORTCUTS.previous ? previous : event.key === SHORTCUTS.next ? next : null;
      if (!target) return;
      event.preventDefault();
      navigate(target.path);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, previous, next, navigate]);

  if (index < 0) return null;

  return (
    <nav className="component-pager" aria-label="Component navigation">
      <PagerLink item={previous} direction="previous" />
      <PagerLink item={next} direction="next" />
    </nav>
  );
};

export default ComponentPager;
