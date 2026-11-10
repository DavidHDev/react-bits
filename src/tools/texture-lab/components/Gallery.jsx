import { useRef } from 'react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '../../background-studio/components/ui';
import { useScrollEdges } from '../../background-studio/hooks/useScrollEdges';

export function GallerySearch({ value, onChange, placeholder, inputRef }) {
  return (
    <label className="bs-search lab-search">
      <Icon icon={Search01Icon} size={15} />
      <input
        ref={inputRef}
        value={value}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape' && value) {
            event.stopPropagation();
            onChange('');
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        spellCheck={false}
        autoComplete="off"
      />
    </label>
  );
}

export function GalleryScroll({ children }) {
  const scrollRef = useRef(null);
  const edges = useScrollEdges(scrollRef);
  return (
    <div className="lab-scroll-shell" data-top={edges.top ? '' : undefined} data-bottom={edges.bottom ? '' : undefined}>
      <div className="lab-scroll" ref={scrollRef}>
        {children}
      </div>
    </div>
  );
}
